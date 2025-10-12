package com.company.dvizhtrue.data

import com.google.android.gms.tasks.Task
import com.google.firebase.firestore.*
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import com.company.dvizhtrue.data.AuthRepository

object AttendanceRepository {
    private val db = Firebase.firestore
    private val attendanceCollection = db.collection("attendance")

    fun markGoing(eventId: String, userId: String): Task<Void> {
        val attendanceData = hashMapOf(
            "eventId" to eventId,
            "userId" to userId,
            "timestamp" to FieldValue.serverTimestamp()
        )
        return attendanceCollection.document("${eventId}_${userId}").set(attendanceData)
    }

    fun unmarkGoing(eventId: String, userId: String): Task<Void> {
        return attendanceCollection.document("${eventId}_${userId}").delete()
    }

    fun listenAttendanceCount(eventId: String): Flow<Int> = callbackFlow {
        val listener = attendanceCollection
            .whereEqualTo("eventId", eventId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("AttendanceRepository", "Error listening to attendance count", error)
                    // Do not emit fallback that would override UI; just ignore this tick
                    return@addSnapshotListener
                }

                val count = snapshot?.size() ?: 0
                trySend(count)
            }

        awaitClose { listener.remove() }
    }

    fun listenUserGoing(eventId: String, userId: String): Flow<Boolean> = callbackFlow {
        val listener = attendanceCollection
            .document("${eventId}_${userId}")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("AttendanceRepository", "Error listening to user attendance", error)
                    // Ignore this update to avoid flipping UI on permission errors
                    return@addSnapshotListener
                }

                val isGoing = snapshot?.exists() ?: false
                trySend(isGoing)
            }

        awaitClose { listener.remove() }
    }

    fun getUserAttendance(userId: String): Task<QuerySnapshot> {
        return attendanceCollection
            .whereEqualTo("userId", userId)
            .get()
    }
    
    suspend fun getAttendedEventIds(): List<String> {
        return try {
            val userId = AuthRepository.getCurrentUserIdOrNull()
            if (userId == null) {
                android.util.Log.d("AttendanceRepository", "No user ID, returning empty list")
                return emptyList()
            }
            
            val snapshot = attendanceCollection
                .whereEqualTo("userId", userId)
                .get()
                .await()
            
            val eventIds = snapshot.documents.mapNotNull { doc ->
                doc.getString("eventId")
            }
            
            android.util.Log.d("AttendanceRepository", "Found ${eventIds.size} attended events for user $userId")
            eventIds
        } catch (e: Exception) {
            android.util.Log.e("AttendanceRepository", "Error getting attended event IDs", e)
            emptyList()
        }
    }
}
