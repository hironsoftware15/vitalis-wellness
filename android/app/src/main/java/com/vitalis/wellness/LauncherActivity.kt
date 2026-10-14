package com.vitalis.wellness

import android.os.Bundle
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * LauncherActivity
 * Entry point for the Aegis Preventive Health standalone Android app.
 * Utilizes Trusted Web Activity (TWA) to render https://medicore-wellness.web.app
 * in a seamless, chrome-less native container verified by Digital Asset Links.
 */
class LauncherActivity : LauncherActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Additional telemetry initialization or notification channels can be set up here
    }
}
