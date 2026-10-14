# Aegis Preventive Health — Google Play Store Standalone App & Release Guide

This document provides the complete architecture, packaging specifications, and step-by-step submission workflow for publishing **Aegis Preventive Health** as a standalone application on the **Google Play Store**.

---

## 1. Application Identity & Architecture

| Parameter | Specification |
| :--- | :--- |
| **App Name** | Aegis Preventive Health & Wellness |
| **Package Name / Application ID** | `com.medicore.wellness` |
| **Target SDK** | Android 14+ (API Level 34) |
| **Minimum SDK** | Android 8.0 (API Level 26) |
| **Architecture** | **Trusted Web Activity (TWA)** via `com.google.androidbrowserhelper:androidbrowserhelper:2.5.0` |
| **Wearable / Telemetry Integration** | **Google Health Connect Client** (`androidx.health.connect:connect-client:1.1.0-alpha11`) |
| **AI Intelligence** | Google Gemini 3.8 Flash (`@google/genai`) for real-time circadian, habit, and nutrition coaching |
| **Production Web App URL** | [https://medicore-wellness.web.app](https://medicore-wellness.web.app) |
| **Digital Asset Links URL** | [https://medicore-wellness.web.app/.well-known/assetlinks.json](https://medicore-wellness.web.app/.well-known/assetlinks.json) |
| **Privacy Policy URL (Live & Compliant)** | [https://medicore-wellness.web.app/privacy-policy.html](https://medicore-wellness.web.app/privacy-policy.html) |

```
                              ┌──────────────────────────────────────────────┐
                              │           Google Play Store (AAB)            │
                              │           id: com.medicore.wellness          │
                              └──────────────────────┬───────────────────────┘
                                                     │ Installed on Device
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               Android 14+ / Wear OS Runtime Host                                   │
│                                                                                                    │
│  ┌────────────────────────────────────────┐     ┌────────────────────────────────────────────────┐ │
│  │     Google Health Connect Client       │     │          Trusted Web Activity (TWA)            │ │
│  │   (Pixel Watch / Fitbit / Garmin)      │     │  LauncherActivity (androidbrowserhelper 2.5.0) │ │
│  │                                        │     │                                                │ │
│  │  • Steps (READ/WRITE)                  │     │  • Digital Asset Links Auto-Verification       │ │
│  │  • Heart Rate & Resting HR (READ)      │     │  • Full-Screen Native Chrome-less Chrome Custom│ │
│  │  • Sleep Stages & Duration (READ)      │     │    Tab Container                               │ │
│  │  • Nutrition & Active Calories (READ)  │     │  • Service Worker Offline Cache + Push Notify  │ │
│  └───────────────────┬────────────────────┘     └───────────────────────┬────────────────────────┘ │
└──────────────────────┼──────────────────────────────────────────────────┼──────────────────────────┘
                       │ Local Biometrics                                 │ Web UI & Gemini AI
                       ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Google Cloud & Firebase Platform                                   │
│                                                                                                    │
│  ┌────────────────────────────────────┐  ┌───────────────────────────────────┐  ┌───────────────┐  │
│  │         Firebase Hosting           │  │          Cloud Firestore          │  │ Gemini 3.8    │  │
│  │    medicore-wellness.web.app       │  │   /patients/{id}/wellness/        │  │ Flash Engine  │  │
│  │ (Multi-Site under rugged-alcove)   │  │   Adherence, habits & telemetry   │  │ Longevity AI  │  │
│  └────────────────────────────────────┘  └───────────────────────────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prepared Store Listing Assets

All required visual assets have been rendered to exact Google Play Console specifications and are stored in `assets/`:

| Asset Type | File Path | Specifications | Status |
| :--- | :--- | :--- | :--- |
| **Hi-Res App Icon** | `assets/icon-512.png` | 512 x 512 px, 32-bit PNG, Teal & Slate Shield Icon | Ready & Deployed |
| **Feature Graphic** | `assets/feature-graphic.png` | 1024 x 576 px, PNG/JPEG, Health Telemetry Banner | Ready & Deployed |
| **Adaptive Launcher Icons** | `android/app/src/main/res/mipmap-*/` | mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi (48px - 192px) | Generated |
| **Web Manifest Screenshots**| `manifest.webmanifest` | Configured with `form_factor: "wide"` | Live |

---

## 3. Native Android Standalone Project Structure

The standalone Android project is located at:
`[scratch/preventive-health-app/android/](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/android/)`

```
android/
├── build.gradle                                # Root Gradle configuration
├── settings.gradle                             # Project name & module registry
├── gradle.properties                           # AndroidX & Jetifier flags
├── gradlew                                     # Executable Gradle wrapper
├── gradle/wrapper/
│   └── gradle-wrapper.properties               # Gradle 8.6 distribution
├── app/
│   ├── build.gradle                            # API 34 targetSdk, TWA & Health Connect dependencies
│   ├── proguard-rules.pro                      # ProGuard rules preserving TWA and Health Connect
│   └── src/main/
│       ├── AndroidManifest.xml                 # TWA Launcher, DAL intent filter & Health Connect rationale
│       ├── java/com/medicore/wellness/
│       │   ├── LauncherActivity.kt             # Native TWA entry point
│       │   ├── PermissionsRationaleActivity.kt # Mandatory Health Connect Rationale Screen
│       │   └── HealthConnectManager.kt         # Health Connect biometrics reader
│       └── res/
│           ├── layout/
│           │   └── activity_permissions_rationale.xml
│           ├── values/
│           │   ├── colors.xml                  # Slate & Teal palette
│           │   ├── strings.xml                 # Health Connect policy rationale text
│           │   └── styles.xml                  # Theme.LauncherActivity & Theme.AegisWellness
│           └── mipmap-*/                       # High-density launcher icons
```

---

## 4. Two Methods to Build the Release App Bundle (`.aab`)

### Option A: Cloud CI/CD Build via GitHub Actions (Zero Local Setup)
A workflow has been pre-configured at [build-android.yml](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/.github/workflows/build-android.yml).

1. Push your repository to GitHub (or create a private repository for `preventive-health-app`).
2. Go to your GitHub repository -> **Actions** tab.
3. Select **"Build Android App Bundle (Google Play Release)"** and click **Run workflow**.
4. Once completed, download the produced `aegis-wellness-release-aab` artifact containing your signed `app-release.aab`.

---

### Option B: Local Build via Android Studio or Terminal

If you have OpenJDK 17 and Android Studio installed locally:

```bash
# 1. Run the automated keystore and build helper script
cd /Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app
./build_android.sh
```

Or manually:

```bash
# 1. Generate release keystore
keytool -genkey -v \
    -keystore android/app/keystore.jks \
    -alias medicore \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass medicorepass \
    -keypass medicorepass \
    -dname "CN=MediCore Aegis, OU=Health Tech, O=MediCore Health Inc, L=San Francisco, ST=CA, C=US"

# 2. Extract the SHA-256 fingerprint for Digital Asset Links
keytool -list -v -keystore android/app/keystore.jks -alias medicore -storepass medicorepass | grep "SHA256:"

# 3. Build release bundle
cd android
./gradlew bundleRelease
# Output created at: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 5. Step-by-Step Google Play Console Submission

### Step 1: Create Application
1. Log in to the [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - **App name:** `Aegis Preventive Health`
   - **Default language:** `English (United States)`
   - **App or game:** `App`
   - **Free or paid:** `Free`
   - Check the Declarations boxes and click **Create app**.

---

### Step 2: Main Store Listing Setup
Navigate to **Grow** -> **Store presence** -> **Main store listing**:

- **Short description (80 chars max):**
  > AI Preventive Health, Wear OS Sleep & Fitness Tracking, Longevity & Medication Reminders.
- **Full description:**
  > Aegis Preventive Health is an intelligent, patient-centric longevity and wellness companion engineered for the Google ecosystem.
  > 
  > KEY CAPABILITIES:
  > • Predictive Health Coaching: Powered by Google Gemini 3.8 Flash, delivering personalized recommendations for circadian alignment, nutrition, and cardiovascular longevity.
  > • Google Health Connect & Wear OS: Seamless bi-directional telemetry reading for daily steps, resting heart rate, active calorie expenditure, and sleep architecture from Pixel Watch, Fitbit, Samsung Galaxy Watch, and Garmin.
  > • Medication Adherence: Automated reminders with visual confirmation and streak tracking.
  > • Habit Architecture: Real-time tracking of hydration, sunlight exposure, cold therapy, and Zone-2 cardio.
  > • Dual Clinical Sync: Integrates seamlessly with your healthcare provider's MediCore-OS clinical record.
  > 
  > PRIVACY & SECURITY:
  > Aegis complies strictly with Google Play Health Connect policy and HIPAA security standards. Your biometric telemetry is stored encrypted and is never sold to third-party data brokers or advertisers.

- **Graphics Upload:**
  - **App Icon:** Upload `assets/icon-512.png` (512x512).
  - **Feature Graphic:** Upload `assets/feature-graphic.png` (1024x576).
  - **Phone Screenshots:** Upload 2 to 8 screenshots of the dashboard.

---

### Step 3: Mandatory Policy & Health Connect Declarations
Navigate to **Policy** -> **App content**:

1. **Privacy Policy:**
   - URL: `https://medicore-wellness.web.app/privacy-policy.html`
2. **Health Connect Declarations (Critical for Approval):**
   - **Primary App Category:** Select `Health and fitness` or `Preventive wellness`.
   - **Declared Data Types:**
     - `Steps`
     - `Heart Rate`
     - `Sleep`
     - `Nutrition / Hydration`
     - `Active Energy / Calories Burned`
   - **Permitted Purposes:** Check `In-app health management and fitness coaching`.
   - **Commercial Use:** Check `No data is sold to third parties, advertising networks, or data brokers`.
   - **Data Retention & Deletion:** Declare that users can delete their health data on request via the profile settings.
3. **Data Safety Form:**
   - Does your app collect or share user data? Yes (Steps, heart rate, sleep duration).
   - Is all user data encrypted in transit? **Yes** (HTTPS/TLS 1.3).
   - Do you provide a way for users to request data deletion? **Yes**.
4. **Target Audience:**
   - 18 and older.

---

### Step 4: Digital Asset Links (DAL) Production Verification

When an app bundle is uploaded, Google Play App Signing generates an official Play Console signing certificate:

1. In Play Console, go to **Release** -> **Setup** -> **App signing**.
2. Copy the **SHA-256 certificate fingerprint** under **"App signing key certificate"**.
3. Update [scratch/preventive-health-app/.well-known/assetlinks.json](file:///Users/ataurrahman/.gemini/antigravity/scratch/preventive-health-app/.well-known/assetlinks.json):
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.medicore.wellness",
         "sha256_cert_fingerprints": [
           "PASTE_PLAY_CONSOLE_SHA256_FINGERPRINT_HERE"
         ]
       }
     }
   ]
   ```
4. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting:medicore-wellness
   ```
5. Google Digital Asset Links verification will succeed immediately, allowing the app to open full-screen with no browser address bar.

---

### Step 5: Roll Out to Testing or Production
1. In Play Console, go to **Release** -> **Testing** -> **Internal testing** (or **Production**).
2. Click **Create new release**.
3. Upload `app-release.aab`.
4. Enter release notes: `Initial release of Aegis Preventive Health v1.0.0 with Health Connect support`.
5. Review and rollout!
