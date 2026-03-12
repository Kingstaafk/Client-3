from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from contextlib import asynccontextmanager
import os
import uuid
import logging

# =============================
# ENVIRONMENT SETUP
# =============================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URL or not DB_NAME:
    raise Exception("Missing MONGO_URL or DB_NAME in environment variables")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# =============================
# DATABASE CONNECTION
# =============================

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# =============================
# SECURITY
# =============================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# =============================
# FASTAPI APP
# =============================

@asynccontextmanager
async def lifespan(_: FastAPI):
    print("Starting FastAPI server...")
    yield
    client.close()
    print("MongoDB connection closed")

app = FastAPI(lifespan=lifespan)

# =============================
# CORS (MUST BE BEFORE ROUTERS)
# =============================

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://client-3-1.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# ROUTER
# =============================

api_router = APIRouter(prefix="/api")

# =============================
# MODELS
# =============================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "customer"

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
    category: str
    subcategory: str
    description: str
    weight: float
    purity: str
    metal_price: float
    making_charges: float
    gst: float
    total_price: float
    image_url: str
    images: List[str] = []
    in_stock: bool = True

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: str | None = ""
    city: str
    state: str
    pincode: str


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total_amount: float
    shipping_address: ShippingAddress
    payment_method: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SellRequestBase(BaseModel):
    jewellery_type: str
    weight: float
    purity: str
    description: str | None = ""


class SellRequest(SellRequestBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str = "pending"
    estimated_value: float | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SavedItemBase(BaseModel):
    product_id: str


class SavedItem(SavedItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# =============================
# AUTH HELPERS
# =============================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])

    return User(**user)

async def get_current_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user

# =============================
# AUTH ROUTES
# =============================

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_input: UserCreate):

    existing = await db.users.find_one({"email": user_input.email})

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=user_input.email, full_name=user_input.full_name)

    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["hashed_password"] = get_password_hash(user_input.password)

    await db.users.insert_one(doc)

    token = create_access_token({"sub": user.id})

    return Token(access_token=token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_input: UserLogin):

    user = await db.users.find_one({"email": user_input.email}, {"_id": 0})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user_input.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])

    user_obj = User(**{k: v for k, v in user.items() if k != "hashed_password"})

    token = create_access_token({"sub": user_obj.id})

    return Token(access_token=token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

# =============================
# PRODUCT ROUTES
# =============================

@api_router.get("/products", response_model=List[Product])
async def get_products():

    products = await db.products.find({}, {"_id": 0}).to_list(1000)

    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])

    return products

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductBase, admin: User = Depends(get_current_admin)):

    prod = Product(**product.model_dump())

    doc = prod.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.products.insert_one(doc)

    return prod


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])

    return Product(**product)


# =============================
# CART ROUTES
# =============================

@api_router.get("/cart")
async def get_cart(user: User = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    if not cart_items:
        return []

    product_ids = [item["product_id"] for item in cart_items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(1000)
    products_by_id = {p["id"]: p for p in products}

    result = []
    for item in cart_items:
        product = products_by_id.get(item["product_id"])
        if not product:
            continue
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
        result.append({"cart_item": item, "product": product})

    return result


@api_router.post("/cart")
async def add_to_cart(payload: CartItemBase, user: User = Depends(get_current_user)):
    existing = await db.cart.find_one(
        {"user_id": user.id, "product_id": payload.product_id}, {"_id": 0}
    )
    if existing:
        new_qty = existing.get("quantity", 1) + payload.quantity
        await db.cart.update_one(
            {"id": existing["id"]}, {"$set": {"quantity": new_qty}}
        )
        existing["quantity"] = new_qty
        return existing

    item = CartItem(user_id=user.id, **payload.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.cart.insert_one(doc)
    return item


@api_router.put("/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, quantity: int, user: User = Depends(get_current_user)):
    if quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    result = await db.cart.update_one(
        {"id": cart_item_id, "user_id": user.id},
        {"$set": {"quantity": quantity}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"status": "ok"}


@api_router.delete("/cart/{cart_item_id}")
async def delete_cart_item(cart_item_id: str, user: User = Depends(get_current_user)):
    result = await db.cart.delete_one({"id": cart_item_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"status": "ok"}


# =============================
# ORDER ROUTES
# =============================

@api_router.post("/orders", response_model=Order)
async def create_order(order: Order, user: User = Depends(get_current_user)):
    order.user_id = user.id
    if isinstance(order.created_at, str):
        order.created_at = datetime.fromisoformat(order.created_at)

    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.orders.insert_one(doc)
    return order


@api_router.get("/orders", response_model=List[Order])
async def get_orders(user: User = Depends(get_current_user)):
    query = {"user_id": user.id}
    docs = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [Order(**d) for d in docs]


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin: User = Depends(get_current_admin)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": "ok"}


# =============================
# SELL JEWELLERY ROUTES
# =============================

@api_router.post("/sell-jewellery", response_model=SellRequest)
async def create_sell_request(payload: SellRequestBase, user: User = Depends(get_current_user)):
    req = SellRequest(user_id=user.id, **payload.model_dump())
    doc = req.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.sell_jewellery.insert_one(doc)
    return req


@api_router.get("/sell-jewellery", response_model=List[SellRequest])
async def get_sell_requests(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != "admin":
        query["user_id"] = current_user.id

    docs = await db.sell_jewellery.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [SellRequest(**d) for d in docs]


@api_router.put("/sell-jewellery/{request_id}")
async def update_sell_request(
    request_id: str,
    status: str,
    estimated_value: float | None = None,
    admin: User = Depends(get_current_admin),
):
    update_data: dict = {"status": status}
    if estimated_value is not None:
        update_data["estimated_value"] = estimated_value

    result = await db.sell_jewellery.update_one(
        {"id": request_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sell request not found")
    return {"status": "ok"}


# =============================
# SAVED ITEMS ROUTES
# =============================

@api_router.post("/saved-items")
async def save_item(payload: SavedItemBase, user: User = Depends(get_current_user)):
    existing = await db.saved_items.find_one(
        {"user_id": user.id, "product_id": payload.product_id}, {"_id": 0}
    )
    if existing:
        return existing

    item = SavedItem(user_id=user.id, **payload.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.saved_items.insert_one(doc)
    return item


@api_router.get("/saved-items")
async def get_saved_items(user: User = Depends(get_current_user)):
    saved = await db.saved_items.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    if not saved:
        return []

    product_ids = [s["product_id"] for s in saved]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(1000)
    products_by_id = {p["id"]: p for p in products}

    result = []
    for s in saved:
        product = products_by_id.get(s["product_id"])
        if not product:
            continue
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
        result.append({"saved_item": s, "product": product})

    return result


@api_router.delete("/saved-items/{product_id}")
async def delete_saved_item(product_id: str, user: User = Depends(get_current_user)):
    result = await db.saved_items.delete_one({"user_id": user.id, "product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return {"status": "ok"}


# =============================
# ADMIN ROUTES
# =============================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    pending_sell_requests = await db.sell_jewellery.count_documents({"status": "pending"})

    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "pending_sell_requests": pending_sell_requests,
    }

# =============================
# ROUTER REGISTER
# =============================

app.include_router(api_router)

# =============================
# LOGGING
# =============================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)