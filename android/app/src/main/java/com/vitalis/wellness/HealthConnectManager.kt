package com.vitalis.wellness

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * HealthConnectManager
 * Manages bi-directional telemetry exchange with Google Health Connect on Android 14+ / Wear OS.
 * Aggregates wearable sensor data from Google Pixel Watch, Fitbit, Samsung Health, and Garmin.
 */
class HealthConnectManager(private val context: Context) {

    val healthConnectClient: HealthConnectClient? by lazy {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    }

    // Required Health Connect permissions for preventive wellness monitoring
    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(NutritionRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getWritePermission(StepsRecord::class),
        HealthPermission.getWritePermission(NutritionRecord::class)
    )

    suspend fun hasAllPermissions(): Boolean {
        val client = healthConnectClient ?: return false
        val granted = client.permissionController.getGrantedPermissions()
        return granted.containsAll(permissions)
    }

    /**
     * Reads daily step count aggregate for today
     */
    suspend fun readTodaySteps(): Long = withContext(Dispatchers.IO) {
        val client = healthConnectClient ?: return@withContext 0L
        val startTime = Instant.now().truncatedTo(ChronoUnit.DAYS)
        val endTime = Instant.now()

        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )
        return@withContext response.records.sumOf { it.count }
    }

    /**
     * Reads last night's sleep session with sleep stage duration
     */
    suspend fun readLastSleepSession(): SleepSummary? = withContext(Dispatchers.IO) {
        val client = healthConnectClient ?: return@withContext null
        val startTime = Instant.now().minus(24, ChronoUnit.HOURS)
        val endTime = Instant.now()

        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )

        val latestSession = response.records.maxByOrNull { it.endTime } ?: return@withContext null
        val durationMins = ChronoUnit.MINUTES.between(latestSession.startTime, latestSession.endTime)

        return@withContext SleepSummary(
            startTime = latestSession.startTime,
            endTime = latestSession.endTime,
            totalDurationMinutes = durationMins,
            notes = latestSession.notes ?: "Circadian restorative sleep"
        )
    }
}

data class SleepSummary(
    val startTime: Instant,
    val endTime: Instant,
    val totalDurationMinutes: Long,
    val notes: String
)
