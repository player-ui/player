package com.intuit.playerui.android.reference.demo.ui.splash

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.intuit.playerui.android.reference.demo.ui.main.MainActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val newIntent =
            Intent(this, MainActivity::class.java).apply {
                data = intent.data
                action = intent.action
                addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
            }
        startActivity(newIntent)
        finish()
    }
}
