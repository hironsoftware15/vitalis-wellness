# Vitalis: Sensor Ecosystem & Apple App Store Release Guide

This document details the physiological and wearable sensor ecosystem for **Vitalis** and provides the complete architecture and submission blueprint for publishing on the **Apple App Store** (`com.vitalis.wellness`).

---

## 1. Physiological & Wearable Sensor Ecosystem

Vitalis is engineered as an open, multimodal longevity hub capable of ingesting high-frequency physiological telemetry across the consumer and clinical wearable space:

```
                                  ┌──────────────────────────────┐
                                  │      VITALIS AI ENGINE       │
                                  │     (Gemini 3.8 Flash)       │
                                  └──────────────▲───────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
    ┌──────────────▼──────────────┐┌─────────────▼─────────────┐┌──────────────▼──────────────┐
    │     APPLE HEALTHKIT         ││    GOOGLE HEALTH CONNECT  ││   CONTINUOUS SENSORS & CGMS │
    │   (Apple Watch Series 4-10, ││    (Pixel Watch 1-3,      ││   (Dexcom G7, FreeStyle     │
    │    Apple Watch Ultra 1-2)   ││     Fitbit, Galaxy Watch) ││    Libre 3, Oura Ring 4)    │
    └─────────────────────────────┘└───────────────────────────┘└─────────────────────────────┘
```

### A. Apple Watch & Apple HealthKit Metrics

