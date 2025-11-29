package com.mindfulgate.service

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.util.Log
import androidx.compose.ui.platform.ComposeView
import com.mindfulgate.ui.screens.MindfulPauseScreen
import com.mindfulgate.ui.theme.MindfulGateTheme

class OverlayService : Service() {
    
    private var windowManager: WindowManager? = null
    private var overlayView: ComposeView? = null
    
    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val packageName = intent?.getStringExtra("package_name")
        showOverlay(packageName)
        return START_NOT_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    private fun showOverlay(packageName: String?) {
        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "Cannot draw overlays - permission not granted")
            stopSelf()
            return
        }
        
        if (overlayView != null) {
            // Оверлей уже показан
            return
        }
        
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 0
        }
        
        overlayView = ComposeView(this).apply {
            setContent {
                MindfulGateTheme {
                    MindfulPauseScreen(
                        onProceed = {
                            hideOverlay()
                            stopSelf()
                        },
                        onSkip = {
                            hideOverlay()
                            stopSelf()
                        }
                    )
                }
            }
        }
        
        try {
            windowManager?.addView(overlayView, layoutParams)
            Log.d(TAG, "Overlay shown for package: $packageName")
        } catch (e: Exception) {
            Log.e(TAG, "Error showing overlay", e)
            overlayView = null
        }
    }
    
    private fun hideOverlay() {
        overlayView?.let { view ->
            try {
                windowManager?.removeView(view)
                Log.d(TAG, "Overlay hidden")
            } catch (e: Exception) {
                Log.e(TAG, "Error hiding overlay", e)
            }
            overlayView = null
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
    
    companion object {
        private const val TAG = "OverlayService"
    }
}

