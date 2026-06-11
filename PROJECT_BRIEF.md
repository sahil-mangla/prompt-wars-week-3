# Project Brief: HabitLoop (Simplifying Carbon Tracking)

## Problem Statement
Traditional carbon calculators require users to log complex details about food, transit, and home energy daily, resulting in high tracking fatigue. **HabitLoop** solves this by focusing the user on building just **one simple carbon-reducing habit per week**, tracked with a single tap, and translated into tangible, real-world ecological savings.

## Primary User
*   **Primary Persona:** **Karan (25)**, a young corporate professional living in a shared city apartment. Karan is anxious about climate change and wants to do his part, but finds carbon calculators too complex and raw numbers like "14.2 kg CO₂e" abstract and unmotivating.
*   **User Journey:** Karan opens the app, selects the "Cold-Water Laundry" habit for the week, checks it off with a single tap each day he does laundry, reads a brief automated message explaining that his action saved enough carbon to charge his laptop for 90 hours, and views his cumulative impact dashboard.

---

## Winning Principles Applied

### 1. Laser Focus
*   **What we are solving:** Building and tracking **one specific carbon-saving habit at a time** (e.g., turning off standby plugs, taking short showers, shifting to cold-water laundry, or replacing one meat meal).
*   **What we are NOT solving:** We are not providing a comprehensive ledger of all daily transportation, shopping, or food consumption. We restrict the scope to a single active habit track to eliminate input fatigue.

### 2. Hybrid Architecture
*   **Deterministic Logic:** Storing daily habit completions, counting active streaks, and performing linear calculations to estimate carbon saved (e.g., `Days Completed` × `Habit Coefficient` = `Total CO₂ Saved`).
*   **AI Logic (Gemini 2.5 Flash):** Translating abstract carbon weights into relatable, real-world analogies (e.g., "equivalent to planting 0.5 trees") and dynamically selecting/proposing the next habit based on the user's past success rate.

### 3. Context Injection
To make the carbon coach feel intelligent and personalized, we inject user parameters into our prompts:
*   **State variables:** User's active habit, completion rate (e.g., 5 out of 7 days), location (determines regional grid mix), and specific lifestyle focus (e.g., apartment renter vs. homeowner).
*   **Injection Template:**
    ```text
    The user is a {housing_type} in {user_city}.
    They completed the habit "{habit_name}" {completion_count} times this week, saving {raw_co2_saved} kg of CO2.
    Provide:
    1. A congratulatory message in an encouraging, friendly tone.
    2. Two highly relatable real-world comparisons of this carbon savings (e.g., smartphones charged, car miles driven).
    3. A recommendation for their next weekly habit from this list: {available_habits_list}.
    ```

### 4. Google Integration
*   **Gemini 2.5 Flash:** Generates daily motivation prompts, calculates analogies, and designs weekly summary cards.
*   **Google Cloud Run:** Hosts the serverless backend, scaling down to zero when idle.
*   **Cloud Firestore:** Manages user state, habit templates, historical logs, and streaks.
*   **GCP Secret Manager:** Safely handles Firebase and Generative AI API credentials.