| Sensor / Metric | Clinical & Longevity Significance | HealthKit Identifier |
| :--- | :--- | :--- |
| **Heart Rate Variability (HRV - SDNN & rMSSD)** | **Premier autonomic nervous system marker.** High HRV reflects dominant parasympathetic vagal tone and systemic recovery readiness; suppressed HRV flags physiological strain, poor sleep, or chronic inflammation. | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` |
| **Single-Lead ECG (Electrocardiogram)** | Detects **Atrial Fibrillation (AFib)**, premature ventricular contractions (PVCs), and confirms sinus rhythm directly from the digital crown and rear crystal electrodes. | `HKElectrocardiogramType` |
| **Blood Oxygen Saturation ($SpO_2$)** | Ingested from red and infrared LEDs. Detects nocturnal desaturations, screening for **obstructive sleep apnea (OSA)** and high-altitude hypoxia. | `HKQuantityTypeIdentifierOxygenSaturation` |
| **Wrist Skin Temperature & Deviation** | Tracks nocturnal temperature fluctuations at 5-second intervals. Detects early systemic immune activation (illness onset), metabolic shifts, and biphasic circadian thermal curves. | `HKQuantityTypeIdentifierAppleSleepingWristTemperature` |
| **Cardio Recovery (1-Min Heart Rate Recovery - HRR)** | Measures how rapidly heart rate decelerates in the first 60 seconds post-exercise. Strongly correlated with all-cause cardiorespiratory mortality risk. | `HKQuantityTypeIdentifierHeartRateRecoveryOneMinute` |
| **VO2 Max (Cardio Fitness)** | Maximal oxygen consumption rate during incremental exercise ($ml/kg/min$). The single strongest cardiorespiratory predictor of biological longevity. | `HKQuantityTypeIdentifierVO2Max` |
| **Sleep Architecture Breakdown** | Deep Slow-Wave (physical cellular repair), REM (neuro-cognitive consolidation), Core (Light Sleep), and micro-arousal interruptions. | `HKCategoryTypeIdentifierSleepAnalysis` |
| **Walking Steadiness & Gait Asymmetry** | Tracks stride length, double-support time, and walking asymmetry to proactively evaluate neuromuscular balance and fall risk. | `HKQuantityTypeIdentifierAppleWalkingSteadiness` |
| **Environmental Noise Exposure ($dB$)** | Ingested via microphone sensor to log acoustic pressure and prevent chronic stress-induced cortisol elevation. | `HKQuantityTypeIdentifierEnvironmentalAudioExposure` |

---

### B. Specialized Continuous & Third-Party Sensors

| Sensor Class | Hardware Devices | Primary Biomarkers Ingested | Longevity & Pillar Application |
| :--- | :--- | :--- | :--- |
| **Continuous Glucose Monitors (CGM)** | **Dexcom G7**, **Dexcom Stelo (OTC)**, **Abbott FreeStyle Libre 3** | Interstitial glucose ($mg/dL$), Glycemic Variability (MAGE), Postprandial glucose excursions, Time-in-Range (TIR). | **Pillar 2 (Nutrition & Fasting):** Correlates real-time glycemic spikes with meals and monitors deep autophagy during 16:8 circadian fasts. |
| **Smart Rings** | **Oura Ring Gen 4**, **Ultrahuman Ring Air**, **Samsung Galaxy Ring** | Nocturnal finger temperature, Resting Heart Rate Nadir (hour of lowest HR), Respiratory Rate. | **Pillar 3 (Sleep):** Identifying when cardiovascular restoration occurs in the sleep cycle. |
| **Biostraps & Bands** | **WHOOP 4.0** | Daily Strain Score (0–21), Recovery Score (0–100%), Electrodermal Activity (EDA) for sympathetic arousal. | **Pillar 1 (Fitness):** Recommends whether to perform high-intensity or Zone-2 recovery workouts. |
| **Smart Blood Pressure & Arterial Monitors** | **Withings BPM Connect / BPM Core**, **Omron Evolv** | Systolic/Diastolic BP, Pulse Wave Velocity (PWV - arterial stiffness measure). | **Pillar 1 & 4 (Cardiovascular Health):** Directly assesses vascular compliance and arterial elasticity. |
| **Bioimpedance Clinical Scales** | **Withings Body Scan**, **InBody H20N** | Visceral Fat Rating, Segmental Muscle Mass, Extracellular / Intracellular Water ratio. | **Pillar 1 & 2:** Monitors preservation of lean skeletal muscle mass while burning visceral adipose tissue. |
| **Continuous Core Body Temperature** | **CORE Sensor** | Real-time thermal strain index ($°C$). | **Pillar 1 (Fitness):** Prevents heat exhaustion during outdoor endurance or sauna hormesis. |

---

## 2. Apple iOS Native Codebase Architecture

The native iOS Xcode project is located at:
`[scratch/preventive-health-app/ios/](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/ios/)`

```
ios/
├── Vitalis/
│   ├── VitalisApp.swift                # SwiftUI App Lifecycle entry point
│   ├── ContentView.swift               # Root View container with dark theme
│   ├── HealthKitManager.swift          # Native Apple HealthKit Swift Actor
│   ├── WebViewContainer.swift          # WKWebView + WKScriptMessageHandler Bridge
│   ├── Info.plist                      # Mandatory HealthKit & Camera privacy strings
│   ├── Vitalis.entitlements            # HealthKit & Associated Domains capabilities
│   └── Assets.xcassets/
│       └── AppIcon.appiconset/
│           ├── Contents.json           # Universal 1024x1024 AppIcon config
│           └── icon-1024.png           # 1024x1024 32-bit PNG App Store Icon
└── Vitalis.xcodeproj/                  # Xcode project configuration
```

### Bi-directional Apple HealthKit Bridge (`vitalisHealthKit`)

1. **Native iOS -> Web App Ingestion:**
   When the app opens, [`HealthKitManager.swift`](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/ios/Vitalis/HealthKitManager.swift) queries Apple HealthKit for steps, resting HR, HRV (SDNN), active energy, and sleep stages.
   [`WebViewContainer.swift`](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/ios/Vitalis/WebViewContainer.swift) evaluates JavaScript:
   ```javascript
   window.vitalisReceiveAppleHealthData(payloadJson);
   ```
2. **Web App -> Native iOS Request:**
   When the patient taps the sync button in the web dashboard, the web app triggers:
   ```javascript
   window.webkit.messageHandlers.vitalisHealthKit.postMessage({ action: "requestSync" });
   ```
   The native Swift coordinator instantly queries HealthKit and pushes updated biometrics into the DOM.

---

## 3. Apple App Store Submission Walkthrough

### Step 1: Apple Developer Portal Configuration
1. Log in to [developer.apple.com](https://developer.apple.com).
2. Go to **Certificates, Identifiers & Profiles** -> **Identifiers**.
3. Register App ID: **`com.vitalis.wellness`**.
4. Under **Capabilities**, enable:
   * **HealthKit** (Enable *HealthKit* and *Background Delivery*).
   * **Associated Domains** (Add `applinks:nexvital.com` and `applinks:medicore-wellness.web.app`).
   * **Push Notifications** (For medication adherence and circadian sleep reminders).

---

### Step 2: App Store Connect App Record
1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Click **My Apps** -> **+ New App**:
   * **Name:** `NexVital: AI Longevity Coach`
   * **Primary Language:** `English (U.S.)`
   * **Bundle ID:** `com.vitalis.wellness`
   * **SKU:** `nexvital-longevity-ios`
   * **User Access:** Full Access.
3. **Primary Category:** `Health & Fitness` -> **Secondary Category:** `Medical` or `Lifestyle`.

---

### Step 3: Store Listing Graphics & Metadata
* **App Icon:** Upload [`assets/icon-1024.png`](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/assets/icon-1024.png) (1024 x 1024 px PNG, no transparency, sRGB).
* **Privacy Policy URL:** `https://nexvital.com/privacy-policy.html` (or `https://medicore-wellness.web.app/privacy-policy.html`).
* **Subtitle (30 chars):** `AI Longevity & Health Tracker`
* **Promotional Text:**
  > Optimize your biological age. NexVital connects with Apple Watch, HealthKit, and continuous glucose monitors to deliver personalized circadian fitness, nutrition, sleep, and medication coaching.
