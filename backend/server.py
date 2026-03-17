from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import os
import logging
import socketio
import asyncio
import bcrypt
import base64
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Socket.IO setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function for ObjectId
def str_id(obj):
    if obj and isinstance(obj.get('_id'), ObjectId):
        obj['_id'] = str(obj['_id'])
    return obj

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "patient"  # patient or hospital_staff
    phone: Optional[str] = None
    hospital_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float
    phone: str
    email: EmailStr
    total_icu_beds: int = 0
    available_icu_beds: int = 0
    total_ccu_beds: int = 0
    available_ccu_beds: int = 0
    total_nicu_beds: int = 0
    available_nicu_beds: int = 0
    total_general_beds: int = 0
    available_general_beds: int = 0
    total_oxygen_beds: int = 0
    available_oxygen_beds: int = 0
    total_non_oxygen_beds: int = 0
    available_non_oxygen_beds: int = 0
    oxygen_supply_available: bool = True
    accepts_insurance: bool = True
    emergency_contact: str

class BedBookingCreate(BaseModel):
    user_id: str
    hospital_id: str
    bed_type: str  # ICU, NICU, General
    patient_name: str
    patient_age: int
    patient_gender: str
    symptoms: str
    emergency_level: str  # Critical, High, Medium
    documents: Optional[List[str]] = []  # base64 encoded documents
    token_amount: float = 1000.0

class AmbulanceRequest(BaseModel):
    user_id: str
    pickup_latitude: float
    pickup_longitude: float
    pickup_address: str
    hospital_id: Optional[str] = None
    patient_name: str
    patient_condition: str
    emergency_level: str

class SymptomCheck(BaseModel):
    user_id: str
    symptoms: str
    session_id: Optional[str] = None

class BloodRequest(BaseModel):
    blood_type: str
    latitude: float
    longitude: float
    urgency: str  # Critical, High, Medium

class UserProfileSectionUpdate(BaseModel):
    section: str
    data: Dict[str, Any]

class UserPreferencesUpdate(BaseModel):
    selected_hospital: Optional[Dict[str, Any]] = None
    selected_location: Optional[Dict[str, Any]] = None

# ==================== AUTHENTICATION ====================

