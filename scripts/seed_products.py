import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(env_path)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Sample products
products = [
    {
        "id": "prod-001",
        "name": "Classic Gold Necklace",
        "category": "necklace",
        "subcategory": "gold",
        "description": "Elegant 22K gold necklace with traditional design. Perfect for weddings and special occasions.",
        "weight": 15.5,
        "purity": "22K",
        "metal_price": 85000,
        "making_charges": 8500,
        "gst": 2805,
        "total_price": 96305,
        "image_url": "https://images.unsplash.com/photo-1728646995777-6dbb354691e3",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-002",
        "name": "Diamond Solitaire Ring",
        "category": "ring",
        "subcategory": "diamond",
        "description": "Stunning diamond solitaire ring with 18K gold band. Certified diamond with excellent cut.",
        "weight": 3.2,
        "purity": "18K",
        "metal_price": 125000,
        "making_charges": 15000,
        "gst": 4200,
        "total_price": 144200,
        "image_url": "https://images.unsplash.com/photo-1696774665695-2f237304c3b0",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-003",
        "name": "Traditional Gold Bangles",
        "category": "bangles",
        "subcategory": "gold",
        "description": "Set of 2 traditional 22K gold bangles with intricate design. Hallmark certified.",
        "weight": 45.0,
        "purity": "22K",
        "metal_price": 245000,
        "making_charges": 24500,
        "gst": 8085,
        "total_price": 277585,
        "image_url": "https://images.pexels.com/photos/2064505/pexels-photo-2064505.jpeg",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-004",
        "name": "Minimalist Gold Earrings",
        "category": "earrings",
        "subcategory": "gold",
        "description": "Modern minimalist 18K gold earrings. Perfect for daily wear with elegant simplicity.",
        "weight": 2.5,
        "purity": "18K",
        "metal_price": 15000,
        "making_charges": 2000,
        "gst": 510,
        "total_price": 17510,
        "image_url": "https://images.pexels.com/photos/12194350/pexels-photo-12194350.jpeg",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-005",
        "name": "Diamond Tennis Bracelet",
        "category": "bracelet",
        "subcategory": "diamond",
        "description": "Luxurious diamond tennis bracelet with 18K white gold. Features brilliant cut diamonds.",
        "weight": 8.5,
        "purity": "18K",
        "metal_price": 185000,
        "making_charges": 20000,
        "gst": 6150,
        "total_price": 211150,
        "image_url": "https://images.pexels.com/photos/8398911/pexels-photo-8398911.jpeg",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-006",
        "name": "Gold Pendant with Chain",
        "category": "necklace",
        "subcategory": "gold",
        "description": "Beautiful 22K gold pendant with matching chain. Elegant design suitable for all occasions.",
        "weight": 8.2,
        "purity": "22K",
        "metal_price": 45000,
        "making_charges": 4500,
        "gst": 1485,
        "total_price": 50985,
        "image_url": "https://images.unsplash.com/photo-1583791030450-950c8e4a2a8e",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-007",
        "name": "Blue Sapphire Gold Ring",
        "category": "ring",
        "subcategory": "diamond",
        "description": "Exquisite blue sapphire ring with diamond accents in 18K gold. Certified gemstones.",
        "weight": 4.0,
        "purity": "18K",
        "metal_price": 95000,
        "making_charges": 12000,
        "gst": 3210,
        "total_price": 110210,
        "image_url": "https://images.unsplash.com/photo-1762019313711-8b5d1e4f7ba4",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "prod-008",
        "name": "Silver Oxidized Necklace",
        "category": "necklace",
        "subcategory": "silver",
        "description": "Traditional oxidized silver necklace with ethnic design. Lightweight and comfortable.",
        "weight": 25.0,
        "purity": "925",
        "metal_price": 8500,
        "making_charges": 1500,
        "gst": 300,
        "total_price": 10300,
        "image_url": "https://images.unsplash.com/photo-1583791030450-950c8e4a2a8e",
        "images": [],
        "in_stock": True,
        "created_at": "2025-01-15T10:00:00Z"
    }
]

# Admin user for seeding
admin_user = {
    "id": "admin-001",
    "email": "admin@luxejewels.com",
    "full_name": "Admin User",
    "role": "admin",
    "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aqg1.7P1Jfsu",  # password: admin123
    "created_at": "2025-01-15T10:00:00Z"
}

async def seed_database():
    try:
        # Clear existing data
        await db.products.delete_many({})
        print("Cleared existing products")
        
        # Insert sample products
        await db.products.insert_many(products)
        print(f"Inserted {len(products)} sample products")
        
        # Check if admin exists
        existing_admin = await db.users.find_one({"email": admin_user["email"]})
        if not existing_admin:
            await db.users.insert_one(admin_user)
            print("Created admin user (email: admin@luxejewels.com, password: admin123)")
        else:
            print("Admin user already exists")
        
        print("\nDatabase seeded successfully!")
        print("You can now login with:")
        print("  Email: admin@luxejewels.com")
        print("  Password: admin123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
