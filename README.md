# Aegis — Preventive Health & Wellness Coach (Google Platform)

A full-stack preventive health and longevity coaching platform built on the **Google Platform Ecosystem**:
- **Google Cloud & Firebase**: Cloud Firestore, Cloud Functions v2, Firebase Cloud Messaging (FCM), Firebase Hosting.
- **Google Health Connect**: Standardized on-device health & fitness data aggregation across Pixel Watch, Fitbit, Wear OS, and Android sensors.
- **Gemini AI Coaching Engine**: Powered by `gemini-3.8-flash` via the `@google/genai` SDK with clinical preventive guardrails.

---

## 🌟 Core Pillars

1. **🏋️ Fitness Plans**:
   - Adaptive workouts tailored to physiological recovery and HRV.
   - Mitochondrial Zone-2 aerobic stimulus & thoracic mobility protocols.
   - Synchronized with Google Health Connect step counters and active zone minutes.

2. **🥗 Nutrition Recommendations**:
   - Anti-inflammatory and Mediterranean-aligned dietary suggestions.
   - Multimodal Gemini computer vision for instant meal photo macronutrient and glycemic load analysis.
   - Hydration reminders and macro tracking.

3. **😴 Sleep Improvement Suggestions**:
   - Circadian rhythm alignment based on sunrise and light exposure cues.
   - Wearable sleep stage analysis (Slow-Wave Deep Sleep vs. REM Sleep).
   - Automated caffeine curfew countdown based on adenosine biology.

4. **💊 Medication Reminders**:
   - Daily schedule management with dosage, timing, and meal association.
   - Adherence streak calculations (100% adherence monitoring).
   - Automated high-priority push notifications via Firebase Cloud Messaging (FCM).

5. **📈 Habit Tracking**:
   - Micro-habit stacking based on behavioral design (morning sunlight, digital sunset, mindfulness).
   - Streak rewards and cumulative wellness score feedback.

6. **🤖 Gemini AI Preventive Coach**:
   - Conversational health coach grounded in user telemetry.
   - Clinical safety guardrails (preventive wellness, not clinical diagnosis or prescription alterations).

---

## 🚀 Quick Start (Local Run)

Start the local server:
```bash
python3 server.py
```
Open your browser at:
```
http://localhost:8080
```

---

## ☁️ Deploying to Google Cloud & Firebase

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Deploy Hosting, Functions & Firestore Rules**:
   ```bash
   firebase deploy
   ```

3. **Set Gemini API Key for Cloud Functions**:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
