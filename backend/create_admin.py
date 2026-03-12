import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from passlib.context import CryptContext
from pymongo import MongoClient


def main() -> int:
    root_dir = Path(__file__).parent
    load_dotenv(root_dir / ".env")

    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    # Use a non-reserved domain by default; Pydantic EmailStr rejects special-use domains like ".local"
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "123456")
    full_name = os.environ.get("ADMIN_FULL_NAME", "Admin")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    client = MongoClient(mongo_url)
    try:
        db = client[db_name]
        users = db["users"]

        existing = users.find_one({"email": email}, {"_id": 0})
        if existing:
            if existing.get("role") != "admin":
                users.update_one({"email": email}, {"$set": {"role": "admin"}})
                print(f"Updated existing user to admin: {email}")
            else:
                print(f"Admin already exists: {email}")
            return 0

        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "full_name": full_name,
            "role": "admin",
            "created_at": now.isoformat(),
            "hashed_password": pwd_context.hash(password),
        }
        users.insert_one(doc)

        print("Created admin user:")
        print(f"  email: {email}")
        print(f"  password: {password}")
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())

