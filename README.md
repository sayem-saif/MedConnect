# MedConnect

MedConnect is a full-stack healthcare coordination platform built with FastAPI, MongoDB, and Expo (React Native + Web). It helps patients discover hospitals, check bed and blood availability, request ambulances, and manage profile preferences.

## Tech Stack

- Backend: FastAPI, Motor (MongoDB), Socket.IO, Uvicorn
- Frontend: Expo Router, React Native, React Native Web, TypeScript
- Database: MongoDB Atlas/local MongoDB

## Repository Structure

```text
MedConnect-main/
	backend/                 # FastAPI backend
		server.py
		requirements.txt
	frontend/                # Expo app (Android + Web)
		app/
		contexts/
		utils/
		package.json
	README.md
	.gitignore
```

## Features

- User registration and login
- Hospital discovery with filters and availability details
- Bed booking flow and queue tracking
- Blood bank search with stock visibility
- Ambulance request and tracking screens
- Profile management with persisted user preferences

## Prerequisites

- Python 3.11+ (your current environment is 3.14)
- Node.js 18+ and npm
- MongoDB connection string

## Environment Variables

### Backend

Create backend/.env with:

```env
MONGO_URL=your_mongodb_connection_string
DB_NAME=medconnect
```

### Frontend

Copy frontend/.env.example to frontend/.env and adjust if needed:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## Local Development

### 1. Start Backend

```powershell
Push-Location backend
python -m pip install -r requirements.txt
python -m uvicorn server:socket_app --host 127.0.0.1 --port 8000
Pop-Location
```

### 2. Start Frontend

```powershell
Push-Location frontend
npm install
npm run web
Pop-Location
```

## Build Web Output

```powershell
Push-Location frontend
npm run build:web
Pop-Location
```

Deployment notes for web are available in frontend/WEB_DEPLOYMENT.md.

## API Base URL Notes

The frontend API helper supports backend URL values with or without /api, for example:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/api

## Git Push Workflow

Use this from repository root:

```powershell
git add -A
git commit -m "chore: update docs, gitignore, and blood availability UI"
git push origin main
```

## Quality Checklist Before Push

- Backend runs without startup errors
- Frontend web starts and loads successfully
- npm run build:web succeeds
- No secrets are committed
- git status is clean after commit

## Security Notes

- Never commit real .env files
- Never commit credentials/token JSON files
- Rotate any leaked credentials immediately

## License

This project is for academic and prototype use unless a separate license is added.
