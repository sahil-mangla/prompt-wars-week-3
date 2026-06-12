# 🌱 HabitLoop — AI Carbon Coach

> **PromptWars Week 3 Submission** | One simple weekly habit. Real, measurable climate impact.

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-blue?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-Single_Container-blue?logo=docker)](https://docker.com)

---

## 🎯 Project Overview

HabitLoop is a **city-aware, multilingual carbon footprint tracker** powered by Gemini AI. It solves the problem of "climate anxiety and inaction" by narrowing the user's attention to **one simple weekly habit** (e.g., *No-Meat Day*, *Cold-Water Laundry*, *Walk Short Trips*). 

Users log daily completions, visualize their local carbon savings with real-time SVG charts, and receive highly tailored AI coaching with relatable, real-world analogies (e.g. smartphone charges or bulbs avoided) powered by **Gemini 2.5 Flash**.

---

## 🧠 Applying the 8 Winning Principles

### 1. Laser Focus
HabitLoop targets a single primary journey: **selecting and logging one weekly focus habit**. It rejects complex multi-habit dashboards in favor of a clean checklist interface. This lowers the cognitive barrier to entry, helping users build momentum one week at a time.

### 2. Hybrid Architecture
We separate deterministic logic from generative logic to keep the application fast, cost-effective, and reliable:
*   **Deterministic Engine:** Local carbon calculations (using city-specific grid intensities and raw constants) and rules-based fallback coaching templates.
*   **AI Engine:** Gemini 2.5 Flash for personalized context synthesis, translating rules, and composing creative carbon analogies.

### 3. Context Injection
The Gemini prompt is dynamically injected with rich local state data:
*   **User Geography:** The user's city (mapping to grid carbon intensity).
*   **Home Context:** Housing type and diet style.
*   **Performance Metrics:** Weekly completion rate, active habit type, and total lifetime CO₂ saved.

### 4. Deep Google Integration
We leverage the Google Cloud and Firebase ecosystem for production robustness:
*   **Gemini 2.5 Flash:** Provides fast, high-quality, and cost-efficient coaching and translations.
*   **Google Cloud Run:** Hosts the entire application in a single container.
*   **Google Cloud Build:** Manages secure, serverless container compilation.
*   **Google Secret Manager:** Secures the Gemini API keys and Firebase service account key.
*   **Cloud Firestore:** Real-time data storage with local in-memory fallback on network failure.

### 5. Security-First Design
Security is built into the architecture:
*   **PII Shield Middleware:** Scans and redacts emails, phone numbers, and payment cards from request payloads before sending any data to the AI model.
*   **Zero Hardcoded Secrets:** Mounts production service accounts as a secure volume in Cloud Run using Secret Manager, pointing `GOOGLE_APPLICATION_CREDENTIALS` to the runtime mount.
*   **Non-Root Executable:** Docker image runs under a dedicated, low-privilege `habitloop` user (UID 1001).

### 6. Premium UX
Designed to capture attention immediately:
*   **Visual Aesthetic:** Glassmorphism UI styling with smooth Framer Motion transitions, custom-tailored dark-mode colors, and responsive layouts.
*   **Interactive Elements:** Real-time typewriter streaming for AI feedback, interactive weekly progress track, and custom SVG line charts.
*   **Custom SVG Icons:** Custom vector silhouettes for stats metrics (flame, sprout-hand, CO₂ cloud, and sparkle) replacing basic emojis.

### 7. Iteration Story
*   **V1 (The Quota Blocker):** The initial design attempted to call multiple fallback models in a loop with multiple retries on failure. Concurrently, a React hook in the frontend depended directly on the coaching state, resulting in a recursive rendering loop that exhausted the API quota in seconds.
*   **V2 (Production Ready):** Optimized the frontend using React `useRef` to handle the coaching state cleanly without triggering infinite loops. Reconfigured the backend to **fail-fast** (making exactly one API call to `gemini-2.5-flash`), instantly logging any server-side error and falling back to a deterministic rules-based coaching engine without causing delays or wasting quota.

### 8. Accessibility & Localization
*   **WCAG Compliant:** Semantic HTML5 layouts, visible focus rings, aria-labels for buttons, and high-contrast color choices.
*   **Multilingual Support:** Fully localizes the entire interface into 8 languages (English, Hindi, Spanish, French, German, Marathi, Portuguese, Tamil) using Gemini Translation.

---

## 🏗️ Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                    Single Container                    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Express.js API (Port 8080)            │  │
│  │                                                  │  │
│  │  GET  /health                                    │  │
│  │  GET  /api/habits (serves translated catalogue)  │  │
│  │  POST /api/habits/log                            │  │
│  │  POST /api/habits/coach                          │  │
│  │  GET  /* (serves static Next.js frontend)        │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             │                          │
│                ┌────────────┴──────────┐               │
│                │     Service Layer     │               │
│                │                       │               │
│                │  GeminiService        │               │
│                │  └─ gemini-2.5-flash  │               │
│                │                       │               │
│                │  TranslationService   │               │
│                │  └─ Gemini translate  │               │
│                └────────────┬──────────┘               │
│                             │                          │
│                ┌────────────┴──────────┐               │
│                │  Firestore Database   │               │
│                │  (with In-Mem fallback)               │
│                └───────────────────────┘               │
└────────────────────────────────────────────────────────┘
```

---

## 🐳 Local Development

### 1. Environment Setup
Configure the environment variables:
```bash
# Set up backend env
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

### 2. Run Locally
**Terminal 1 — Backend API (Port 5001)**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend (Port 3000)**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the app.

### 3. Run Tests
Execute the unit tests covering CRUD routes, CO₂ math, PII security middleware, translation, and fail-fast fallback behavior:
```bash
cd backend
npm test
```

---

## 🚀 Automated Production Deployment

To deploy the application securely to **Google Cloud Run** using **GCP Secret Manager** (which prevents secrets and `service-account.json` from being baked into the Docker image):

1. Make sure you are authenticated with the Google Cloud CLI:
   ```bash
   gcloud auth login
   ```
2. Run the automated deployment script:
   ```bash
   ./deploy.sh
   ```

The script automatically sets up the Secrets in GCP Secret Manager, uploads your local service account credentials, builds the Docker image with Google Cloud Build (observing the `.dockerignore` file), and deploys the Cloud Run service with secure runtime volume mounts.

---

## 📁 Project Structure

```
PromptWars-week3/
├── backend/
│   ├── api/
│   │   ├── index.ts           # Express entry (serves static + API)
│   │   ├── routes/
│   │   │   ├── habits.ts      # Habit CRUD, CO₂ calculations, API routes
│   │   │   └── health.ts      # Health check
│   │   ├── services/
│   │   │   ├── gemini.ts      # Gemini AI coaching wrapper & rules engine
│   │   │   └── translation.ts # Translation service
│   │   └── middleware/
│   │       └── security.ts    # PII shielding
│   ├── __tests__/
│   │   ├── gemini.test.ts     # Fail-fast and rules engine tests
│   │   ├── translation.test.ts# Translation service tests
│   │   └── security.test.ts   # PII redaction integration tests
│   └── package.json
├── frontend/
│   ├── components/
│   │   └── HabitCard.tsx      # Premium UX Component (Framer Motion + SVGs)
│   └── src/app/
│       ├── page.tsx           # Main Page
│       ├── layout.tsx         # SEO and Metadata
│       └── globals.css        # Core Design System
├── Dockerfile                 # Single-container production Dockerfile
├── .dockerignore              # Prevents local secrets from leaking to images
├── firestore.rules            # Firestore security rules
├── deploy.sh                  # Automated Cloud Run deployment script
└── README.md                  # Submission Documentation
```

---
*Built with ❤️ using Gemini 2.5 Flash, Google Cloud, Next.js, and Framer Motion*
