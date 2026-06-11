# 🌱 HabitLoop — AI Carbon Coach

> **PromptWars Week 3 Submission** | One simple weekly habit. Real, measurable climate impact.

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-blue?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-Single_Container-blue?logo=docker)](https://docker.com)

---

## 🎯 What is HabitLoop?

HabitLoop is a **city-aware, multilingual carbon footprint tracker** powered by Gemini AI. Users pick one eco-habit per week (e.g., *No-Meat Day*, *Walk Short Trips*), log daily completions, and receive personalized AI coaching with relatable real-world CO₂ comparisons.

### Why it wins

| Principle | Implementation |
|---|---|
| **Focus** | Single weekly habit → low cognitive load, high completion rate |
| **Hybrid Architecture** | Express + Next.js static → single Docker container |
| **Context Injection** | City grid intensity × housing type × diet = accurate CO₂ |
| **Google Integration** | Gemini 2.0 Flash coaching + Firebase Firestore |
| **Security** | PII redactor middleware, non-root Docker user, Secret Manager ready |
| **Premium UX** | Framer Motion, glassmorphism, typewriter AI streaming, SVG charts |
| **Multilingual** | 8 languages via Gemini translation (Hindi, Spanish, French, …) |
| **Accessibility** | WCAG-compliant ARIA labels, focus rings, semantic HTML |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A [Gemini API Key](https://aistudio.google.com/)
- (Optional) Firebase project with Firestore enabled

### 1. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

### 2. Local Development

**Terminal 1 — Backend (port 5001)**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend (port 3000)**
```bash
cd frontend
npm install
npm run dev
```

Open → `http://localhost:3000`

### 3. Test the API

```bash
# Health check
curl http://localhost:5001/health

# List habits
curl http://localhost:5001/api/habits

# Select a habit
curl -X POST http://localhost:5001/api/habits/select \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","habitId":"h1"}'

# Log today's completion
curl -X POST http://localhost:5001/api/habits/log \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Get AI coaching
curl -X POST http://localhost:5001/api/habits/coach \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

---

## 🐳 Docker (Single Container)

```bash
# Build
docker build -t habitloop:latest .

# Run
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key_here \
  -e GCP_PROJECT_ID=your_project_id \
  habitloop:latest

# Open http://localhost:8080
```

The container serves both the Express API (`/api/*`) and the Next.js static frontend from a single port.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Single Container             │
│                                         │
│  ┌────────────────────────────────┐     │
│  │   Express.js API (Port 8080)   │     │
│  │                                │     │
│  │  GET  /health                  │     │
│  │  GET  /api/habits              │     │
│  │  GET  /api/languages           │     │
│  │  GET  /api/user/profile/:id    │     │
│  │  POST /api/user/profile        │     │
│  │  POST /api/habits/select       │     │
│  │  POST /api/habits/log          │     │
│  │  POST /api/habits/coach        │     │
│  │                                │     │
│  │  GET  /* → Next.js static      │     │
│  └──────────────┬─────────────────┘     │
│                 │                       │
│    ┌────────────┴──────────┐            │
│    │    Service Layer      │            │
│    │                       │            │
│    │  GeminiService        │            │
│    │  ├─ gemini-2.0-flash  │            │
│    │  └─ gemini-1.5-flash  │            │
│    │                       │            │
│    │  TranslationService   │            │
│    │  └─ Gemini translate  │            │
│    └──────────┬────────────┘            │
│               │                        │
│    ┌──────────┴────────────┐            │
│    │  Firestore / In-Mem   │            │
│    │  (automatic fallback) │            │
│    └───────────────────────┘            │
└─────────────────────────────────────────┘
```

---

## 🌍 Supported Languages

| Code | Language  |
|------|-----------|
| `en` | English   |
| `hi` | Hindi     |
| `es` | Spanish   |
| `fr` | French    |
| `de` | German    |
| `mr` | Marathi   |
| `pt` | Portuguese |
| `ta` | Tamil     |

---

## 📊 Carbon Calculation Methodology

CO₂ savings are calculated using:

```
weekly_co2_saved = habit.co2SavedPerDay × completionCount
```

City-specific **grid intensity factors** (gCO₂e/kWh) are applied for electric-based habits:

| City | Grid Intensity |
|------|---------------|
| Mumbai | 820 gCO₂e/kWh |
| Delhi | 920 gCO₂e/kWh |
| London | 210 gCO₂e/kWh |
| San Francisco | 250 gCO₂e/kWh |

Source: Our World in Data / UK DEFRA 2023

---

## 🔒 Security

- **PII Redaction**: Middleware strips emails, phone numbers, Aadhar/SSN patterns from all request payloads before any processing
- **No secrets in code**: All API keys loaded via environment variables / Secret Manager
- **Non-root Docker user**: Production image runs as `habitloop` user (uid 1001)
- **Same-origin in production**: CORS disabled in production (frontend served from same container)

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover: habit CRUD, CO₂ calculations, AI coaching fallback, PII redaction middleware.

---

## 🚀 Deploy to Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/habitloop

# Deploy
gcloud run deploy habitloop \
  --image gcr.io/YOUR_PROJECT_ID/habitloop \
  --platform managed \
  --region us-central1 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --allow-unauthenticated
```

---

## 📁 Project Structure

```
PromptWars-week3/
├── backend/
│   ├── api/
│   │   ├── index.ts           # Express entry (serves static + API)
│   │   ├── routes/
│   │   │   ├── habits.ts      # Habit CRUD, CO₂ calc, AI coach
│   │   │   └── health.ts      # Health endpoint
│   │   ├── services/
│   │   │   ├── gemini.ts      # Gemini AI with city context
│   │   │   └── translation.ts # Multilingual via Gemini
│   │   └── middleware/
│   │       └── security.ts    # PII redaction
│   └── package.json
├── frontend/
│   ├── components/
│   │   └── HabitCard.tsx      # Premium UI (Framer Motion)
│   └── src/app/
│       ├── page.tsx           # Main page
│       ├── layout.tsx         # SEO metadata
│       └── globals.css        # Design system
├── Dockerfile                 # Multi-stage single container
├── firestore.rules            # Firestore security rules
└── README.md
```

---

## 🏆 PromptWars Week 3

Built as part of the PromptWars Virtual hackathon. The submission follows all winning principles from the official workflow guide: single-container architecture, Google AI integration, security-first design, premium UX, and multilingual accessibility.

---

*Built with ❤️ using Gemini 2.0 Flash, Firebase, Next.js, and Framer Motion*
