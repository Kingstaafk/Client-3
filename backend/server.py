from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        yield
    finally:
        client.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "customer"  # customer or admin

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ProductBase(BaseModel):
    name: str
    category: str  # ring, necklace, earrings, bracelet, bangles
    subcategory: str  # gold, diamond, silver
    description: str
    weight: float  # in grams
    purity: str  # 22K, 18K, etc.
    metal_price: float
    making_charges: float
    gst: float
    total_price: float
    image_url: str
    images: List[str] = []  # Additional images
    in_stock: bool = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1

class CartItem(CartItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderBase(BaseModel):
    items: List[dict]
    total_amount: float
    shipping_address: dict
    payment_method: str

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "pending"  # pending, confirmed, shipped, delivered
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SellJewelleryBase(BaseModel):
    jewellery_type: str
    weight: float
    purity: str
    description: Optional[str] = None
    estimated_value: Optional[float] = None

class SellJewelleryCreate(SellJewelleryBase):
    pass

class SellJewellery(SellJewelleryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "pending"  # pending, reviewed, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SavedItemBase(BaseModel):
    product_id: str

class SavedItem(SavedItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ AUTH HELPERS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============ AUTH ROUTES ============

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_input: UserCreate):
    existing_user = await db.users.find_one({"email": user_input.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_input.model_dump(exclude={"password"})
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['hashed_password'] = get_password_hash(user_input.password)
    
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(user_input: UserLogin):
    user = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_input.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'hashed_password'})
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ PRODUCT ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    query = {}
    if category:
        query['category'] = category
    if subcategory:
        query['subcategory'] = subcategory
    if min_price is not None or max_price is not None:
        query['total_price'] = {}
        if min_price is not None:
            query['total_price']['$gte'] = min_price
        if max_price is not None:
            query['total_price']['$lte'] = max_price
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_input: ProductCreate, current_user: User = Depends(get_current_admin)):
    product_obj = Product(**product_input.model_dump())
    
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_input: ProductCreate, current_user: User = Depends(get_current_admin)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_input.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ============ CART ROUTES ============

@api_router.get("/cart", response_model=List[dict])
async def get_cart(current_user: User = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Fetch product details for each cart item
    enriched_items = []
    for item in cart_items:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            enriched_items.append({
                "cart_item": item,
                "product": product
            })
    
    return enriched_items

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item_input: CartItemBase, current_user: User = Depends(get_current_user)):
    # Check if item already exists in cart
    existing_item = await db.cart.find_one({"user_id": current_user.id, "product_id": item_input.product_id})
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item['quantity'] + item_input.quantity
        await db.cart.update_one(
            {"user_id": current_user.id, "product_id": item_input.product_id},
            {"$set": {"quantity": new_quantity}}
        )
        existing_item['quantity'] = new_quantity
        if isinstance(existing_item.get('added_at'), str):
            existing_item['added_at'] = datetime.fromisoformat(existing_item['added_at'])
        return CartItem(**existing_item)
    
    cart_item = CartItem(**item_input.model_dump(), user_id=current_user.id)
    
    doc = cart_item.model_dump()
    doc['added_at'] = doc['added_at'].isoformat()
    
    await db.cart.insert_one(doc)
    return cart_item

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int, current_user: User = Depends(get_current_user)):
    result = await db.cart.update_one(
        {"id": item_id, "user_id": current_user.id},
        {"$set": {"quantity": quantity}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Cart updated successfully"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: User = Depends(get_current_user)):
    result = await db.cart.delete_one({"id": item_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.cart.delete_many({"user_id": current_user.id})
    return {"message": "Cart cleared successfully"}

# ============ ORDER ROUTES ============

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate, current_user: User = Depends(get_current_user)):
    order_obj = Order(**order_input.model_dump(), user_id=current_user.id)
    
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Clear cart after order
    await db.cart.delete_many({"user_id": current_user.id})
    
    return order_obj

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_admin)):
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}

# ============ SELL JEWELLERY ROUTES ============

@api_router.get("/sell-jewellery", response_model=List[SellJewellery])
async def get_sell_requests(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        requests = await db.sell_jewellery.find({}, {"_id": 0}).to_list(1000)
    else:
        requests = await db.sell_jewellery.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for request in requests:
        if isinstance(request.get('created_at'), str):
            request['created_at'] = datetime.fromisoformat(request['created_at'])
    
    return requests

@api_router.post("/sell-jewellery", response_model=SellJewellery)
async def create_sell_request(request_input: SellJewelleryCreate, current_user: User = Depends(get_current_user)):
    # Simple valuation logic (can be enhanced)
    base_rate_per_gram = {
        "22K": 5000,
        "18K": 4000,
        "14K": 3000,
        "24K": 5500
    }
    
    purity = request_input.purity
    estimated_value = request_input.weight * base_rate_per_gram.get(purity, 3000)
    
    # Create the sell object with calculated estimated value
    request_data = request_input.model_dump()
    request_data['estimated_value'] = estimated_value
    
    sell_obj = SellJewellery(
        **request_data,
        user_id=current_user.id
    )
    
    doc = sell_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.sell_jewellery.insert_one(doc)
    return sell_obj

@api_router.put("/sell-jewellery/{request_id}")
async def update_sell_request(request_id: str, status: str, estimated_value: Optional[float] = None, current_user: User = Depends(get_current_admin)):
    update_data = {"status": status}
    if estimated_value is not None:
        update_data["estimated_value"] = estimated_value
    
    result = await db.sell_jewellery.update_one({"id": request_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sell request not found")
    return {"message": "Sell request updated successfully"}

# ============ SAVED ITEMS ROUTES ============

@api_router.get("/saved-items", response_model=List[dict])
async def get_saved_items(current_user: User = Depends(get_current_user)):
    saved_items = await db.saved_items.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    enriched_items = []
    for item in saved_items:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            enriched_items.append({
                "saved_item": item,
                "product": product
            })
    
    return enriched_items

@api_router.post("/saved-items")
async def save_item(item_input: SavedItemBase, current_user: User = Depends(get_current_user)):
    existing = await db.saved_items.find_one({"user_id": current_user.id, "product_id": item_input.product_id})
    if existing:
        return {"message": "Item already saved"}
    
    saved_item = SavedItem(**item_input.model_dump(), user_id=current_user.id)
    
    doc = saved_item.model_dump()
    doc['saved_at'] = doc['saved_at'].isoformat()
    
    await db.saved_items.insert_one(doc)
    return {"message": "Item saved successfully"}

@api_router.delete("/saved-items/{product_id}")
async def unsave_item(product_id: str, current_user: User = Depends(get_current_user)):
    result = await db.saved_items.delete_one({"user_id": current_user.id, "product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return {"message": "Item removed from saved items"}

# ============ ADMIN STATS ============

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    pending_sell_requests = await db.sell_jewellery.count_documents({"status": "pending"})
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "pending_sell_requests": pending_sell_requests
    }

# Include the router in the main app
app.include_router(api_router)

# CORS configuration: prefer env, but fall back to known frontends
cors_origins_env = os.environ.get("CORS_ORIGINS")
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://client-3-1.onrender.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)