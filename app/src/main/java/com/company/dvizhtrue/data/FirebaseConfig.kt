package com.company.dvizhtrue.data

import android.content.Context
import android.os.Build
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.company.dvizhtrue.R

private fun isRunningOnEmulator(): Boolean {
    return (Build.FINGERPRINT.startsWith("generic")
            || Build.FINGERPRINT.lowercase().contains("vbox")
            || Build.FINGERPRINT.lowercase().contains("test-keys")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            || Build.MANUFACTURER.contains("Genymotion")
            || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
            || "google_sdk" == Build.PRODUCT)
}

// ВАЖНО: вызывать это ДО любого обращения к Firestore/EventsRepository
fun configureFirestoreEmulatorEarly(context: Context) {
    try {
        val useEmulator = context.resources.getBoolean(R.bool.use_emulator)
        if (useEmulator) {
            val port = context.resources.getInteger(R.integer.firestore_emulator_port)
            val host = if (isRunningOnEmulator()) {
                // Для Android эмулятора доступ к хост-машине через 10.0.2.2
                context.resources.getString(R.string.firestore_emulator_host_emulator)
            } else {
                // Для реального устройства: IP адрес вашего ПК в локальной сети
                context.resources.getString(R.string.firestore_emulator_host_device)
            }
            android.util.Log.d("FirebaseConfig", "🔧 Early config Firestore emulator: $host:$port (emulator=${isRunningOnEmulator()})")
            Firebase.firestore.useEmulator(host, port)
            android.util.Log.d("FirebaseConfig", "✅ Firestore emulator configured early")
        }
    } catch (e: Exception) {
        android.util.Log.e("FirebaseConfig", "❌ Failed to configure emulator early", e)
    }
}


