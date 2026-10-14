package com.vitalis.wellness

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

/**
 * PermissionsRationaleActivity
 * Handles androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE and
 * android.intent.action.VIEW_PERMISSION_USAGE as required by Google Play Health Data policy.
 */
class PermissionsRationaleActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_permissions_rationale)

        val btnOpenPrivacy = findViewById<Button>(R.id.btnOpenPrivacy)
        val btnClose = findViewById<Button>(R.id.btnClose)

        btnOpenPrivacy.setOnClickListener {
            val privacyUrl = getString(R.string.health_connect_privacy_url)
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(privacyUrl))
            startActivity(intent)
        }

        btnClose.setOnClickListener {
            finish()
        }
    }
}