* **Keywords:** `longevity, healthkit, apple watch, hrv, zone 2, cgm, fasting, sleep stages, whoop, oura`

---

### Step 4: Apple HealthKit Review Guidelines Compliance (Guideline 5.1.3)

> [!CAUTION]
> Apple enforces strict scrutiny on apps requesting HealthKit permissions under **App Store Review Guideline 5.1.3**.

Vitalis complies with all five mandates:
1. **Clear User Rationale in `Info.plist`:**
   * `NSHealthShareUsageDescription`: Explains that steps, HRV, resting HR, and sleep stages are read exclusively to calculate the patient's daily Longevity Readiness Score.
   * `NSHealthUpdateUsageDescription`: Explains that completed workouts and hydration entries are written back to keep Apple Health synced.
2. **Prohibition of Data Sale:**
   * Your Privacy Policy explicitly states: *"We NEVER transfer, sell, license, or disclose your HealthKit biometrics to third-party data brokers, advertising networks, or data aggregators."*
3. **No Advertising Usage:** HealthKit data is never used for behavioral advertising or marketing.
4. **No Third-Party Cloud Transmission Without Consent:** Telemetry remains encrypted on-device and in Google Cloud Firestore under HIPAA-compliant security.
5. **No Diagnostic Over-Reach:** Displays medical guardrail notices confirming it is a lifestyle and preventive wellness companion (USPSTF aligned), not a clinical diagnostic device.

---

### Step 5: Build, Archive & TestFlight Rollout

1. Open `ios/Vitalis.xcodeproj` in Xcode.
2. Set your **Signing Team** in the target's **Signing & Capabilities** tab.
3. Select **Any iOS Device (arm64)** from the destination selector.
4. Run **Product > Archive**.
5. Once compiled, click **Distribute App** -> **App Store Connect** -> **Upload**.
6. In App Store Connect, go to **TestFlight** to invite internal and external beta testers.
7. Under **App Store > iOS App**, select the uploaded build, complete the Export Compliance questions, and click **Submit for Review**!