@api_router.post("/auth/register")
async def register_user(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password.decode('utf-8'),
        "role": user.role,
        "phone": user.phone,
        "hospital_id": user.hospital_id,
        "profile": {
            "personal_information": {},
            "medical_records": {},
            "emergency_contacts": {},
            "insurance_information": {},
            "notifications": {},
            "privacy_security": {},
            "help_support": {},
        },
        "preferences": {
            "selected_hospital": None,
            "selected_location": None,
        },
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    del user_doc["password"]
    
    return {"success": True, "user": str_id(user_doc)}

@api_router.post("/auth/login")
async def login_user(login: UserLogin):
    user = await db.users.find_one({"email": login.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(login.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if "profile" not in user or "preferences" not in user:
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "profile": user.get("profile", {
                        "personal_information": {},
                        "medical_records": {},
                        "emergency_contacts": {},
                        "insurance_information": {},
                        "notifications": {},
                        "privacy_security": {},
                        "help_support": {},
                    }),
                    "preferences": user.get("preferences", {
                        "selected_hospital": None,
                        "selected_location": None,
                    }),
                }
            },
        )
        user = await db.users.find_one({"_id": user["_id"]})
    
    del user["password"]
    return {"success": True, "user": str_id(user)}

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        profile = user.get("profile", {
            "personal_information": {},
            "medical_records": {},
            "emergency_contacts": {},
            "insurance_information": {},
            "notifications": {},
            "privacy_security": {},
            "help_support": {},
        })
        preferences = user.get("preferences", {
            "selected_hospital": None,
            "selected_location": None,
        })

        return {"success": True, "profile": profile, "preferences": preferences}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/users/{user_id}/profile-section")
async def update_user_profile_section(user_id: str, payload: UserProfileSectionUpdate):
    try:
        allowed_sections = {
            "personal_information",
            "medical_records",
            "emergency_contacts",
            "insurance_information",
            "notifications",
            "privacy_security",
            "help_support",
        }
        if payload.section not in allowed_sections:
            raise HTTPException(status_code=400, detail="Invalid profile section")

        update_field = f"profile.{payload.section}"
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    update_field: payload.data,
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=False,
        )

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "section": payload.section,
            "data": user.get("profile", {}).get(payload.section, {}),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, payload: UserPreferencesUpdate):
    try:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "preferences.selected_hospital": payload.selected_hospital,
                    "preferences.selected_location": payload.selected_location,
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=False,
        )

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "preferences": user.get("preferences", {}),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/user/{user_id}")
async def get_user(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        del user["password"]
        return str_id(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== HOSPITALS ====================

@api_router.get("/hospitals")
async def get_hospitals(
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    bed_type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    query = {}
    if city:
        city_regex = city
        if city.strip().lower() in ["gurgaon", "gurugram"]:
            city_regex = "Gurgaon|Gurugram"
        query["city"] = {"$regex": city_regex, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    
    if bed_type:
        if bed_type == "ICU":
            query["available_icu_beds"] = {"$gt": 0}
        elif bed_type == "NICU":
            query["available_nicu_beds"] = {"$gt": 0}
        elif bed_type == "General":
            query["available_general_beds"] = {"$gt": 0}
    
    hospitals = await db.hospitals.find(query).to_list(100)
    
    # Calculate availability status and distance
    for hospital in hospitals:
        total_available = (hospital.get("available_icu_beds", 0) + 
                          hospital.get("available_ccu_beds", 0) +
                          hospital.get("available_nicu_beds", 0) + 
                          hospital.get("available_general_beds", 0) +
                          hospital.get("available_oxygen_beds", 0) +
                          hospital.get("available_non_oxygen_beds", 0))
        total_beds = (hospital.get("total_icu_beds", 0) + 
                     hospital.get("total_ccu_beds", 0) +
                     hospital.get("total_nicu_beds", 0) + 
                     hospital.get("total_general_beds", 0) +
                     hospital.get("total_oxygen_beds", 0) +
                     hospital.get("total_non_oxygen_beds", 0))
        
        if total_available == 0:
            hospital["status"] = "full"
        elif total_available < total_beds * 0.3:
            hospital["status"] = "limited"
        else:
            hospital["status"] = "available"
        
        # Simple distance calculation (in real app, use proper geo calculations)
        if lat and lng:
            import math
            hospital_lat = hospital.get("latitude", 0)
            hospital_lng = hospital.get("longitude", 0)
            distance = math.sqrt((lat - hospital_lat)**2 + (lng - hospital_lng)**2) * 111  # rough km
            hospital["distance"] = round(distance, 1)

        total_general_beds = hospital.get("total_general_beds", 0)
        available_general_beds = hospital.get("available_general_beds", 0)

        total_ccu_beds = hospital.get("total_ccu_beds", 0) or max(5, int(hospital.get("total_icu_beds", 0) * 0.5))
        available_ccu_beds = hospital.get("available_ccu_beds", 0) or max(1, int(hospital.get("available_icu_beds", 0) * 0.5))
        total_oxygen_beds = hospital.get("total_oxygen_beds", 0) or max(10, int(total_general_beds * 0.35))
        available_oxygen_beds = hospital.get("available_oxygen_beds", 0) or max(2, int(available_general_beds * 0.30))
        total_non_oxygen_beds = hospital.get("total_non_oxygen_beds", 0) or max(10, int(total_general_beds * 0.65))
        available_non_oxygen_beds = hospital.get("available_non_oxygen_beds", 0) or max(2, int(available_general_beds * 0.70))

        oxygen_supply_available = hospital.get("oxygen_supply_available")
        if oxygen_supply_available is None:
            oxygen_supply_available = available_oxygen_beds > 0

        hospital["live_availability"] = {
            "oxygen_supply_available": bool(oxygen_supply_available),
            "icu": {
                "available": hospital.get("available_icu_beds", 0),
                "total": hospital.get("total_icu_beds", 0),
            },
            "ccu": {
                "available": available_ccu_beds,
                "total": total_ccu_beds,
            },
            "nicu": {
                "available": hospital.get("available_nicu_beds", 0),
                "total": hospital.get("total_nicu_beds", 0),
            },
            "general_ward": {
                "available": available_general_beds,
                "total": total_general_beds,
            },
            "oxygen_ward": {
                "available": available_oxygen_beds,
                "total": total_oxygen_beds,
            },
            "non_oxygen_ward": {
                "available": available_non_oxygen_beds,
                "total": total_non_oxygen_beds,
            },
            "last_updated": datetime.utcnow().isoformat() + "Z",
        }
        
        if isinstance(hospital.get("_id"), ObjectId):
            hospital["_id"] = str(hospital["_id"])
    
    return hospitals

@api_router.get("/hospitals/{hospital_id}")
async def get_hospital(hospital_id: str):
    try:
        hospital = await db.hospitals.find_one({"_id": ObjectId(hospital_id)})
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return str_id(hospital)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/hospitals")
async def create_hospital(hospital: HospitalCreate):
    hospital_doc = hospital.dict()
    hospital_doc["created_at"] = datetime.utcnow()
    result = await db.hospitals.insert_one(hospital_doc)
    hospital_doc["_id"] = str(result.inserted_id)
    return {"success": True, "hospital": hospital_doc}

# ==================== BED BOOKING ====================

@api_router.post("/bookings")
async def create_booking(booking: BedBookingCreate):
    try:
        # Check bed availability
        hospital = await db.hospitals.find_one({"_id": ObjectId(booking.hospital_id)})
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        bed_field = f"available_{booking.bed_type.lower()}_beds"
        if hospital.get(bed_field, 0) <= 0:
            raise HTTPException(status_code=400, detail="No beds available")
        
        # Create booking
        booking_doc = booking.dict()
        booking_doc["status"] = "confirmed"
        booking_doc["queue_number"] = f"A-{await db.bookings.count_documents({}) + 1}"
        booking_doc["created_at"] = datetime.utcnow()
        booking_doc["estimated_wait_time"] = 15  # minutes
        
        result = await db.bookings.insert_one(booking_doc)
        booking_doc["_id"] = str(result.inserted_id)
        
        # Update bed availability
        await db.hospitals.update_one(
            {"_id": ObjectId(booking.hospital_id)},
            {"$inc": {bed_field: -1}}
        )
        
        # Emit real-time update
        await sio.emit('bed_update', {'hospital_id': booking.hospital_id})
        
        return {"success": True, "booking": str_id(booking_doc)}
    except Exception as e:
        logger.error(f"Booking error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/bookings/user/{user_id}")
async def get_user_bookings(user_id: str):
    bookings = await db.bookings.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    for booking in bookings:
        booking = str_id(booking)
        # Get hospital name
        hospital = await db.hospitals.find_one({"_id": ObjectId(booking["hospital_id"])})
        if hospital:
            booking["hospital_name"] = hospital.get("name")
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return str_id(booking)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== AMBULANCE ====================

@api_router.post("/ambulance/request")
async def request_ambulance(request: AmbulanceRequest):
    ambulance_doc = request.dict()
    ambulance_doc["status"] = "dispatched"
    ambulance_doc["driver_name"] = "Driver John"
    ambulance_doc["driver_phone"] = "+1234567890"
    ambulance_doc["vehicle_number"] = "AMB-" + str(await db.ambulances.count_documents({}) + 1)
    ambulance_doc["current_latitude"] = request.pickup_latitude + 0.01
    ambulance_doc["current_longitude"] = request.pickup_longitude + 0.01
    ambulance_doc["eta_minutes"] = 8
    ambulance_doc["created_at"] = datetime.utcnow()
    
    result = await db.ambulances.insert_one(ambulance_doc)
    ambulance_doc["_id"] = str(result.inserted_id)
    
    # Emit real-time update
    await sio.emit('ambulance_update', str_id(ambulance_doc))
    
    return {"success": True, "ambulance": str_id(ambulance_doc)}

@api_router.get("/ambulance/{ambulance_id}")
async def get_ambulance(ambulance_id: str):
    try:
        ambulance = await db.ambulances.find_one({"_id": ObjectId(ambulance_id)})
        if not ambulance:
            raise HTTPException(status_code=404, detail="Ambulance request not found")
        return str_id(ambulance)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== AI SYMPTOM CHECKER ====================

@api_router.post("/symptoms/analyze")
async def analyze_symptoms(symptom_check: SymptomCheck):
    try:
        # Initialize OpenAI client
        session_id = symptom_check.session_id or f"symptom_{symptom_check.user_id}_{datetime.utcnow().timestamp()}"
        
        openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        
        # Call OpenAI API directly
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a medical assistant helping to analyze symptoms. Provide helpful information but always recommend consulting with healthcare professionals. Assess urgency level (Critical, High, Medium, Low) and suggest appropriate action."
                },
                {
                    "role": "user",
                    "content": f"Patient symptoms: {symptom_check.symptoms}"
                }
            ]
        )
        
        response = completion.choices[0].message.content
        
        # Store in database
        analysis_doc = {
            "user_id": symptom_check.user_id,
            "symptoms": symptom_check.symptoms,
            "analysis": response,
            "session_id": session_id,
            "created_at": datetime.utcnow()
        }
        result = await db.symptom_analyses.insert_one(analysis_doc)
        analysis_doc["_id"] = str(result.inserted_id)
        
        return {"success": True, "analysis": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Symptom analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze symptoms: {str(e)}")

@api_router.get("/symptoms/history/{user_id}")
async def get_symptom_history(user_id: str):
    analyses = await db.symptom_analyses.find({"user_id": user_id}).sort("created_at", -1).to_list(20)
    return [str_id(analysis) for analysis in analyses]

# ==================== BLOOD & MEDICINE ====================

@api_router.post("/blood/search")
async def search_blood(request: BloodRequest):
    # In a real app, this would search blood banks and donors
    # For MVP, returning mock data
    blood_banks = [
        {
            "id": "1",
            "name": "City Blood Bank",
            "blood_type": request.blood_type,
            "units_available": 5,
            "distance": 2.3,
            "address": "123 Medical Street",
            "phone": "+1234567890",
            "status": "available"
        },
        {
            "id": "2",
            "name": "Emergency Blood Center",
            "blood_type": request.blood_type,
            "units_available": 12,
            "distance": 4.1,
            "address": "456 Health Avenue",
            "phone": "+1234567891",
            "status": "available"
        }
    ]
    
    return {"success": True, "blood_banks": blood_banks}

@api_router.get("/medicine/search")
async def search_medicine(name: str, lat: float, lng: float):
    # Mock pharmacy data
    pharmacies = [
        {
            "id": "1",
            "name": "24/7 Medical Pharmacy",
            "medicine": name,
            "in_stock": True,
            "distance": 1.2,
            "address": "789 Pharmacy Lane",
            "phone": "+1234567892",
            "price": 45.0,
            "open_24_7": True
        },
        {
            "id": "2",
            "name": "HealthCare Chemist",
            "medicine": name,
            "in_stock": True,
            "distance": 3.5,
            "address": "321 Medicine Road",
            "phone": "+1234567893",
            "price": 42.0,
            "open_24_7": False
        }
    ]
    
    return {"success": True, "pharmacies": pharmacies}

# ==================== DOCTORS ====================

@api_router.get("/doctors/search")
async def search_doctors(specialization: Optional[str] = None, search: Optional[str] = None):
    # Mock doctors data
    all_doctors = [
        {
            "_id": "doc1",
            "name": "Sarah Johnson",
            "specialization": "Cardiologist",
            "hospital": "City General Hospital",
            "experience": 15,
            "rating": 4.8,
            "reviews": 124,
            "availability": "Available",
            "consultation_fee": 150,
            "qualifications": ["MBBS", "MD Cardiology", "FACC"],
            "phone": "+1234567800",
            "available_slots": ["09:00 AM", "10:30 AM", "02:00 PM", "04:00 PM"]
        },
        {
            "_id": "doc2",
            "name": "Michael Chen",
            "specialization": "Neurologist",
            "hospital": "Metro Medical Hospital",
            "experience": 12,
            "rating": 4.9,
            "reviews": 98,
            "availability": "Available",
            "consultation_fee": 180,
            "qualifications": ["MBBS", "MD Neurology"],
            "phone": "+1234567801",
            "available_slots": ["11:00 AM", "01:00 PM", "03:30 PM"]
        },
        {
            "_id": "doc3",
            "name": "Emily Rodriguez",
            "specialization": "Pediatrician",
            "hospital": "Emergency Care Center",
            "experience": 10,
            "rating": 4.7,
            "reviews": 156,
            "availability": "Busy",
            "consultation_fee": 120,
            "qualifications": ["MBBS", "MD Pediatrics"],
            "phone": "+1234567802",
            "available_slots": ["05:00 PM", "06:00 PM"]
        },
        {
            "_id": "doc4",
            "name": "David Williams",
            "specialization": "Orthopedic",
            "hospital": "City General Hospital",
            "experience": 18,
            "rating": 4.6,
            "reviews": 87,
            "availability": "Available",
            "consultation_fee": 160,
            "qualifications": ["MBBS", "MS Orthopedics"],
            "phone": "+1234567803",
            "available_slots": ["10:00 AM", "12:00 PM", "03:00 PM"]
        }
    ]
    
    filtered_doctors = all_doctors
    if specialization:
        filtered_doctors = [d for d in filtered_doctors if d["specialization"] == specialization]
    if search:
        search_lower = search.lower()
        filtered_doctors = [d for d in filtered_doctors if search_lower in d["name"].lower() or search_lower in d["hospital"].lower()]
    
    return {"success": True, "doctors": filtered_doctors}

@api_router.post("/appointments/book")
async def book_appointment(data: dict):
    appointment = {
        "_id": f"apt_{datetime.utcnow().timestamp()}",
        "user_id": data.get("user_id"),
        "doctor_id": data.get("doctor_id"),
        "doctor_name": data.get("doctor_name"),
        "specialization": data.get("specialization"),
        "hospital": data.get("hospital"),
        "appointment_time": data.get("appointment_time"),
        "consultation_fee": data.get("consultation_fee"),
        "status": "confirmed",
        "created_at": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment)
    appointment["_id"] = str(result.inserted_id)
    
    return {"success": True, "appointment": str_id(appointment)}

# ==================== QUEUE MANAGEMENT ====================

@api_router.get("/queue/{booking_id}")
async def get_queue_status(booking_id: str):
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Calculate queue position and wait time
        queue_ahead = await db.bookings.count_documents({
            "hospital_id": booking.get("hospital_id"),
            "status": "pending",
            "created_at": {"$lt": booking.get("created_at")}
        })
        
        estimated_wait = queue_ahead * 15  # 15 minutes per patient
        
        return {
            "success": True,
            "queue_number": booking.get("queue_number"),
            "queue_position": queue_ahead + 1,
            "patients_ahead": queue_ahead,
            "estimated_wait_minutes": estimated_wait,
            "status": booking.get("status")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== MEDICAL RECORDS ====================

@api_router.post("/medical-records/upload")
async def upload_medical_record(data: dict):
    record = {
        "user_id": data.get("user_id"),
        "record_type": data.get("record_type"),
        "title": data.get("title"),
        "description": data.get("description"),
        "file_url": data.get("file_url"),
        "date": data.get("date", datetime.utcnow()),
        "created_at": datetime.utcnow()
    }
    
    result = await db.medical_records.insert_one(record)
    record["_id"] = str(result.inserted_id)
    
    return {"success": True, "record": str_id(record)}

@api_router.get("/medical-records/{user_id}")
async def get_medical_records(user_id: str):
    records = await db.medical_records.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return {"success": True, "records": [str_id(r) for r in records]}

# ==================== VOICE ASSISTANT ====================

@api_router.post("/voice/command")
async def process_voice_command(data: dict):
    command = data.get("command", "").lower()
    user_id = data.get("user_id")
    
    response = {
        "success": True,
        "action": None,
        "message": "",
        "data": None
    }
    
    if "ambulance" in command or "emergency" in command:
        response["action"] = "call_ambulance"
        response["message"] = "Opening ambulance request. Please provide your location."
    elif "bed" in command or "book bed" in command:
        response["action"] = "search_beds"
        response["message"] = "Searching for available beds nearby."
    elif "doctor" in command:
        response["action"] = "search_doctors"
        response["message"] = "Opening doctor search."
    elif "symptom" in command:
        response["action"] = "symptom_checker"
        response["message"] = "Opening AI symptom checker."
    else:
        response["message"] = "I can help you with ambulance requests, bed bookings, finding doctors, or checking symptoms. What would you like to do?"
    
    return response

# ==================== ADMIN DASHBOARD ====================

@api_router.get("/admin/dashboard/{hospital_id}")
async def get_admin_dashboard(hospital_id: str):
    try:
        hospital = await db.hospitals.find_one({"_id": ObjectId(hospital_id)})
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        # Get today's bookings
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_bookings = await db.bookings.find({
            "hospital_id": hospital_id,
            "created_at": {"$gte": today_start}
        }).to_list(100)
        
        dashboard = {
            "hospital": str_id(hospital),
            "today_admissions": len(today_bookings),
            "pending_verifications": len([b for b in today_bookings if b.get("status") == "pending"]),
            "critical_cases": len([b for b in today_bookings if b.get("emergency_level") == "Critical"])
        }
        
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== SOCKET.IO EVENTS ====================

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def track_ambulance(sid, data):
    # Simulate ambulance movement
    ambulance_id = data.get('ambulance_id')
    if ambulance_id:
        # In real app, this would track actual GPS
        await sio.emit('ambulance_location', {
            'ambulance_id': ambulance_id,
            'latitude': data.get('latitude', 0),
            'longitude': data.get('longitude', 0),
            'eta_minutes': data.get('eta_minutes', 5)
        }, room=sid)

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MedConnect API...")
    # Ensure older records have the extended capacity fields required by web UI.
    await db.hospitals.update_many(
        {"total_ccu_beds": {"$exists": False}},
        {"$set": {"total_ccu_beds": 0, "available_ccu_beds": 0}}
    )
    await db.hospitals.update_many(
        {"total_oxygen_beds": {"$exists": False}},
        {"$set": {"total_oxygen_beds": 0, "available_oxygen_beds": 0}}
    )
    await db.hospitals.update_many(
        {"total_non_oxygen_beds": {"$exists": False}},
        {"$set": {"total_non_oxygen_beds": 0, "available_non_oxygen_beds": 0}}
    )

    def with_capacity_defaults(hospital: Dict[str, Any]) -> Dict[str, Any]:
        hospital["total_ccu_beds"] = int(hospital.get("total_ccu_beds", max(5, hospital.get("total_icu_beds", 0) // 2)))
        hospital["available_ccu_beds"] = int(hospital.get("available_ccu_beds", max(1, hospital.get("available_icu_beds", 0) // 2)))

        total_general = int(hospital.get("total_general_beds", 0))
        available_general = int(hospital.get("available_general_beds", 0))

        hospital["total_oxygen_beds"] = int(hospital.get("total_oxygen_beds", max(10, int(total_general * 0.35))))
        hospital["available_oxygen_beds"] = int(hospital.get("available_oxygen_beds", max(2, int(available_general * 0.30))))
        hospital["total_non_oxygen_beds"] = int(hospital.get("total_non_oxygen_beds", max(10, int(total_general * 0.65))))
        hospital["available_non_oxygen_beds"] = int(hospital.get("available_non_oxygen_beds", max(2, int(available_general * 0.70))))
        hospital["oxygen_supply_available"] = bool(
            hospital.get("oxygen_supply_available", hospital["available_oxygen_beds"] > 0)
        )
        return hospital

    # Seed real hospitals for common cities with upserts, so users always see enough options.
    real_hospitals = [
        {
            "name": "All India Institute of Medical Sciences (AIIMS)",
            "address": "Sri Aurobindo Marg, Ansari Nagar",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.5672,
            "longitude": 77.2100,
            "phone": "+91-11-26588500",
            "email": "info@aiims.edu",
            "total_icu_beds": 120,
            "available_icu_beds": 22,
            "total_nicu_beds": 80,
            "available_nicu_beds": 15,
            "total_general_beds": 1800,
            "available_general_beds": 260,
            "accepts_insurance": True,
            "emergency_contact": "+91-11-26594404",
        },
        {
            "name": "Safdarjung Hospital",
            "address": "Ansari Nagar West",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.5704,
            "longitude": 77.2005,
            "phone": "+91-11-26730000",
            "email": "contact@safdarjunghospital.com",
            "total_icu_beds": 70,
            "available_icu_beds": 11,
            "total_nicu_beds": 40,
            "available_nicu_beds": 7,
            "total_general_beds": 1500,
            "available_general_beds": 190,
            "accepts_insurance": True,
            "emergency_contact": "+91-11-26165060",
        },
        {
            "name": "Medanta - The Medicity",
            "address": "CH Baktawar Singh Road, Sector 38",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "India",
            "latitude": 28.4386,
            "longitude": 77.0405,
            "phone": "+91-124-4141414",
            "email": "info@medanta.org",
            "total_icu_beds": 110,
            "available_icu_beds": 19,
            "total_nicu_beds": 65,
            "available_nicu_beds": 13,
            "total_general_beds": 1200,
            "available_general_beds": 205,
            "accepts_insurance": True,
            "emergency_contact": "+91-124-4834111",
        },
        {
            "name": "Artemis Hospital",
            "address": "Sector 51",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "India",
            "latitude": 28.4434,
            "longitude": 77.0890,
            "phone": "+91-124-4511111",
            "email": "care@artemishospitals.com",
            "total_icu_beds": 55,
            "available_icu_beds": 8,
            "total_nicu_beds": 28,
            "available_nicu_beds": 4,
            "total_general_beds": 450,
            "available_general_beds": 69,
            "accepts_insurance": True,
            "emergency_contact": "+91-124-6767699",
        },
        {
            "name": "Fortis Memorial Research Institute",
            "address": "Sector 44",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "India",
            "latitude": 28.4595,
            "longitude": 77.0847,
            "phone": "+91-124-4962200",
            "email": "fmri@fortishealthcare.com",
            "total_icu_beds": 85,
            "available_icu_beds": 14,
            "total_nicu_beds": 42,
            "available_nicu_beds": 9,
            "total_general_beds": 900,
            "available_general_beds": 130,
            "accepts_insurance": True,
            "emergency_contact": "+91-124-4921021",
        },
        {
            "name": "Apollo Hospitals, Greams Road",
            "address": "21 Greams Lane, Off Greams Road",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "latitude": 13.0619,
            "longitude": 80.2528,
            "phone": "+91-44-28290200",
            "email": "helpdesk_chennai@apollohospitals.com",
            "total_icu_beds": 90,
            "available_icu_beds": 17,
            "total_nicu_beds": 38,
            "available_nicu_beds": 6,
            "total_general_beds": 700,
            "available_general_beds": 94,
            "accepts_insurance": True,
            "emergency_contact": "+91-44-28293333",
        },
        {
            "name": "Max Hospital, Saket",
            "address": "1, Press Enclave Road, Saket",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.5273,
            "longitude": 77.2166,
            "phone": "+91-11-26515050",
            "email": "feedback@maxhealthcare.com",
            "total_icu_beds": 62,
            "available_icu_beds": 13,
            "total_nicu_beds": 22,
            "available_nicu_beds": 5,
            "total_general_beds": 520,
            "available_general_beds": 108,
            "accepts_insurance": True,
            "emergency_contact": "+91-11-26515050",
        },
        {
            "name": "BLK-Max Super Speciality Hospital",
            "address": "Pusa Road, Rajinder Nagar",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.6444,
            "longitude": 77.1895,
            "phone": "+91-11-30403040",
            "email": "care@blkmaxhospital.com",
            "total_icu_beds": 58,
            "available_icu_beds": 9,
            "total_nicu_beds": 24,
            "available_nicu_beds": 4,
            "total_general_beds": 650,
            "available_general_beds": 112,
            "accepts_insurance": True,
            "emergency_contact": "+91-11-30403040",
        },
        {
            "name": "Sir Ganga Ram Hospital",
            "address": "Rajinder Nagar",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.6384,
            "longitude": 77.1890,
            "phone": "+91-11-25750000",
            "email": "info@sgrh.com",
            "total_icu_beds": 66,
            "available_icu_beds": 10,
            "total_nicu_beds": 26,
            "available_nicu_beds": 5,
            "total_general_beds": 700,
            "available_general_beds": 146,
            "accepts_insurance": True,
            "emergency_contact": "+91-11-42254000",
        },
        {
            "name": "Paras Hospitals, Gurugram",
            "address": "C-1, Sushant Lok Phase-I",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "India",
            "latitude": 28.4638,
            "longitude": 77.0822,
            "phone": "+91-124-4585555",
            "email": "info@parashospitals.com",
            "total_icu_beds": 44,
            "available_icu_beds": 8,
            "total_nicu_beds": 18,
            "available_nicu_beds": 3,
            "total_general_beds": 340,
            "available_general_beds": 72,
            "accepts_insurance": True,
            "emergency_contact": "+91-124-4585555",
        },
        {
            "name": "Narayana Superspeciality Hospital",
            "address": "DLF Cyber City",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "India",
            "latitude": 28.4962,
            "longitude": 77.0880,
            "phone": "+91-124-4962200",
            "email": "care@narayanahealth.org",
            "total_icu_beds": 49,
            "available_icu_beds": 11,
            "total_nicu_beds": 20,
            "available_nicu_beds": 4,
            "total_general_beds": 410,
            "available_general_beds": 86,
            "accepts_insurance": True,
            "emergency_contact": "+91-124-4141414",
        },
        {
            "name": "Kokilaben Dhirubhai Ambani Hospital",
            "address": "Rao Saheb Achutrao Patwardhan Marg, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "latitude": 19.1313,
            "longitude": 72.8245,
            "phone": "+91-22-42696969",
            "email": "contact@kokilabenhospital.com",
            "total_icu_beds": 72,
            "available_icu_beds": 14,
            "total_nicu_beds": 30,
            "available_nicu_beds": 7,
            "total_general_beds": 750,
            "available_general_beds": 170,
            "accepts_insurance": True,
            "emergency_contact": "+91-22-42696969",
        },
        {
            "name": "Lilavati Hospital and Research Centre",
            "address": "A-791, Bandra Reclamation, Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "latitude": 19.0509,
            "longitude": 72.8270,
            "phone": "+91-22-26751000",
            "email": "info@lilavatihospital.com",
            "total_icu_beds": 46,
            "available_icu_beds": 8,
            "total_nicu_beds": 16,
            "available_nicu_beds": 3,
            "total_general_beds": 420,
            "available_general_beds": 84,
            "accepts_insurance": True,
            "emergency_contact": "+91-22-26751000",
        },
        {
            "name": "Manipal Hospital, Old Airport Road",
            "address": "98, HAL Old Airport Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "latitude": 12.9582,
            "longitude": 77.6495,
            "phone": "+91-80-25024444",
            "email": "info@manipalhospitals.com",
            "total_icu_beds": 64,
            "available_icu_beds": 12,
            "total_nicu_beds": 28,
            "available_nicu_beds": 5,
            "total_general_beds": 600,
            "available_general_beds": 128,
            "accepts_insurance": True,
            "emergency_contact": "+91-80-25024444",
        },
        {
            "name": "Narayana Health City",
            "address": "Bommasandra Industrial Area",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "latitude": 12.7994,
            "longitude": 77.7048,
            "phone": "+91-80-71222222",
            "email": "care@narayanahealth.org",
            "total_icu_beds": 88,
            "available_icu_beds": 18,
            "total_nicu_beds": 34,
            "available_nicu_beds": 6,
            "total_general_beds": 1000,
            "available_general_beds": 210,
            "accepts_insurance": True,
            "emergency_contact": "+91-80-71222222",
        },
        {
            "name": "Christian Medical College Hospital",
            "address": "Ida Scudder Road, Vellore",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "latitude": 12.9240,
            "longitude": 79.1351,
            "phone": "+91-416-2281000",
            "email": "info@cmcvellore.ac.in",
            "total_icu_beds": 54,
            "available_icu_beds": 9,
            "total_nicu_beds": 24,
            "available_nicu_beds": 4,
            "total_general_beds": 850,
            "available_general_beds": 155,
            "accepts_insurance": True,
            "emergency_contact": "+91-416-2281000",
        },
        {
            "name": "Cedars-Sinai Medical Center",
            "address": "8700 Beverly Blvd",
            "city": "Los Angeles",
            "state": "California",
            "country": "United States",
            "latitude": 34.0753,
            "longitude": -118.3803,
            "phone": "+1-310-423-3277",
            "email": "info@cshs.org",
            "total_icu_beds": 132,
            "available_icu_beds": 24,
            "total_nicu_beds": 52,
            "available_nicu_beds": 11,
            "total_general_beds": 1200,
            "available_general_beds": 240,
            "accepts_insurance": True,
            "emergency_contact": "+1-310-423-3277",
        },
        {
            "name": "UCSF Medical Center",
            "address": "505 Parnassus Ave",
            "city": "San Francisco",
            "state": "California",
            "country": "United States",
            "latitude": 37.7631,
            "longitude": -122.4586,
            "phone": "+1-415-476-1000",
            "email": "patientrelations@ucsf.edu",
            "total_icu_beds": 124,
            "available_icu_beds": 19,
            "total_nicu_beds": 48,
            "available_nicu_beds": 9,
            "total_general_beds": 980,
            "available_general_beds": 166,
            "accepts_insurance": True,
            "emergency_contact": "+1-415-353-1238",
        },
        {
            "name": "Mount Sinai Hospital",
            "address": "1468 Madison Ave",
            "city": "New York",
            "state": "New York",
            "country": "United States",
            "latitude": 40.7901,
            "longitude": -73.9533,
            "phone": "+1-212-241-6500",
            "email": "info@mountsinai.org",
            "total_icu_beds": 146,
            "available_icu_beds": 22,
            "total_nicu_beds": 58,
            "available_nicu_beds": 11,
            "total_general_beds": 1400,
            "available_general_beds": 254,
            "accepts_insurance": True,
            "emergency_contact": "+1-212-241-6500",
        },
        {
            "name": "Houston Methodist Hospital",
            "address": "6565 Fannin St",
            "city": "Houston",
            "state": "Texas",
            "country": "United States",
            "latitude": 29.7105,
            "longitude": -95.3987,
            "phone": "+1-713-790-3311",
            "email": "contact@houstonmethodist.org",
            "total_icu_beds": 138,
            "available_icu_beds": 26,
            "total_nicu_beds": 52,
            "available_nicu_beds": 10,
            "total_general_beds": 1150,
            "available_general_beds": 212,
            "accepts_insurance": True,
            "emergency_contact": "+1-713-790-3311",
        },
        {
            "name": "Toronto Western Hospital",
            "address": "399 Bathurst St",
            "city": "Toronto",
            "state": "Ontario",
            "country": "Canada",
            "latitude": 43.6535,
            "longitude": -79.4056,
            "phone": "+1-416-603-5800",
            "email": "feedback@uhn.ca",
            "total_icu_beds": 62,
            "available_icu_beds": 12,
            "total_nicu_beds": 24,
            "available_nicu_beds": 5,
            "total_general_beds": 430,
            "available_general_beds": 88,
            "accepts_insurance": True,
            "emergency_contact": "+1-416-603-5800",
        },
        {
            "name": "Sunnybrook Health Sciences Centre",
            "address": "2075 Bayview Ave",
            "city": "Toronto",
            "state": "Ontario",
            "country": "Canada",
            "latitude": 43.7230,
            "longitude": -79.3784,
            "phone": "+1-416-480-6100",
            "email": "info@sunnybrook.ca",
            "total_icu_beds": 84,
            "available_icu_beds": 16,
            "total_nicu_beds": 30,
            "available_nicu_beds": 6,
            "total_general_beds": 700,
            "available_general_beds": 126,
            "accepts_insurance": True,
            "emergency_contact": "+1-416-480-6100",
        },
        {
            "name": "Montreal General Hospital",
            "address": "1650 Cedar Ave",
            "city": "Montreal",
            "state": "Quebec",
            "country": "Canada",
            "latitude": 45.4919,
            "longitude": -73.5795,
            "phone": "+1-514-934-1934",
            "email": "mgeneral@mcgill.ca",
            "total_icu_beds": 58,
            "available_icu_beds": 10,
            "total_nicu_beds": 22,
            "available_nicu_beds": 4,
            "total_general_beds": 530,
            "available_general_beds": 94,
            "accepts_insurance": True,
            "emergency_contact": "+1-514-934-1934",
        },
        {
            "name": "Mayo Clinic Hospital",
            "address": "5777 E Mayo Blvd",
            "city": "Phoenix",
            "state": "Arizona",
            "country": "United States",
            "latitude": 33.6588,
            "longitude": -111.9500,
            "phone": "+1-480-515-6296",
            "email": "contact@mayo.edu",
            "total_icu_beds": 140,
            "available_icu_beds": 25,
            "total_nicu_beds": 60,
            "available_nicu_beds": 10,
            "total_general_beds": 1300,
            "available_general_beds": 210,
            "accepts_insurance": True,
            "emergency_contact": "+1-480-342-2000",
        },
        {
            "name": "NewYork-Presbyterian Hospital",
            "address": "525 E 68th St",
            "city": "New York",
            "state": "New York",
            "country": "United States",
            "latitude": 40.7647,
            "longitude": -73.9542,
            "phone": "+1-212-746-5454",
            "email": "info@nyp.org",
            "total_icu_beds": 180,
            "available_icu_beds": 28,
            "total_nicu_beds": 72,
            "available_nicu_beds": 16,
            "total_general_beds": 1600,
            "available_general_beds": 240,
            "accepts_insurance": True,
            "emergency_contact": "+1-212-746-5026",
        },
        {
            "name": "Toronto General Hospital",
            "address": "200 Elizabeth St",
            "city": "Toronto",
            "state": "Ontario",
            "country": "Canada",
            "latitude": 43.6583,
            "longitude": -79.3890,
            "phone": "+1-416-340-4800",
            "email": "info@uhn.ca",
            "total_icu_beds": 95,
            "available_icu_beds": 15,
            "total_nicu_beds": 40,
            "available_nicu_beds": 8,
            "total_general_beds": 1000,
            "available_general_beds": 145,
            "accepts_insurance": True,
            "emergency_contact": "+1-416-340-3111",
        },
    ]

    inserted_count = 0
    for hospital in real_hospitals:
        hospital = with_capacity_defaults(hospital)
        existing = await db.hospitals.find_one(
            {
                "name": hospital["name"],
                "city": hospital["city"],
                "state": hospital["state"],
                "country": hospital["country"],
            }
        )
        if existing:
            continue

        hospital["created_at"] = datetime.utcnow()
        await db.hospitals.insert_one(hospital)
        inserted_count += 1

    if inserted_count:
        logger.info(f"Seeded {inserted_count} real hospitals")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
