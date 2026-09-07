# 🛡️ ClaimSnap: AI-Driven Video Insurance Claim Verification

![Deployment](https://img.shields.io/badge/deployment-Railway-black.svg)

**ClaimSnap** is a video-based insurance claim verification platform built for the Heirs Insurance Hackathon. Policyholders submit a short video of damage; a self-hosted computer vision model analyzes it automatically, and the result is routed to a human adjuster portal for review and correction.

## The Problem & Our Solution

Manual damage assessment is slow and easy to spoof with static photos. ClaimSnap addresses this with:

1. **Video-first submission** — policyholders record and upload a short video directly from the browser, no app install required.
2. **Automated triage** — a custom-trained **Ultralytics YOLOv8** model runs inference on the uploaded video and produces a damage classification and confidence score.
3. **Human-in-the-loop review** — every claim, along with its video and AI findings, is available in an Adjuster Portal where a human can approve, reject, or apply a corrected taxonomy label.

## Frontend Features

- **Multi-step claim submission** — a guided flow for recording/uploading video and entering policy details.
- **Real-time status page** — shows the system's decision alongside the AI's exact confidence score, polling for updates while a claim is still processing.
- **Adjuster Portal** — a dashboard for reviewing flagged claims, playing back submitted video, and applying human-in-the-loop taxonomy overrides.
- **Custom toast notifications** — in-app feedback banners in place of native browser alerts.

## Tech Stack

**Frontend:** React 19, Vite, React Router 7, Tailwind CSS 4, Lucide icons.
**Backend:** Flask, Flask-SQLAlchemy, Flask-CORS, Gunicorn.
**Computer Vision:** Ultralytics YOLOv8 (custom-trained weights), OpenCV, Pillow, NumPy for video/frame handling.
**Database:** PostgreSQL (Railway-managed).
**Storage:** Railway persistent volume, mounted at `/data` in production, for uploaded video files.
**Deployment:** Railway (separate services for frontend and backend).

### A note on architecture history

Earlier in development this project integrated Google Cloud Vision and Cloudinary for image analysis and media storage — remnants of that setup (unused credentials, config) are still present in the repo. The project moved to a self-hosted YOLOv8 model for inference and a Railway persistent volume for storage instead. If you're exploring the codebase, the Google Vision/Cloudinary configuration is no longer read by the running application — treat it as historical, not active.

## Local Setup

### Prerequisites
- Node.js 20+
- Python 3.10+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/claimsnap.git
cd claimsnap
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
UPLOAD_FOLDER=uploads
```
`DATABASE_URL` defaults to a local SQLite file if unset. `UPLOAD_FOLDER` defaults to a local `uploads/` folder if unset — in production this is set to a mounted persistent volume path so uploaded videos survive redeploys.

Start the backend:
```bash
python app.py
```
Runs on `http://127.0.0.1:5000`.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Runs on Vite's default local port (typically `http://localhost:5173`).

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/assess` | `POST` | Accepts `multipart/form-data` (video file + `asset_id` + claim details). Runs YOLOv8 inference, saves the video, computes a status (`approved` / `rejected` / `review`), and returns `{"asset_id": "..."}`. |
| `/api/claims` | `GET` | Returns all claim records as a JSON array, including AI findings, confidence score, and video URL. |
| `/api/claims/<id>` | `GET` | Returns a single claim's full record, or a 404 if not found. |
| `/api/admin/override/<id>` | `POST` | Accepts `{"status": "...", "corrected_label": "..."}`. Lets an adjuster force a claim's status and record a corrected taxonomy label for active-learning purposes. |
| `/api/media/<filename>` | `GET` | Streams the stored video file for a given claim. |

## Hackathon Context (Heirs Insurance)

- **Video over photos** — video evidence is meaningfully harder to fake than a static image, directly addressing a known fraud vector in claims processing.
- **Self-hosted inference** — running YOLOv8 directly avoids per-request costs from third-party vision APIs for the inference step itself (standard hosting/compute costs still apply).
- **Active learning loop** — every adjuster correction is stored (`admin_corrected_label`) and available for future model retraining, rather than discarded after the claim closes.
