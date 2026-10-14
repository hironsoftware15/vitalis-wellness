/**
 * Cloud Functions for Firebase (v2)
 * Aegis Preventive Health & Wellness Platform
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const db = admin.firestore();

// Initialize Google GenAI Client
const aiClient = new GoogleGenAI({});

/**
 * 1. AI PREVENTIVE COACH ENDPOINT
 * Uses Gemini 3.8 Flash to evaluate multi-pillar health telemetry and provide personalized coaching.
 */
exports.askPreventiveCoach = onCall(async (request) => {
  // Authentication Guard
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userId = request.auth.uid;
  const userQuery = request.data.query || "Provide daily preventive wellness review.";

  // Fetch recent telemetry from Firestore
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : {};

  const recentSleepSnap = await db.collection(`users/${userId}/sleep_sessions`)
    .orderBy("date", "desc").limit(3).get();
  const recentWorkoutsSnap = await db.collection(`users/${userId}/workouts`)
    .orderBy("date", "desc").limit(3).get();
  const activeMedsSnap = await db.collection(`users/${userId}/medications`)
    .where("active", "==", true).get();

  const telemetryContext = {
    profile: {
      age: userData.age || 38,
      goals: userData.goals || ["Cardiovascular Longevity", "Deep Sleep Optimization"]
    },
    sleepRecent: recentSleepSnap.docs.map(d => d.data()),
    workoutsRecent: recentWorkoutsSnap.docs.map(d => d.data()),
    activeMedications: activeMedsSnap.docs.map(d => ({
      name: d.data().name,
      dose: d.data().dose,
      timing: d.data().timing
    }))
  };

  const systemInstruction = `
You are the Aegis Preventive Health & Wellness Coach, an AI specialist in longevity, 
preventive lifestyle medicine, and behavioral habit architecture.
Your guidance is aligned with evidence-based lifestyle frameworks (USPSTF, American College of Lifestyle Medicine).

CRITICAL CLINICAL SAFETY RULES:
1. You provide preventive lifestyle, fitness, sleep, and nutritional guidance.
2. You do NOT diagnose medical conditions, alter prescribed drug dosages, or replace licensed physician care.
3. If red flag symptoms (severe chest pain, sudden numbness, extreme shortness of breath) appear, immediately advise emergency medical assistance.
4. Always explain the biological 'why' (e.g. adenosine buildup, zone-2 mitochondrial biogenesis, glycemic blunting).
`;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Telemetry Context:\n${JSON.stringify(telemetryContext, null, 2)}\n\nUser Question:\n${userQuery}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4
      }
    });

    const coachText = response.text || "I was unable to formulate a response at this time.";

    // Log conversation to user's history
    await db.collection(`users/${userId}/coach_conversations`).add({
      query: userQuery,
      response: coachText,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, response: coachText };
  } catch (error) {
    console.error("Gemini Coach Error:", error);
    throw new HttpsError("internal", "Failed to consult preventive coach.");
  }
});

/**
 * 2. SCHEDULED MEDICATION REMINDER WATCHDOG
 * Runs every 15 minutes to check for pending medication schedules and triggers FCM push notifications.
 */
exports.checkMedicationReminders = onSchedule("every 15 minutes", async (event) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log(`Checking medication reminders for ${currentHour}:${currentMinute}...`);

  // Query users with active device FCM tokens
  const usersWithTokens = await db.collection("users")
    .where("fcmToken", "!=", null)
    .get();

  for (const userDoc of usersWithTokens.docs) {
    const userId = userDoc.id;
    const fcmToken = userDoc.data().fcmToken;

    // Check today's un-taken medications
    const medsSnap = await db.collection(`users/${userId}/medications`)
      .where("active", "==", true)
      .where("takenToday", "==", false)
      .get();

    for (const medDoc of medsSnap.docs) {
      const med = medDoc.data();
      
      // Send high-priority push notification via Firebase Cloud Messaging
      const message = {
        token: fcmToken,
        notification: {
          title: `💊 Medication Reminder: ${med.name}`,
          body: `Time for your scheduled ${med.name} (${med.dose}). Tap to mark as taken.`
        },
        data: {
          type: "MEDICATION_REMINDER",
          medId: medDoc.id,
          userId: userId
        },
        android: {
          priority: "high",
          notification: {
            channelId: "medication_reminders",
            sound: "default"
          }
        }
      };

      try {
        await admin.messaging().send(message);
        console.log(`Sent medication push notification for ${med.name} to user ${userId}`);
      } catch (fcmError) {
        console.error(`FCM send failure for user ${userId}:`, fcmError);
      }
    }
  }
});

/**
 * 3. GOOGLE HEALTH CONNECT INGESTION WEBHOOK
 * Ingests batch telemetry (Steps, Heart Rate, Sleep Sessions, Nutrition) synchronized from Android Health Connect.
 */
exports.syncHealthConnectData = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { userId, records, clientTimestamp } = req.body;
  if (!userId || !records) {
    res.status(400).json({ error: "Missing userId or records payload" });
    return;
  }

  const batch = db.batch();

  // Ingest Steps
  if (records.steps) {
    const stepRef = db.collection(`users/${userId}/workouts`).doc(`steps_${records.date}`);
    batch.set(stepRef, {
      type: "STEPS",
      count: records.steps,
      date: records.date,
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // Ingest Sleep Stages
  if (records.sleep) {
    const sleepRef = db.collection(`users/${userId}/sleep_sessions`).doc(`sleep_${records.date}`);
    batch.set(sleepRef, {
      durationMinutes: records.sleep.totalMinutes,
      deepSleepMinutes: records.sleep.deepMinutes,
      remSleepMinutes: records.sleep.remMinutes,
      efficiencyPercent: records.sleep.efficiency,
      date: records.date,
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  res.status(200).json({ success: true, message: "Health Connect telemetry synchronized." });
});
