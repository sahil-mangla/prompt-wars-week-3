# 🌱 HabitLoop — AI Carbon Coach

One simple weekly habit. Real, measurable climate impact.

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-blue?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?logo=vercel)](https://vercel.com)

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

### 4. Google & Firebase Integration
We leverage the Google Gemini and Firebase ecosystem for core functionalities:
*   **Gemini 2.5 Flash:** Provides fast, high-quality, and cost-efficient coaching and translations.
*   **Cloud Firestore:** Real-time data storage with local in-memory fallback on network failure.

### 5. Security-First Design
Security is built into the architecture:
*   **PII Shield Middleware:** Scans and redacts emails, phone numbers, and payment cards from request payloads before sending any data to the AI model.
*   **Zero Hardcoded Secrets:** Production credentials and API keys are stored securely using Vercel Environment Variables (`FIREBASE_SERVICE_ACCOUNT` and `GEMINI_API_KEY`), avoiding any local files or hardcoding.

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
│                    Vercel Platform                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  Vercel Edge                     │  │
│  │  Static Paths (/) ─────> Next.js Static Build    │  │
│  │  API Paths (/api) ─────> Vercel Serverless       │  │
│  │                          (Express Backend)       │  │
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
Execute the complete test suite covering routing integration, Gemini fail-fast and deterministic fallback, Firestore fallback with read-after-write verification, translation, and PII middleware:
```bash
cd backend
npm test
```

---

## 🚀 Production Deployment

The application is deployed on **Vercel** with the configuration defined in [vercel.json](file:///Users/sahilmangla/PromptWars-week3/vercel.json).

### Deployment Steps:
1. Set up the project on Vercel importing this repository.
2. Add the following environment variables in the Vercel Project Settings:
   * `GEMINI_API_KEY`: Your Google Gemini API Key.
   * `FIREBASE_SERVICE_ACCOUNT`: The JSON service account credentials for Firebase Admin SDK access.
3. Deploying to Vercel automatically compiles the Next.js static files and routes all `/api/*` and `/health` requests directly to the serverless Express function.

---

## 📁 Project Structure

```
PromptWars-week3/
├── backend/
│   ├── api/
│   │   ├── index.ts           # Express entry (serves backend router)
│   │   ├── routes/
│   │   │   ├── habits.ts      # Habit CRUD, CO₂ calculations, API routes
│   │   │   └── health.ts      # Health check
│   │   ├── services/
│   │   │   ├── firebase.ts    # Firebase Admin SDK initialization service
│   │   │   ├── gemini.ts      # Gemini AI coaching wrapper & rules engine
│   │   │   └── translation.ts # Translation service
│   │   └── middleware/
│   │       └── security.ts    # PII shielding
│   ├── __tests__/
│   │   ├── gemini.test.ts     # Fail-fast and rules engine tests
│   │   ├── translation.test.ts# Translation service tests
│   │   ├── security.test.ts   # PII redaction integration tests
│   │   ├── routes.test.ts     # Express core routes integration tests
│   │   ├── coach-fallback.test.ts # Gemini API failure fallback route test
│   │   └── firestore-fallback.test.ts # Firestore read/write fallback route test
│   └── package.json
├── frontend/
│   ├── components/
│   │   └── HabitCard.tsx      # Premium UX Component (Framer Motion + SVGs)
│   └── src/app/
│       ├── page.tsx           # Main Page
│       ├── layout.tsx         # SEO and Metadata
│       └── globals.css        # Core Design System
├── vercel.json                # Vercel deployment routes and build config
└── README.md                  # Submission Documentation
```
