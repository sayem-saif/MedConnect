import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

async def create_sample_user():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": "demo@medconnect.com"})
    
    if existing_user:
        print("Sample user already exists!")
        print("Email: demo@medconnect.com")
        print("Password: Demo@123")
        return
    
    # Create sample patient user
    hashed_password = bcrypt.hashpw("Demo@123".encode('utf-8'), bcrypt.gensalt())
    
    patient_user = {
        "name": "Demo Patient",
        "email": "demo@medconnect.com",
        "password": hashed_password.decode('utf-8'),
        "role": "patient",
        "phone": "+1234567890",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(patient_user)
    print("✅ Sample patient user created successfully!")
    print("\n📧 Login Credentials:")
    print("Email: demo@medconnect.com")
    print("Password: Demo@123")
    print("Role: Patient")
    
    # Create sample hospital staff user
    hashed_password_staff = bcrypt.hashpw("Staff@123".encode('utf-8'), bcrypt.gensalt())
    
    staff_user = {
        "name": "Hospital Admin",
        "email": "admin@medconnect.com",
        "password": hashed_password_staff.decode('utf-8'),
        "role": "hospital_staff",
        "phone": "+1234567891",
        "hospital_id": None,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(staff_user)
    print("\n✅ Sample hospital staff user created successfully!")
    print("\n📧 Login Credentials:")
    print("Email: admin@medconnect.com")
    print("Password: Staff@123")
    print("Role: Hospital Staff")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_user())
