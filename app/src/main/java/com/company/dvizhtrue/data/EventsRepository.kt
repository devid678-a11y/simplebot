package com.company.dvizhtrue.data

import android.content.Context
import com.google.android.gms.tasks.Task

import com.google.firebase.firestore.*
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import com.company.dvizhtrue.R

object EventsRepository {
    // Используем базу данных по умолчанию
    private val db = Firebase.firestore

    fun configureEmulator(context: Context) {
        try {
            val useEmulator = context.resources.getBoolean(R.bool.use_emulator)
            if (useEmulator) {
                val isEmu = android.os.Build.FINGERPRINT.startsWith("generic") ||
                        android.os.Build.FINGERPRINT.lowercase().contains("vbox") ||
                        android.os.Build.FINGERPRINT.lowercase().contains("test-keys") ||
                        android.os.Build.MODEL.contains("Emulator") ||
                        android.os.Build.MODEL.contains("Android SDK built for x86") ||
                        android.os.Build.MANUFACTURER.contains("Genymotion") ||
                        (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic")) ||
                        ("google_sdk" == android.os.Build.PRODUCT)

                val host = if (isEmu) {
                    context.resources.getString(R.string.firestore_emulator_host_emulator)
                } else {
                    context.resources.getString(R.string.firestore_emulator_host_device)
                }
                val port = context.resources.getInteger(R.integer.firestore_emulator_port)

                android.util.Log.d("EventsRepository", "🔧 Configuring Firestore emulator: $host:$port (emu=$isEmu)")
                db.useEmulator(host, port)
                android.util.Log.d("EventsRepository", "✅ Firestore emulator configured successfully")
            }
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "❌ Failed to configure emulator", e)
        }
    }
    private val eventsCollection = db.collection("events")
    
