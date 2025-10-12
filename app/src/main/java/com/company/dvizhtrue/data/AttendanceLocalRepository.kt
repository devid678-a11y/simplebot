package com.company.dvizhtrue.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first

private val Context.attendanceDataStore: DataStore<Preferences> by preferencesDataStore(name = "attendance_prefs")

object AttendanceLocalRepository {
    private lateinit var appContext: Context
    private val keyGoingIds = stringSetPreferencesKey("going_ids")

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    fun goingIdsFlow(): Flow<Set<String>> {
        ensureInit()
        return appContext.attendanceDataStore.data.map { prefs ->
            prefs[keyGoingIds] ?: emptySet()
        }
    }

    fun isGoingFlow(eventId: String): Flow<Boolean> {
        return goingIdsFlow().map { it.contains(eventId) }
    }

    suspend fun add(eventId: String) {
        ensureInit()
        appContext.attendanceDataStore.edit { prefs ->
            val current = prefs[keyGoingIds] ?: emptySet()
            prefs[keyGoingIds] = current + eventId
        }
    }

    suspend fun remove(eventId: String) {
        ensureInit()
        appContext.attendanceDataStore.edit { prefs ->
            val current = prefs[keyGoingIds] ?: emptySet()
            prefs[keyGoingIds] = current - eventId
        }
    }
    
    suspend fun getAllEventIds(): List<String> {
        ensureInit()
        val prefs = appContext.attendanceDataStore.data.first()
        return (prefs[keyGoingIds] ?: emptySet()).toList()
    }

    private fun ensureInit() {
        check(::appContext.isInitialized) { "AttendanceLocalRepository.init(context) must be called in Application/Activity" }
    }
}


