package com.mindfulgate.data

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.ui.graphics.Color
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken

class MindfulRepository(context: Context) {
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("mindful_gate", Context.MODE_PRIVATE)
    private val gson = GsonBuilder()
        .registerTypeAdapter(androidx.compose.ui.graphics.Color::class.java, ColorSerializer())
        .registerTypeAdapter(androidx.compose.ui.text.font.FontWeight::class.java, FontWeightSerializer())
        .create()
    
    companion object {
        private const val KEY_LAYOUT = "saved_layout"
        private const val KEY_HOLD_DURATION = "hold_duration"
        private const val KEY_MONITORED_APPS = "monitored_apps"
        private const val KEY_STATS_SHOWN = "stats_shown"
        private const val KEY_STATS_PROCEED = "stats_proceed"
        private const val KEY_STATS_SKIP = "stats_skip"
    }
    
    fun saveLayout(layout: Layout) {
        val json = gson.toJson(layout)
        prefs.edit().putString(KEY_LAYOUT, json).apply()
    }
    
    fun loadLayout(): Layout? {
        val json = prefs.getString(KEY_LAYOUT, null) ?: return null
        return try {
            gson.fromJson(json, Layout::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    fun saveHoldDuration(seconds: Int) {
        prefs.edit().putInt(KEY_HOLD_DURATION, seconds).apply()
    }
    
    fun getHoldDuration(): Int {
        return prefs.getInt(KEY_HOLD_DURATION, 7)
    }
    
    fun saveMonitoredApps(packageNames: List<String>) {
        val json = gson.toJson(packageNames)
        prefs.edit().putString(KEY_MONITORED_APPS, json).apply()
    }
    
    fun getMonitoredApps(): List<String> {
        val json = prefs.getString(KEY_MONITORED_APPS, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun incrementStatsShown() {
        val count = prefs.getInt(KEY_STATS_SHOWN, 0)
        prefs.edit().putInt(KEY_STATS_SHOWN, count + 1).apply()
    }
    
    fun incrementStatsProceed() {
        val count = prefs.getInt(KEY_STATS_PROCEED, 0)
        prefs.edit().putInt(KEY_STATS_PROCEED, count + 1).apply()
    }
    
    fun incrementStatsSkip() {
        val count = prefs.getInt(KEY_STATS_SKIP, 0)
        prefs.edit().putInt(KEY_STATS_SKIP, count + 1).apply()
    }
    
    fun getStats(): Stats {
        return Stats(
            shown = prefs.getInt(KEY_STATS_SHOWN, 0),
            proceed = prefs.getInt(KEY_STATS_PROCEED, 0),
            skip = prefs.getInt(KEY_STATS_SKIP, 0)
        )
    }
}

data class Stats(
    val shown: Int,
    val proceed: Int,
    val skip: Int
)

