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

# =============================
# ROUTER REGISTER
# =============================

app.include_router(api_router)

# =============================
# LOGGING
# =============================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)