# Dataset Curation Platform

Dataset curation app with:

- React + Vite frontend
- Express + MongoDB backend
- JWT authentication
- Gemini-based text metadata extraction
- Local BLIP image captioning service
- Rule-based compliance analysis

## What This Project Does

Users can:

- sign up and log in
- upload datasets
- process text and image files
- generate metadata automatically
- inspect compliance risks
- review and edit tags
- export processed datasets

## Current Architecture

### Frontend
- location: `frontend/`
- framework: React + Vite
- talks to backend through `/api`
- proxies `/uploads` in development so media previews work

### Backend
- location: `Backend/`
- framework: Express
- database: MongoDB with Mongoose
- auth: bcryptjs + JWT

### AI Layer
- text pipeline: Gemini API
- image pipeline: local BLIP microservice
- compliance: rule-based checks over AI metadata + file content

## Storage Model

### Stored in MongoDB
- users
- datasets
- files
- metadata
- compliance reports

### Stored on disk
- uploaded raw files in `Backend/uploads/`
- exported files in `Backend/uploads/exports/`

Raw files are not stored in MongoDB. Only their metadata and references are stored there.

## Authentication

Authentication is now implemented.

### Backend auth features
- signup API
- login API
- bcrypt password hashing
- JWT token generation
- auth middleware for protected routes
- dataset ownership enforcement

### Auth routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Protected routes
- dataset upload
- dataset listing
- dataset detail
- metadata APIs
- compliance APIs
- export APIs

Each dataset is linked to a user through `userId`, and dataset queries are scoped to the authenticated user.

## AI Processing Flow

After upload:

1. backend saves uploaded files
2. backend creates dataset + file records
3. text files are sent to Gemini
4. image files are sent to local BLIP
5. metadata is stored
6. compliance engine runs
7. dataset status is updated to `Ready`

## AI Outputs

### Text output

Shape:

```json
{
  "type": "text",
  "tags": [],
  "entities": [],
  "caption": "",
  "objects": [],
  "sensitive_flags": [],
  "pii_detected": false,
  "language": "en",
  "source": "gemini"
}
```

### Image output

Shape:

```json
{
  "type": "image",
  "tags": [],
  "entities": [],
  "caption": "",
  "objects": [],
  "sensitive_flags": [],
  "pii_detected": false,
  "language": "n/a",
  "source": "blip_local"
}
```

If Gemini or BLIP is unavailable, the backend falls back gracefully so the app does not crash.

## Compliance Checks

Current compliance logic checks for:

- email addresses
- phone numbers
- basic name heuristics
- healthcare + identity overlap for HIPAA-style risk
- violence-related keywords
- adult-content keywords

Compliance output includes:

- `overallScore`
- `violations`
- `warnings`
- `autoFixSuggestions`

## Prerequisites

Install these on your laptop:

1. Node.js 18+
2. Python 3.10+
3. npm
4. pip
5. MongoDB
   - local MongoDB, or
   - MongoDB Atlas

Optional:

- GPU for faster BLIP inference

## Environment Files

### Backend

Create `Backend/.env`:

```env
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MONGODB_URI=mongodb://127.0.0.1:27017/dataset-curation
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
BLIP_MODEL=Salesforce/blip-image-captioning-base
BLIP_SERVICE_URL=http://127.0.0.1:8001/caption
```

If you use MongoDB Atlas, `MONGODB_URI` will look like:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dataset-curation
```

If the password contains special characters, URL-encode it.

### Frontend

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=/api
```

## How I Would Run This On My Laptop

Use 3 terminals.

### Terminal 1: Start local BLIP service

First-time setup:

```powershell
cd Backend\blip_service
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start the service:

```powershell
cd Backend
python -m uvicorn blip_service.app:app --host 127.0.0.1 --port 8001
```

Health check:

```powershell
curl http://127.0.0.1:8001/health
```

### Terminal 2: Start backend

```powershell
cd Backend
npm install
npm run dev
```

Expected:

- MongoDB connects
- backend starts on port `5000`

### Terminal 3: Start frontend

```powershell
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## First-Time Run Notes

### BLIP model download

On the first BLIP startup, Hugging Face downloads the pretrained model. That can take time.

If you want to pre-download it manually:

```powershell
cd Backend\blip_service
.\.venv\Scripts\activate
python -c "from transformers import BlipProcessor, BlipForConditionalGeneration; BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base'); BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base'); print('download complete')"
```

### MongoDB

If you are using local MongoDB, make sure it is running on `127.0.0.1:27017`.

If you are using Atlas, verify:

- username is correct
- password is correct
- password is URL-encoded if needed
- Atlas network access allows your IP

## API Summary

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dataset
- `POST /api/dataset/upload`
- `GET /api/datasets`
- `GET /api/dataset/:id`

### Metadata
- `POST /api/metadata/generate`
- `POST /api/metadata/update`

### Compliance
- `POST /api/compliance/check`
- `GET /api/compliance/:dataset_id`

### Export
- `POST /api/export`
- `GET /api/download/:dataset_id`

## Typical User Flow

1. Sign up
2. Log in
3. Upload files
4. Wait for processing
5. Open dataset detail page
6. Review captions, tags, objects, and flags
7. Open compliance report
8. Edit tags if needed
9. Export dataset

## Important Files

### Backend
- `Backend/src/index.js`
- `Backend/src/routes/api.routes.js`
- `Backend/src/routes/auth.routes.js`
- `Backend/src/controllers/dataset.controller.js`
- `Backend/src/controllers/auth.controller.js`
- `Backend/src/middleware/auth.js`
- `Backend/src/services/metadata.ai.service.js`
- `Backend/src/services/textProcessor.js`
- `Backend/src/services/imageProcessor.js`
- `Backend/src/services/compliance.engine.js`
- `Backend/src/services/complianceEngine.js`
- `Backend/blip_service/app.py`

### Frontend
- `frontend/src/App.jsx`
- `frontend/src/services/api.js`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/pages/UploadPage.jsx`
- `frontend/src/pages/DatasetDetailPage.jsx`
- `frontend/src/pages/AnnotationPage.jsx`
- `frontend/src/pages/ComplianceReportPage.jsx`

## Troubleshooting

### Backend says `bad auth : authentication failed`
- your Atlas credentials are wrong
- or your password is not URL-encoded

### Backend says `connect ECONNREFUSED 127.0.0.1:27017`
- local MongoDB is not running

### BLIP service is not generating image captions
- make sure `http://127.0.0.1:8001/health` works
- make sure the model finished downloading
- make sure Python packages are installed inside the virtual environment

### Images show broken preview in frontend
- restart the frontend dev server after proxy changes
- confirm backend serves `/uploads/...`

### Image tags look like filenames
- BLIP service was not reachable
- older metadata may have been generated from fallback logic
- reprocess or re-upload those images after BLIP is running

### Gemini is not working
- check `GEMINI_API_KEY`
- check backend logs

### Login works but dataset APIs fail
- ensure the JWT token is stored in the browser
- ensure `Authorization: Bearer <token>` is sent
- ensure `JWT_SECRET` is set in backend `.env`

## Quick Start

```powershell
# terminal 1
cd Backend\blip_service
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
cd ..
python -m uvicorn blip_service.app:app --host 127.0.0.1 --port 8001

# terminal 2
cd Backend
npm install
npm run dev

# terminal 3
cd frontend
npm install
npm run dev
```