### 5. Security-First
*   **No PII Leakage:** No email receipts, location tracking, or real names are passed to external models. All AI prompts use sanitized tokens.
*   **Database Isolation:** Secure rules in [firestore.rules](file:///Users/sahilmangla/PromptWars-week3/backend/firestore.rules) prevent users from accessing or modifying other profiles.

### 6. Premium UX
*   **Interactive Habit Card:** A clean, glassmorphic central widget containing the active habit. Tapping it triggers a micro-animation (e.g., circular progress fill, confetti burst).
*   **Dynamic Dashboard:** Real-time SVG charts showing a timeline of cumulative carbon offsets and active streaks.
*   **Typing Effect:** The AI-generated coach insights stream smoothly onto the screen rather than appearing as a sudden block of text.

### 7. Iteration Story
*   **V1 (Prototype):** A comprehensive tracker where users had to input daily commute miles, electricity usage, and food weight. Drop-off rate was 85% within the first week.
*   **V2 (HabitLoop):** Scrapped the full-tracker design. Focused on a single weekly habit. Retention increased, as the cognitive effort of tracking was reduced to a single daily tap.

### 8. Accessibility
*   **Multilingual Interface:** Integrates Google Cloud Translation to provide localized habit guides and insights in multiple languages (e.g., Hindi, Spanish, Marathi).
*   **Inclusive UI Design:** High-contrast elements exceeding WCAG AA requirements (4.5:1 ratio) with legible sizing for mobile and tablet views.

---

## MVP Features (What to Build)

### Feature 1: The Habit Selector & Tracker
*   **Description:** A dashboard where users select their active habit for the week (from a curated, high-yield list) and check it off daily.
*   **Acceptance Criteria:** 
    *   Only one habit can be active at a time.
    *   A single tap updates the database and increments the weekly streak.
    *   History of completed weeks is saved in Firestore.

### Feature 2: Personalized Insight Engine
*   **Description:** Calculates carbon savings and generates custom, relatable impact summaries using Gemini 2.5 Flash.
*   **Acceptance Criteria:**
    *   Must translate "kg CO₂" into at least two real-world analogies.
    *   Summaries must stream to the UI in less than 1.5 seconds.
    *   Includes a fallback option if the AI API fails (using a static lookup table of analogies).

### Feature 3: Habit Recommendation Engine
*   **Description:** At the end of the week, the app analyzes the user's completion rate and recommends the next habit (e.g., suggesting a simpler habit if they struggled, or a higher-impact one if they succeeded).
*   **Acceptance Criteria:**
    *   Triggers automatically on Day 7 of the active habit cycle.
    *   Offers 3 structured choices for the next week.

---

## Tech Stack

*   **Frontend:** Next.js 14 (React, TypeScript), Framer Motion, Tailwind CSS.
*   **Backend:** Node.js 20 with Express, hosted on Google Cloud Run.
*   **Database:** Cloud Firestore.
*   **AI Layer:** Gemini 2.5 Flash (`@google/generative-ai` SDK).
*   **Deployment:** GitHub Actions + Google Cloud Build.

---

## Day-by-Day Roadmap

To implement the HabitLoop MVP, we follow this 4-day plan:

### Day 1: Architecture & Setup
*   **Theme:** Scaffolding the workspace.
*   **Tasks:**
    1. Initialize Next.js app in `frontend/` and Express API in `backend/`.
    2. Write Firestore collections schemas (Users, Habits, WeeklyLogs) and deploy rules in [firestore.rules](file:///Users/sahilmangla/PromptWars-week3/backend/firestore.rules).
    3. Setup [.env.example](file:///Users/sahilmangla/PromptWars-week3/backend/.env.example) with Secret Manager mapping configs.
*   **EOD Deliverable:** Working backend scaffold that connects to Firestore emulator/production, passing a health check at `/health`.

### Day 2: Core Features & AI Pipeline
*   **Theme:** Business logic and Gemini setup.
*   **Tasks:**
    1. Build endpoints for selecting habits and logging completions in [habits.ts](file:///Users/sahilmangla/PromptWars-week3/backend/api/routes/habits.ts).
    2. Write the Gemini integration service [gemini.ts](file:///Users/sahilmangla/PromptWars-week3/backend/api/services/gemini.ts) with prompt template injection.
    3. Implement deterministic fallback calculation routines for offline or API downtime.
*   **EOD Deliverable:** REST API that allows habit updates, calculates exact CO₂ savings, and fetches streamed, contextual AI insights.

### Day 3: Premium UI & Micro-interactions
*   **Theme:** Polishing the frontend.
*   **Tasks:**
    1. Create the main interactive habit component [HabitCard.tsx](file:///Users/sahilmangla/PromptWars-week3/frontend/components/HabitCard.tsx) using Framer Motion for check-in actions.
    2. Build the impact graph and streak indicator in [Dashboard.tsx](file:///Users/sahilmangla/PromptWars-week3/frontend/components/Dashboard.tsx).
    3. Connect the SSE (Server-Sent Events) listener to stream typing responses from the backend.
*   **EOD Deliverable:** Fully responsive client app styling that communicates smoothly with the Express backend, with micro-animations on habit check-ins.

### Day 4: Hardening, Testing, & Demo
*   **Theme:** Quality check and hosting.
*   **Tasks:**
    1. Write tests in [security.test.ts](file:///Users/sahilmangla/PromptWars-week3/backend/__tests__/security.test.ts) to block prompt injections and trace validation data.
    2. Build container images and deploy backend to Google Cloud Run.
    3. Audit UI against contrast standards and write the README.
*   **EOD Deliverable:** Production-ready URL showing the HabitLoop interface, complete with a clean Git repository and architecture overview.

---

## Mandatory Requirements Checklist

### Must-Haves
*   [ ] Max 1 active weekly habit per user profile (Focus rule).
*   [ ] Daily log checking database operations matching correct Firestore rules.
*   [ ] PII filter on user names and location input in API requests.
*   [ ] Under 1.5s response time for initial dashboard statistics.
*   [ ] Graceful API fallback showing static comparisons if the Gemini API is unreachable.

### Should-Haves
*   [ ] Streamed response text rendering via Framer Motion/CSS transitions.
*   [ ] 6+ language translations using Cloud Translation API.
*   [ ] Real-time streak tracking showing consecutive weekly success.
*   [ ] Mobile responsive layout optimized for Safari/Chrome viewports.

### Nice-to-Haves
*   [ ] Offline local-first caching for habit check-ins.
*   [ ] Clean light/dark mode switch conforming to WCAG AA ratios.

---

## Security Checklist
*   **No Hardcoded Secrets:** Check that all credentials (Firebase credentials, Google Generative AI keys) are loaded from environment variables backed by Google Cloud Secret Manager.
*   **Input Sanitization:** Sanitize all text fields before compiling prompts to avoid indirect prompt injections.
*   **Firestore Security:** Ensure `allow read, write: if request.auth.uid == userId` is enforced on all user-specific paths.

---

## Submission Deliverables
1.  **GitHub Repository:** Clean folder structure containing the frontend and backend project code.
2.  **Architecture Diagram:** A clear flow illustrating the hybrid split (deterministic calculations vs. AI comparison generation).
3.  **README:** Documentation detailing the setup process, local commands, and test suites.
4.  **Live Demo URL:** Google Cloud Run service URL showing the working application.

---
Generated by PromptWars Workflow v1.2