    init {
        // Тестируем подключение к Firestore при инициализации
        try {
            android.util.Log.d("EventsRepository", "Initializing EventsRepository...")
            android.util.Log.d("EventsRepository", "Firestore app name: ${db.app.name}")
            android.util.Log.d("EventsRepository", "Firestore app options: ${db.app.options}")
            android.util.Log.d("EventsRepository", "Firestore project ID: ${db.app.options.projectId}")
            
            // Попробуем использовать конкретную базу данных
            val testDoc = db.collection("test").document("test")
            android.util.Log.d("EventsRepository", "Test document reference created: ${testDoc.path}")
            
            // Попробуем создать тестовый документ
            android.util.Log.d("EventsRepository", "Attempting to create test document...")
            
            // Создаем базовые коллекции
            createBaseCollections()
            
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "Error during initialization", e)
        }
    }

    private fun createBaseCollections() {
        android.util.Log.d("EventsRepository", "Creating base collections...")
        
        try {
            // Создаем коллекцию events с тестовым документом
            val testEvent = hashMapOf(
                "title" to "Тестовое мероприятие",
                "startAtMillis" to System.currentTimeMillis(),
                "isOnline" to false,
                "isFree" to true,
                "price" to null,
                "location" to "Тестовая локация",
                "imageUrls" to emptyList<String>(),
                "categories" to listOf("Тест"),
                "createdAt" to FieldValue.serverTimestamp()
            )
            
            eventsCollection.add(testEvent)
                .addOnSuccessListener { documentReference ->
                    android.util.Log.d("EventsRepository", "✅ Base collection 'events' created with test document: ${documentReference.id}")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("EventsRepository", "❌ Failed to create base collection", e)
                }
            
            // Создаем коллекцию users
            val usersCollection = db.collection("users")
            val testUser = hashMapOf(
                "uid" to "test_user_${System.currentTimeMillis()}",
            "createdAt" to FieldValue.serverTimestamp(),
                "role" to "guest"
            )
            
            usersCollection.add(testUser)
                .addOnSuccessListener { documentReference ->
                    android.util.Log.d("EventsRepository", "✅ Base collection 'users' created with test document: ${documentReference.id}")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("EventsRepository", "❌ Failed to create users collection", e)
                }
            
            // Создаем коллекцию attendance
            val attendanceCollection = db.collection("attendance")
            val testAttendance = hashMapOf(
                "eventId" to "test_event",
                "userId" to "test_user",
                "going" to true,
                "createdAt" to FieldValue.serverTimestamp()
            )
            
            attendanceCollection.add(testAttendance)
                .addOnSuccessListener { documentReference ->
                    android.util.Log.d("EventsRepository", "✅ Base collection 'attendance' created with test document: ${documentReference.id}")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("EventsRepository", "❌ Failed to create attendance collection", e)
                }
                
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "Error creating base collections", e)
        }
    }


    fun createEvent(event: Event): Task<DocumentReference> {
        android.util.Log.d("EventsRepository", "=== CREATE EVENT START ===")
        android.util.Log.d("EventsRepository", "Creating event: ${event.title}, imageUrls: ${event.imageUrls.size}")
        android.util.Log.d("EventsRepository", "Firestore app: ${db.app.name}, project: ${db.app.options.projectId}")
        android.util.Log.d("EventsRepository", "Firestore instance: ${db}")
        
        val eventData = hashMapOf(
            "title" to event.title,
            "startAtMillis" to event.startAtMillis,
            "isOnline" to event.isOnline,
            "isFree" to event.isFree,
            "price" to event.price,
            "location" to event.location,
            "imageUrls" to event.imageUrls,
            "categories" to event.categories,
            "communityId" to event.communityId,
            "description" to event.description,
            "createdAt" to FieldValue.serverTimestamp()
        )
        
        android.util.Log.d("EventsRepository", "Event data prepared: imageUrls field = ${eventData["imageUrls"]}")
        android.util.Log.d("EventsRepository", "Collection path: ${eventsCollection.path}")
        android.util.Log.d("EventsRepository", "Full event data: $eventData")
        
        return try {
            val task = eventsCollection.add(eventData)
            android.util.Log.d("EventsRepository", "Task created: $task")
            
            task.addOnSuccessListener { documentReference ->
                android.util.Log.d("EventsRepository", "✅ Event created successfully! ID: ${documentReference.id}")
                android.util.Log.d("EventsRepository", "Document path: ${documentReference.path}")
                android.util.Log.d("EventsRepository", "Document reference: $documentReference")
                
                // Попробуем сразу прочитать созданный документ
                documentReference.get().addOnSuccessListener { snapshot ->
                    android.util.Log.d("EventsRepository", "✅ Document read back successfully: ${snapshot.data}")
                }.addOnFailureListener { e ->
                    android.util.Log.e("EventsRepository", "❌ Failed to read back document", e)
                }
            }
            .addOnFailureListener { e ->
                android.util.Log.e("EventsRepository", "❌ Failed to create event", e)
                android.util.Log.e("EventsRepository", "Error details: ${e.message}")
                android.util.Log.e("EventsRepository", "Error code: ${e.javaClass.simpleName}")
                android.util.Log.e("EventsRepository", "Error stack trace:", e)
            }
            
            task
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "❌ Exception during event creation", e)
            throw e
        }
    }

    fun appendImageUrl(eventId: String, imageUrl: String): Task<Void> {
        return eventsCollection.document(eventId)
            .update("imageUrls", FieldValue.arrayUnion(imageUrl))
    }

    fun listenEvents(): Flow<List<Event>> = callbackFlow {
        val currentTime = System.currentTimeMillis()
        val listener = eventsCollection
            .whereGreaterThan("startAtMillis", currentTime) // Только будущие события
            // Сортируем только по полю фильтра, чтобы не требовать композитного индекса
            .orderBy("startAtMillis", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {

                    android.util.Log.e("EventsRepository", "Error listening to events", error)
                    close(error)
                    return@addSnapshotListener
                }


                val events = snapshot?.documents?.mapNotNull { doc ->
                    try {
                        val data = doc.data ?: emptyMap<String, Any>()
                        Event.fromMap(data, doc.id)
                    } catch (e: Exception) {
                        android.util.Log.e("EventsRepository", "Error parsing event ${doc.id}", e)
                        null
                    }
                } ?: emptyList()

                android.util.Log.d("EventsRepository", "Loaded ${events.size} events from Firestore")
                events.forEach { event ->
                    android.util.Log.d("EventsRepository", "Event: ${event.title}, imageUrls: ${event.imageUrls.size}")
                }
                trySend(events)
            }

        awaitClose { listener.remove() }
    }

    fun getEvent(eventId: String): Task<DocumentSnapshot> {
        return eventsCollection.document(eventId).get()
    }

    fun updateEvent(eventId: String, updates: Map<String, Any>): Task<Void> {
        return eventsCollection.document(eventId).update(updates)
    }

    fun deleteEvent(eventId: String): Task<Void> {
        return eventsCollection.document(eventId).delete()
    }

    suspend fun getEventsByCommunity(communityId: String): Result<List<Event>> {
        return try {
            val snapshot = eventsCollection
                .whereEqualTo("communityId", communityId)
                .orderBy("startAtMillis", Query.Direction.ASCENDING)
                .get()
                .await()

            val events = snapshot.documents.mapNotNull { doc ->
                try {
                    val data = doc.data ?: emptyMap<String, Any>()
                    Event.fromMap(data, doc.id)
                } catch (e: Exception) {
                    android.util.Log.e("EventsRepository", "Error parsing event ${doc.id}", e)
                    null
                }
            }

            Result.success(events)
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "Error getting events by community", e)
            Result.failure(e)
        }
    }
    
    suspend fun getEventById(eventId: String): Result<Event> {
        return try {
            val doc = eventsCollection.document(eventId).get().await()
            if (doc.exists()) {
                val event = Event.fromMap(doc.data ?: emptyMap(), doc.id)
                Result.success(event)
            } else {
                Result.failure(Exception("Event not found"))
            }
        } catch (e: Exception) {
            android.util.Log.e("EventsRepository", "Error getting event by ID: $eventId", e)
            Result.failure(e)
        }
    }
}

