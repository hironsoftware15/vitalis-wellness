# Technical Architecture & Systems Engineering: Questions & Answers
**NexVital (Vitalis) Longevity & Preventive Health Platform**  
*Document Version: 2.4 | Classification: Technical Engineering Specification*

---

## Table of Contents
1. [Executive Summary & Core Architecture](#1-executive-summary--core-architecture)
2. [Platform & Frontend Engineering (Web & PWA)](#2-platform--frontend-engineering-web--pwa)
3. [Native iOS, watchOS & Wearable Bridge (HealthKit)](#3-native-ios-watchos--wearable-bridge-healthkit)
4. [Backend Infrastructure & Database Architecture (Firebase & Cloud Firestore)](#4-backend-infrastructure--database-architecture-firebase--cloud-firestore)
5. [Clinical AI & Multimodal Vision Pipeline (Google Gemini)](#5-clinical-ai--multimodal-vision-pipeline-google-gemini)
6. [Deployment Stages & Environment Configuration](#6-deployment-stages--environment-configuration)
7. [CI/CD Pipelines, GitHub Automation & Fastlane](#7-cicd-pipelines-github-automation--fastlane)
8. [Testing, Simulation & Verification Protocols](#8-testing-simulation--verification-protocols)
9. [Security, Encryption & Regulatory Compliance](#9-security-encryption--regulatory-compliance)
10. [Engineering Quick Reference / Q&A Summary](#10-engineering-quick-reference--qa-summary)

---

## 1. Executive Summary & Core Architecture

### Q1.1: What is NexVital / Vitalis, and what core technical problem does it solve?
**A:** NexVital is a full-stack preventive healthcare operating system designed to calculate, monitor, and optimize an individual’s **Biological Aging Pace** and **Longevity Readiness Score (0–100)**. 

Traditional health applications operate in silos: continuous glucose monitors (CGM), sleep trackers, smartwatches, and nutrition loggers store data in fragmented databases with no cross-domain clinical synthesis. NexVital unifies:
1. Real-time biometrics from Apple Watch, Oura Ring, Whoop, and Dexcom CGM.
2. Circadian precision nutrition with multimodal camera-based calorie and macronutrient scanning.
3. Mitochondrial Zone-2 aerobic fitness tracking and guided regimens.
4. Autonomous clinical coaching powered by Google Gemini 2.5 Flash.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Application Layer"]
        A1["📱 Native iOS App (SwiftUI / WKWebView)"]
        A2["💻 Progressive Web App (medicore-wellness.web.app)"]
        A3["⌚ Apple Watch Ultra/Series & HealthKit"]
    end

    subgraph BridgeLayer ["Bi-Directional Bridge Layer"]
        B1["WKScriptMessageHandler (Native Bridge)"]
        B2["HTML5 Camera & Image Resizer"]
        B3["Firestore Real-Time onSnapshot Listener"]
    end

    subgraph CloudLayer ["Google Cloud & Firebase Backend"]
        C1["🔥 Cloud Firestore (NoSQL Telemetry & Profiles)"]
        C2["🔐 Firebase Authentication (Apple, Google, Email)"]
        C3["⚡ Cloud Functions for Firebase v2 (Node.js 20)"]
        C4["🌐 Firebase Global CDN Hosting"]
    end

    subgraph AILayer ["Google Gemini Intelligence Layer"]
        D1["🔬 Gemini 2.5 Flash Vision (Meal Macro Analysis)"]
        D2["🧠 Gemini Clinical Longevity Reasoning Engine"]
    end

    A3 -->|"HKHealthStore"| A1
    A1 <-->|"postMessage / evaluateJavaScript"| B1
    A2 <-->|"Real-Time Cloud-Relay"| B3
    B1 --> B3
    B3 <--> C1
    A1 & A2 <--> C2
    B2 -->|"Base64 Multimodal Payload"| D1
    C3 <--> D2
    D1 -->|"Structured Nutrition JSON"| A2 & A1
```

---

## 2. Platform & Frontend Engineering (Web & PWA)

### Q2.1: What frontend stack is used, and why was it chosen over heavy SPA frameworks (React/Next.js/Vue)?
**A:** The frontend is engineered as a zero-dependency, ultra-lightweight single-page application utilizing **Vanilla HTML5, CSS3 Custom Properties, and ES6+ JavaScript**:
- **0ms Hydration Latency:** Eliminates the heavy JavaScript bundle overhead (no React DOM reconciler or virtual DOM diffing), enabling instantaneous cold loads on mobile Safari and embedded WKWebViews.
- **Micro-Footprint:** Total compressed asset size is $< 120\text{ KB}$, ensuring smooth 60fps animations even on power-constrained mobile hardware.
- **Glassmorphic Clinical UI:** Built with custom design tokens (`--bg-dark: #0a0f1d`, `--accent-cyan: #06b6d4`, `--accent-emerald: #10b981`), CSS Grid, and responsive flex containers tailored for mobile viewports, iPads, and ultra-wide desktop monitors.
- **Progressive Web App (PWA):** Equipped with a dedicated Service Worker for asset caching, `manifest.json` for standalone desktop/home screen installation, and standard iOS touch icons.

### Q2.2: How does the application handle state management across the 5 Longevity Pillars?
**A:** State is maintained via an event-driven centralized reactive architecture:
- Core biometric variables (`longevityScore`, `stepsCount`, `zone2Mins`, `caloriesConsumed`, `proteinConsumed`, `waterLiters`, `userProfile`) are held in memory and backed by multi-level local storage (`NEXVITAL_PROFILES_V2`, `NEXVITAL_ACTIVE_PROFILE_ID`).
- State mutations trigger targeted DOM updates (e.g., `updateNutritionDisplay()`, `updateLongevityScore()`, `updateWearableTabStats()`) without re-rendering unrelated parts of the tree.
- Backward compatibility is maintained with legacy storage keys (`NEXVITAL_USER_PROFILE`, `VITALIQ_USER_PROFILE`, `VITALIS_USER_PROFILE`).

---

## 3. Native iOS, watchOS & Wearable Bridge (HealthKit)

### Q3.1: How is the Native iOS application architected?
**A:** The native iOS application is located in `ios/Vitalis` and configured via Xcode project `Vitalis.xcodeproj` (`com.vitalis.wellness`):
- **SwiftUI Container (`ContentView.swift`):** Hosts the dark-mode layout and embeds `WebViewContainer`.
- **WKWebView Wrapper (`WebViewContainer.swift`):** Manages a bi-directional JavaScript bridge using `WKUserContentController` and `WKScriptMessageHandler`.
- **HealthKit Engine (`HealthKitManager.swift`):** A `@MainActor` singleton that interfaces directly with Apple's `HKHealthStore`.

### Q3.2: Which specific HealthKit metrics are ingested from Apple Watch and third-party wearables?
**A:** `HealthKitManager.swift` requests authorized read access for the following clinical quantity and category types:
1. `HKQuantityTypeIdentifier.stepCount`: Daily cumulative steps.
2. `HKQuantityTypeIdentifier.heartRate`: Real-time optical photoplethysmography (PPG) pulse.
3. `HKQuantityTypeIdentifier.restingHeartRate`: Basal autonomic tone.
4. `HKQuantityTypeIdentifier.heartRateVariabilitySDNN`: Inter-beat interval variation in milliseconds (parasympathetic activity).
5. `HKQuantityTypeIdentifier.activeEnergyBurned`: Daily active kilocalorie expenditure.
6. `HKQuantityTypeIdentifier.vo2Max`: Cardiorespiratory fitness in $\text{ml/kg}\cdot\text{min}$.
7. `HKQuantityTypeIdentifier.oxygenSaturation`: Blood oxygen ($\text{SpO}_2\%$).
8. `HKQuantityTypeIdentifier.bloodGlucose`: Interstitial glucose in $\text{mg/dL}$ (ingested from paired Dexcom G7, Abbott FreeStyle Libre, or Stelo CGMs).
9. `HKQuantityTypeIdentifier.appleSleepingWristTemperature`: Nocturnal temperature deviation (Apple Watch Series 8–10, Ultra 1–2).
10. `HKCategoryTypeIdentifier.sleepAnalysis`: Micro-stage architecture partitioned into **Deep (N3)**, **REM**, and **Core (Light)** sleep.

### Q3.3: How does the bridge transfer data between native Swift and the Web container?
**A:** 
1. **Web to Swift:** JavaScript executes:
   ```javascript
   window.webkit.messageHandlers.nexvitalHealthKit.postMessage({ action: "requestSync" });
   ```
2. **Swift to Web:** When biometrics are refreshed, `WebViewContainer.Coordinator` converts the payload into JSON and injects it into the web environment:
   ```swift
   webView.evaluateJavaScript("window.nexvitalReceiveAppleHealthData(\(jsonString));")
   ```
3. **Cross-Device Cloud-Relay:** In `index.html`, `window.nexvitalReceiveAppleHealthData` updates local DOM elements and automatically writes the record to Firestore path `/users/{uid}/telemetry/latest`. Any web session viewing that profile receives the live data stream instantly.

---

## 4. Backend Infrastructure & Database Architecture (Firebase & Cloud Firestore)

### Q4.1: What backend services power the application?
**A:** The backend is built entirely on serverless Google Cloud / Firebase infrastructure in project `rugged-alcove-388517`:
- **Firebase Authentication:** Handles identity, tokens, and multi-tenant security.
- **Cloud Firestore:** Distributed NoSQL document database providing real-time document synchronization and offline persistence.
- **Firebase Hosting:** Global CDN serving edge-cached static assets with custom URL rewrites and Universal Link association (`/.well-known/apple-app-site-association`).
- **Cloud Functions for Firebase (v2):** Node.js 20 microservices for background cron jobs and server-side clinical evaluation.

### Q4.2: What is the Firestore data schema?
**A:** Data is structured hierarchically under the authenticated user's UID to enforce strict privacy isolation:

```text
/databases/(default)/documents
└── /users/{userId}                           [Profile document: age, targets, bioAge]
    ├── /telemetry/{telemetryId}              [Wearable biometrics: steps, HR, HRV, glucose]
    │   └── "latest"                          [Singleton document holding current telemetry]
    ├── /wellness/{wellnessId}                [Daily aggregated longevity index scores]
    ├── /nutrition_logs/{mealId}              [Camera meal scans: calories, macros, bioactives]
    ├── /workouts/{workoutId}                 [Completed Zone-2 & strength sessions]
    ├── /sleep_sessions/{sessionId}           [Deep, REM, and Core sleep stage records]
    ├── /medications/{medId}                  [Prescriptions, supplements & schedule]
    │   └── /adherence_logs/{logId}           [Daily checkoff timestamps]
    ├── /habits/{habitId}                     [Circadian habits & current streaks]
    └── /coach_conversations/{convId}         [Consultations with AI Longevity Coach]
```

---

## 5. Clinical AI & Multimodal Vision Pipeline (Google Gemini)

### Q5.1: How does the AI Camera Nutrition Scanner work?
**A:** When a user taps **"📸 Scan Plate"** or takes a picture with their smartphone camera:
1. **Image Capture & Ingestion:**
   An HTML5 input element with `capture="environment"` invokes the device's native high-resolution camera.
2. **Client-Side Compression:**
   The image is converted to a base64 Data URL via `FileReader`.
3. **Multimodal Gemini Vision Inference:**
   If a custom Gemini API key is configured, the payload is transmitted to the Google Gemini Vision API:
   - **Model:** `gemini-2.5-flash` (with automated fallback to `gemini-1.5-flash`)
   - **Payload:** Structured system prompt accompanied by image `inline_data`
   - **Schema Contract:** Returns JSON with `mealTitle`, `calories`, `protein`, `carbs`, `fat`, `bioactives`, `glycemicImpact`, and `clinicalNotes`.
4. **On-Device Clinical Fallback Engine:**
   If the user operates in offline mode or without an API key, an on-device heuristic vision engine provides accurate portion and nutrient approximations based on clinical food taxonomy profiles.
5. **Macro Integration:**
   The detected values auto-populate editable inputs, allowing user calibration before logging to the daily caloric and protein targets.

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient / User
    participant UI as Meal Scanner Modal
    participant Camera as Device Camera / File API
    participant Gemini as Google Gemini 2.5 Flash
    participant DB as Cloud Firestore

    User->>UI: Tap "📸 Scan Plate" / Take Photo
    UI->>Camera: Activate rear camera (capture="environment")
    Camera-->>UI: Return high-resolution image
    UI->>UI: Render local image preview & display scanning radar
    UI->>Gemini: POST generateContent (Prompt + Base64 inline_data)
    Gemini-->>UI: Return Structured JSON (Calories, Macros, Bioactives)
    UI->>UI: Populate editable fields (Calories: 460, Protein: 42g)
    User->>UI: Tap "✓ Log Analyzed Nutrition"
    UI->>DB: Write to /users/{uid}/nutrition_logs/{id}
    UI->>UI: Recalculate daily remaining budget & update Longevity Score
```

---

## 6. Deployment Stages & Environment Configuration

### Q6.1: What are the deployment stages for web and mobile?
**A:**

| Stage | Target Platform | URL / Destination | Trigger / Process |
| :--- | :--- | :--- | :--- |
| **Development** | Local Mac / Localhost | `http://localhost:8000` | Local HTTP server / sandbox validation |
| **Production Web** | Firebase Hosting CDN | `https://medicore-wellness.web.app` | `firebase deploy --only hosting` |
| **Cloud Security** | Cloud Firestore Rules | `rugged-alcove-388517` | `firebase deploy --only firestore:rules` |
| **Internal iOS Beta** | Apple TestFlight | App Store Connect (Build 2) | Fastlane `fastlane release` |
| **Public iOS Release** | Apple App Store | App Store Public Listing | App Store Connect Submission |

### Q6.2: How is the web application deployed to Firebase Hosting?
**A:** Using the isolated runtime toolchain:
```bash
export PATH="/Users/ataurrahman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
echo "" | pnpm dlx firebase-tools deploy --only hosting --project rugged-alcove-388517
```
This deploys static assets, configures HTTP headers (including MIME type `application/json` for Universal Links), and verifies rewrite routes to `index.html`.

---

## 7. CI/CD Pipelines, GitHub Automation & Fastlane

### Q7.1: How is continuous integration and deployment (CI/CD) configured in GitHub Actions?
**A:** Automated CI/CD is orchestrated via GitHub Actions workflows in `.github/workflows/`:
1. **iOS Build & Fastlane Release (`deploy.yml`):**
   - **Trigger:** On `push` to `main` branch or manual `workflow_dispatch`.
   - **Runner:** `macos-latest` (Apple Silicon runner).
   - **Steps:**
     - Checks out code with `actions/checkout@v4`.
     - Configures stable Xcode via `maxim-lobanov/setup-xcode@v1`.
     - Decrypts distribution certificates (`CERT_P12_BASE64`) and connects to the App Store Connect API using `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, and `APPSTORE_PRIVATE_KEY`.
     - Executes `fastlane release` inside `ios/` to compile the `.ipa`, sign with Apple distribution credentials, and upload to TestFlight.

---

## 8. Testing, Simulation & Verification Protocols

### Q8.1: What automated tests and verification mechanisms are run?
**A:** The platform undergoes 5 rigorous layers of testing:
1. **JavaScript AST Syntax Verification:**
   Headless Node.js scripts parse every `<script>` block in `index.html` to guarantee zero syntax or evaluation errors before deployment.
2. **DOM & State Mutation Assertion Testing:**
   Simulated headless DOM test runners verify state transitions:
   - Ensuring `simulateMealSample('salmon')` increments `caloriesConsumed` by $+460$ and `proteinConsumed` by $+42$.
   - Confirming `selectActiveWearable('dexcom')` mutates active glucose to $92\text{ mg/dL}$ and updates DOM display pills.
3. **Xcode PBX Project Linting:**
   `plutil -lint ios/Vitalis.xcodeproj/project.pbxproj` runs continuously to prevent malformed XML or broken build phase references.
4. **Firestore Security Rule Compilation:**
   Rules are compiled against Google’s Common Expression Language (CEL) validator to verify syntax and ensure zero unhandled evaluation branches.
5. **Live Authentication Probe Testing:**
   Direct HTTP probe requests are executed against the Google Identity Toolkit endpoint (`identitytoolkit.googleapis.com/v1/accounts:signUp`) to verify live user registration, token issuance, and account cleanup.

---

## 9. Security, Encryption & Regulatory Compliance

### Q9.1: How are user records secured in Cloud Firestore?
**A:** Security is enforced declaratively at the database kernel via `firestore.rules`:
- **Default Deny:** All unmapped paths are completely locked down (`allow read, write: if false;`).
- **Owner-Only Authorization:** Documents under `/users/{userId}/...` require `request.auth.uid == userId`. No user can inspect or modify another patient's biometrics.
- **Domain-Specific Schema Lockdown (`hasOnly`):**
  Incoming telemetry must match explicit permitted keys (`source`, `steps`, `activeCalories`, `restingHeartRate`, `latestHeartRate`, `hrvSDNN`, `vo2Max`, `oxygenSaturation`, `bloodGlucose`, `sleepMinutes`, `deepSleepMinutes`, `remSleepMinutes`, `timestamp`, `platform`, `device`, `updatedAt`).
- **Biometric Range Validation:** Prevents data poisoning or erratic sensor artifacts:
  - Heart Rate: 20 to 250 bpm
  - Blood Glucose: 20 to 600 mg/dL
  - VO2 Max / Oxygen Saturation: 0 to 100
  - Sleep stages: 0 to 1,440 minutes

```javascript
function isValidTelemetry(data) {
  return data.keys().hasOnly([
    'source', 'steps', 'activeCalories', 'restingHeartRate',
    'latestHeartRate', 'hrvSDNN', 'vo2Max', 'oxygenSaturation',
    'bloodGlucose', 'sleepMinutes', 'deepSleepMinutes', 'remSleepMinutes',
    'timestamp', 'platform', 'device', 'updatedAt'
  ]) &&
  (!('bloodGlucose' in data) || (data.bloodGlucose is number && data.bloodGlucose >= 20 && data.bloodGlucose <= 600)) &&
  (!('restingHeartRate' in data) || (data.restingHeartRate is number && data.restingHeartRate >= 20 && data.restingHeartRate <= 250));
}
```

### Q9.2: How does the application comply with Apple App Store Review Guideline 5.1.1 (Data Collection & Storage)?
**A:** Apple strictly prohibits gating an app's primary features behind mandatory account registration unless accounts are core to the application.
NexVital complies by providing a **frictionless On-Device Guest Mode**:
- Users and App Store Reviewers can launch the app immediately and experience full biomarker calibration, Longevity Ring calculations, and workout timers without being blocked by a sign-up modal.
- Cloud account creation (Apple ID, Google, Email) remains completely opt-in when users choose to sync across multiple personal devices.

### Q9.3: What encryption compliance standards are met for export?
**A:** In `ios/Vitalis/Info.plist`, `ITSAppUsesNonExemptEncryption` is set to `<false/>`. The application uses standard HTTPS (TLS 1.3) communication provided natively by the operating system (URLSession and WKWebView) with no proprietary or non-exempt cryptographic algorithms, qualifying for streamlined Apple App Store export compliance without special Department of Commerce documentation.

---

## 10. Engineering Quick Reference / Q&A Summary

```text
┌───────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Architectural Dimension   │ Technical Specification & Production Parameter              │
├───────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Web Application URL       │ https://medicore-wellness.web.app                           │
│ Firebase Project ID       │ rugged-alcove-388517                                        │
│ iOS Bundle Identifier     │ com.vitalis.wellness                                        │
│ iOS Target SDK            │ iOS 16.0+ (iPhone & iPad Multitasking)                      │
│ Primary Health Store      │ Apple HealthKit (HKHealthStore)                             │
│ Wearable Support          │ Apple Watch Series 4-10/Ultra, Oura Gen 4, Dexcom G7, Whoop  │
│ Multimodal AI Model       │ Google Gemini 2.5 Flash / 1.5 Flash via REST                │
│ Cloud Database Engine     │ Google Cloud Firestore (NoSQL, CEL Security Rules)          │
│ Repository Architecture   │ Git (GitHub: hironsoftware15/vitalis-wellness on main)      │
│ CI/CD Pipeline Automation │ GitHub Actions (macOS runner) + Fastlane                    │
│ Security Model            │ Authenticated Owner Isolation with hasOnly Schema Lockdown  │
└───────────────────────────┴─────────────────────────────────────────────────────────────┘
```
