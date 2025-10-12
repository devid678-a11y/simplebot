package com.company.dvizhtrue

import android.app.Application
import android.content.pm.ApplicationInfo
import com.google.firebase.appcheck.FirebaseAppCheck
// import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        // Temporarily disabled App Check for testing
        // val isDebug = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
        // if (isDebug) {
        //     FirebaseAppCheck.getInstance().installAppCheckProviderFactory(
        //         DebugAppCheckProviderFactory.getInstance()
        //     )
        // }
    }
}


