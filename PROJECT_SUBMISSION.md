# MedConnect - Emergency Healthcare Coordination Platform

## 📱 Project Overview

**MedConnect** is a comprehensive mobile healthcare application that streamlines emergency medical services by connecting patients with hospitals, ambulances, and medical resources in real-time.

---

## 🔐 Demo Login Credentials

### Patient Account
- **Email:** `demo@medconnect.com`
- **Password:** `Demo@123`

### Hospital Staff Account
- **Email:** `admin@medconnect.com`
- **Password:** `Staff@123`

---

## ✨ Key Features

### 1. **Hospital Bed Management** 🏥
- Real-time bed availability (ICU, NICU, General)
- Location-based hospital search
- Instant bed booking with queue numbers
- Live status updates

### 2. **Emergency Ambulance Services** 🚑
- On-demand ambulance requests
- Real-time GPS tracking
- ETA calculations
- Emergency level classification

### 3. **AI Symptom Checker** 🤖
- Conversational medical AI assistant
- Powered by OpenAI GPT-4o-mini
- Urgency level assessment
- Medical recommendations

### 4. **Blood Bank Finder** 🩸
- Search by blood type
- Real-time availability
- Distance-based sorting
- Direct calling to blood banks

### 5. **User Management** 👤
- Secure authentication
- Dual roles (Patient/Hospital Staff)
- Profile management
- Booking history

### 6. **Real-time Updates** 🔄
- WebSocket integration (Socket.IO)
- Live bed availability
- Ambulance location tracking

---

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native 0.79.5
- **Build Tool:** Expo SDK 54
- **Language:** TypeScript 5.8.3
- **Navigation:** Expo Router 5.1.4
- **State Management:** React Context API + Zustand
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Maps:** React Native Maps
- **UI:** Custom React Native components with Material Community Icons

### Backend (REST API)
- **Framework:** FastAPI 0.110.1
- **Server:** Uvicorn (ASGI)
- **Language:** Python 3.14
- **Database:** MongoDB (Motor async driver)
- **Real-time:** Socket.IO
- **Authentication:** BCrypt password hashing
- **AI/LLM:** OpenAI API (GPT-4o-mini)
- **Validation:** Pydantic

### Database
- **Type:** MongoDB Atlas (Cloud)
- **Collections:** users, hospitals, bookings, ambulances, symptom_analyses

---

## 📂 Project Structure

```
MedConnect/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── create_sample_user.py  # Sample user creation script
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/           # Authentication screens
│   │   ├── (tabs)/           # Main tab navigation
│   │   ├── ambulance/        # Ambulance features
│   │   ├── beds/             # Bed booking
│   │   ├── blood/            # Blood bank search
│   │   ├── symptoms/         # AI symptom checker
│   │   └── ...
│   ├── components/           # Reusable components
│   ├── contexts/             # React contexts
│   ├── utils/                # Utilities (API, colors)
│   ├── package.json
│   └── app.json
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier)
- Expo Go app (for mobile testing)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Update .env file with your credentials
MONGO_URL="your_mongodb_connection_string"
DB_NAME="medconnect_db"
OPENAI_API_KEY="your_openai_api_key"

# Create sample users
python create_sample_user.py

# Start server
python -m uvicorn server:socket_app --host 0.0.0.0 --port 8000 --reload
```

Backend will run on: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Update frontend/.env with backend URL
EXPO_PUBLIC_BACKEND_URL=http://your-backend-url:8000

# Start Expo development server
npx expo start
```

### Running the App
1. Install **Expo Go** on your mobile device
2. Scan the QR code from the terminal
3. App will load on your phone
4. Use the demo credentials to login

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: "patient" | "hospital_staff",
  phone: String,
  hospital_id: String (optional),
  created_at: DateTime
}
```

### Hospitals Collection
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  city: String,
  latitude: Number,
  longitude: Number,
  phone: String,
  email: String,
  total_icu_beds: Number,
  available_icu_beds: Number,
  total_nicu_beds: Number,
  available_nicu_beds: Number,
  total_general_beds: Number,
  available_general_beds: Number,
  accepts_insurance: Boolean,
  emergency_contact: String,
  created_at: DateTime
}
```

### Bookings Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  hospital_id: String,
  bed_type: "ICU" | "NICU" | "General",
  patient_name: String,
  patient_age: Number,
  patient_gender: String,
  symptoms: String,
  emergency_level: "Critical" | "High" | "Medium",
  status: "confirmed" | "pending" | "cancelled",
  queue_number: String,
  token_amount: Number,
  estimated_wait_time: Number,
  created_at: DateTime
}
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user/{user_id}` - Get user details

### Hospitals
- `GET /api/hospitals` - List all hospitals (with filters)
- `GET /api/hospitals/{hospital_id}` - Get hospital details
- `POST /api/hospitals` - Create hospital (admin)

### Bookings
- `POST /api/bookings` - Create bed booking
- `GET /api/bookings/user/{user_id}` - Get user bookings
- `GET /api/bookings/{booking_id}` - Get booking details

### Ambulance
- `POST /api/ambulance/request` - Request ambulance
- `GET /api/ambulance/{ambulance_id}` - Track ambulance

### AI Symptom Checker
- `POST /api/symptoms/analyze` - Analyze symptoms
- `GET /api/symptoms/history/{user_id}` - Get symptom history

### Blood & Medicine
- `POST /api/blood/search` - Search blood banks
- `GET /api/medicine/search` - Search pharmacies

---

## 🎯 Features Demonstrated

✅ Full-stack mobile application development
✅ Real-time data synchronization
✅ AI/ML integration (OpenAI)
✅ Location-based services
✅ Secure authentication
✅ RESTful API design
✅ NoSQL database (MongoDB)
✅ Cloud deployment ready
✅ Professional UI/UX design
✅ Error handling and validation

---

## 🌐 Deployment

### Backend Deployment Options
- **Railway.app** - Recommended
- **Render.com** - Free tier
- **Heroku** - Container deployment

### Frontend Deployment
- **EAS Build** - APK generation
- **Expo Application Services** - OTA updates

---

## 📸 Screenshots

[Add screenshots of key features here]

---

## 👨‍💻 Developer

**MD Sayem Saif**
- GitHub: @mdsayemsaif
- Email: demo@medconnect.com

---

## 📄 License

This project is created for educational purposes.

---

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini API
- Expo team for the amazing framework
- MongoDB Atlas for cloud database
- FastAPI for the high-performance backend

---

## 📝 Notes for Evaluators

1. **Sample Data:** The app includes 3 pre-populated hospitals and 2 demo user accounts
2. **AI Features:** Symptom checker uses OpenAI's GPT-4o-mini model
3. **Real-time:** Socket.IO enables live updates for ambulance tracking and bed availability
4. **Security:** Passwords are hashed using BCrypt
5. **Database:** MongoDB Atlas cloud database (no local setup required)

---

**Thank you for reviewing MedConnect!** 🏥📱
