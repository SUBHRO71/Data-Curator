# Dataset Curation

Full-stack dataset curation app with:

- React + Vite frontend
- Express + MongoDB backend
- Gemini-powered text metadata extraction
- Local BLIP image captioning service
- Rule-based compliance analysis for PII, HIPAA-style risk, and sensitive content

## Architecture

### Frontend
- Location: [frontend]
- Talks to the backend through `/api`
- Main pages:
  - upload
  - dashboard
  - dataset detail
  - compliance report

### Backend
- Location: [Backend]
- Stores dataset metadata in MongoDB
- Stores uploaded files on disk in [Backend/uploads]
- Runs the processing pipeline after upload:
  1. save dataset + files
  2. generate metadata
  3. run compliance checks
  4. update dataset status

### AI Services
- Gemini text processing: [textProcessor.js]
- Local BLIP image processing: [imageProcessor.js]
- Compliance engine: [complianceEngine.js]

## What Gets Stored Where

### MongoDB
- dataset records
- file records
- metadata records
- compliance reports

### Filesystem
- actual uploaded files
- exported bundles

This keeps MongoDB lighter and cheaper than storing all raw media directly in the database.

## Prerequisites

Install these on your laptop:

1. Node.js 18+
2. Python 3.10+
3. MongoDB
   - either local MongoDB
   - or MongoDB Atlas
4. pip working in your Python install

Optional:

- GPU for faster BLIP inference

## Environment Setup

Create `Backend/.env` with values like this:

```env
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MONGODB_URI=mongodb://127.0.0.1:27017/dataset-curation
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
BLIP_MODEL=Salesforce/blip-image-captioning-base
BLIP_SERVICE_URL=http://127.0.0.1:8001/caption
```

For the frontend, create `frontend/.env` if you want to override the default:

```env
VITE_API_BASE_URL=/api
```

## How I Would Run This On My Laptop

Open 3 terminals.

### Terminal 1: BLIP service

```powershell
cd Backend\blip_service
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..
python -m uvicorn blip_service.app:app --host 127.0.0.1 --port 8001
```

Health check:

```powershell
curl http://127.0.0.1:8001/health
```

### Terminal 2: Backend

```powershell
cd Backend
npm install
npm run dev
```

Expected:

- MongoDB connects
- backend starts on port `5000`

### Terminal 3: Frontend

```powershell
cd frontend
npm install
npm run dev
```

Expected:

- Vite starts on port `5173`

Then open:

```text
http://localhost:5173
```

## Upload Flow

When you upload files:

1. frontend sends multipart request to `POST /api/dataset/upload`
2. backend stores uploaded files in `Backend/uploads`
3. backend creates Mongo records
4. processing starts asynchronously
5. text files go to Gemini
6. image files go to the local BLIP API
7. compliance engine scores the dataset
8. dataset status becomes `Ready`

## AI Behavior

### Text files
- Gemini returns structured JSON metadata
- If Gemini is unavailable, the backend falls back to heuristic extraction so the app does not break

### Image files
- Backend calls the local BLIP API
- BLIP returns a caption
- Backend converts the caption into normalized tags and objects
- If the BLIP API is unavailable, the backend falls back to filename-based heuristics

## Compliance Rules

Current checks include:

- emails
- phone numbers
- basic name heuristic
- healthcare + identity overlap for HIPAA-style risk
- violence keywords
- adult-content keywords

Output includes:

- compliance score
- violations
- warnings
- auto-fix suggestions

## Useful Files

- Root backend entry: [index.js]
- Upload routes: [api.routes.js]
- Dataset controller: [dataset.controller.js]
- Metadata orchestration: [metadata.ai.service.js]
- Compliance aggregation: [compliance.engine.js]
- BLIP microservice: [app.py]

## Troubleshooting

### Backend cannot connect to MongoDB
- verify `MONGODB_URI`
- if local Mongo is used, confirm MongoDB is running

### BLIP service does not start
- make sure Python version is compatible
- reinstall requirements inside the virtual environment
- first model download can take time

### Images are using fallback instead of BLIP
- verify `BLIP_SERVICE_URL`
- check `http://127.0.0.1:8001/health`

### Text is using fallback instead of Gemini
- verify `GEMINI_API_KEY`
- check backend logs for Gemini errors

### Frontend cannot hit backend
- confirm backend is running on `5000`
- confirm frontend is running on `5173`
- confirm `CORS_ORIGINS` includes the frontend URL

## Quick Start Summary

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
