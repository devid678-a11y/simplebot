package com.mindfulgate.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import com.mindfulgate.data.MindfulRepository

class AppMonitorService : AccessibilityService() {
    
    private lateinit var repository: MindfulRepository
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        repository = MindfulRepository(this)
        Log.d(TAG, "AppMonitorService connected")
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val packageName = event.packageName?.toString()
                if (packageName != null) {
                    checkAndShowOverlay(packageName)
                }
            }
        }
    }
    
    override fun onInterrupt() {
        Log.d(TAG, "AppMonitorService interrupted")
    }
    
    private fun checkAndShowOverlay(packageName: String) {
        val monitoredApps = repository.getMonitoredApps()
        
        if (monitoredApps.contains(packageName)) {
            Log.d(TAG, "Monitored app launched: $packageName")
            // Запускаем сервис оверлея
            val intent = Intent(this, OverlayService::class.java).apply {
                putExtra("package_name", packageName)
            }
            startService(intent)
        }
    }
    
    companion object {
        private const val TAG = "AppMonitorService"
    }
}

