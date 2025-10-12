package com.company.dvizhtrue.ui

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.company.dvizhtrue.data.Event
import com.company.dvizhtrue.data.EventsRepository
import com.company.dvizhtrue.data.StorageRepository
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.max

class HomeViewModel : ViewModel() {
    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message

    private val _uploadProgress = MutableStateFlow<Float?>(null)
    val uploadProgress: StateFlow<Float?> = _uploadProgress

    private val _uploadCounters = MutableStateFlow<Pair<Int, Int>?>(null) // completed to total
    val uploadCounters: StateFlow<Pair<Int, Int>?> = _uploadCounters

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving

    private val _refreshing = MutableStateFlow(false)
    val refreshing: StateFlow<Boolean> = _refreshing

    private val _newEventsCount = MutableStateFlow(0)
    val newEventsCount: StateFlow<Int> = _newEventsCount

    private val _hasNewEvents = MutableStateFlow(false)
    val hasNewEvents: StateFlow<Boolean> = _hasNewEvents

    private var listenerRegistration: ListenerRegistration? = null
    private var lastEventCount = 0

    init {
        // Слушаем события из Firebase
        viewModelScope.launch {
            try {
                EventsRepository.listenEvents().collect { events ->
                    val currentCount = events.size
                    
                    // Проверяем, есть ли новые события
                    if (lastEventCount > 0 && currentCount > lastEventCount) {
                        val newCount = currentCount - lastEventCount
                        _newEventsCount.value = newCount
                        _hasNewEvents.value = true
                        android.util.Log.d("HomeViewModel", "New events detected: $newCount")
                    }
                    
                    lastEventCount = currentCount
                    _events.value = events
                    android.util.Log.d("HomeViewModel", "Firebase events loaded: ${events.size}")
                }
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error loading Firebase events", e)
                _message.value = "Ошибка загрузки событий: ${e.message}"
            }
        }
        
        // Автоматическое обновление каждые 30 секунд
        viewModelScope.launch {
            while (true) {
                delay(30000) // 30 секунд
                refreshEvents()
            }
        }
    }

    fun createEvent(
        context: android.content.Context,
        title: String,
        description: String?,
        startAtMillis: Long,
        isOnline: Boolean,
        isFree: Boolean,
        price: Double?,
        location: String?,
        imageUris: List<Uri>,
        categories: List<String> = emptyList(),
        communityId: String? = null
    ) {
        android.util.Log.d("HomeViewModel", "createEvent called, current saving state: ${_saving.value}")
        
        if (_saving.value) return
        
        android.util.Log.d("HomeViewModel", "Starting event creation: $title")
        _saving.value = true
        
        viewModelScope.launch {
            try {
                android.util.Log.d("HomeViewModel", "About to call EventsRepository.createEvent with imageUris.size=${imageUris.size}")
                
                // Сначала создаем событие в Firestore
                val event = Event(
                    id = "", // ID будет назначен Firestore
                    title = title,
                    description = description,
                    startAtMillis = startAtMillis,
                    isOnline = isOnline,
                    isFree = isFree,
                    price = price,
                    location = location,
                    imageUrls = emptyList(), // Пока пустой список
                    categories = categories,
                    communityId = communityId
                )
                
                val documentReference = EventsRepository.createEvent(event)
                documentReference.addOnSuccessListener { docRef ->
                    val eventId = docRef.id
                    android.util.Log.d("HomeViewModel", "Event created in Firestore with ID: $eventId")
                    
                    // Теперь загружаем фотографии в Storage
                    if (imageUris.isNotEmpty()) {
                        android.util.Log.d("HomeViewModel", "Starting image uploads...")
                        _message.value = "Загружаем фотографии..."
                        _uploadProgress.value = 0f
                        _uploadCounters.value = 0 to imageUris.size
                        
                        val remaining = AtomicInteger(imageUris.size)
                        
                        for ((index, uri) in imageUris.withIndex()) {
                            try {
                                val filename = "img_${index + 1}.jpg"
                                android.util.Log.d("HomeViewModel", "Uploading image $filename")
                                
                                StorageRepository.uploadEventImageWithProgress(context, eventId, uri, filename) { progress ->
                                    val current = _uploadProgress.value ?: 0f
                                    _uploadProgress.value = max(current, (index + progress) / imageUris.size.toFloat())
                                }.addOnSuccessListener { result ->
                                    val downloadUrl = result.toString()
                                    android.util.Log.d("HomeViewModel", "Image $filename uploaded successfully: $downloadUrl")
                                    
                                    // Добавляем URL в Firestore
                                    EventsRepository.appendImageUrl(eventId, downloadUrl)
                                        .addOnSuccessListener {
                                            android.util.Log.d("HomeViewModel", "Image URL added to Firestore: $downloadUrl")
                                        }
                                        .addOnFailureListener { e ->
                                            android.util.Log.e("HomeViewModel", "Failed to add image URL to Firestore", e)
                                        }
                                    
                                    val done = (_uploadCounters.value?.first ?: 0) + 1
                                    _uploadCounters.value = done to imageUris.size
                                    
                                    if (remaining.decrementAndGet() == 0) {
                                        android.util.Log.d("HomeViewModel", "All images uploaded successfully")
                                        _uploadProgress.value = null
                                        _uploadCounters.value = 0 to 0
                                        _saving.value = false
                                        _message.value = "Мероприятие создано с фотографиями!"
                                    }
                                }.addOnFailureListener { e ->
                                    android.util.Log.e("HomeViewModel", "Failed to upload image $filename", e)
                                    val done = (_uploadCounters.value?.first ?: 0) + 1
                                    _uploadCounters.value = done to imageUris.size
                                    
                                    if (remaining.decrementAndGet() == 0) {
                                        android.util.Log.d("HomeViewModel", "All image uploads finished")
                                        _uploadProgress.value = null
                                        _uploadCounters.value = 0 to 0
                                        _saving.value = false
                                        _message.value = "Мероприятие создано, но некоторые фото не загрузились"
                                    }
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("HomeViewModel", "Exception during image upload for index $index", e)
                                val done = (_uploadCounters.value?.first ?: 0) + 1
                                _uploadCounters.value = done to imageUris.size
                                
                                if (remaining.decrementAndGet() == 0) {
                                    android.util.Log.d("HomeViewModel", "All image uploads finished with exceptions")
                                    _uploadProgress.value = null
                                    _uploadCounters.value = 0 to 0
                                    _saving.value = false
                                    _message.value = "Мероприятие создано, но фото не загрузились"
                                }
                            }
                        }
                    } else {
                        // Нет фотографий
                        android.util.Log.d("HomeViewModel", "No images to upload")
                        _saving.value = false
                        _message.value = "Мероприятие создано!"
                    }
                }.addOnFailureListener { e ->
                    android.util.Log.e("HomeViewModel", "Failed to create event in Firestore", e)
                    _message.value = "Ошибка создания мероприятия: ${e.message}"
                    _saving.value = false
                }
                
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Error creating event", e)
                _message.value = "Ошибка: ${e.message}"
                _saving.value = false
            }
        }
    }

    // Метод для принудительного сброса состояния
    fun resetSavingState() {
        android.util.Log.d("HomeViewModel", "Forcing reset of saving state")
        _saving.value = false
        _uploadProgress.value = null
        _uploadCounters.value = 0 to 0
        _message.value = null
    }

    fun createEventFromBytes(
        context: android.content.Context,
        title: String,
        startAtMillis: Long,
        isOnline: Boolean,
        isFree: Boolean,
        price: Double?,
        location: String?,
        imageDatas: List<ByteArray>
    ) {
        viewModelScope.launch {
            android.util.Log.d("HomeViewModel", "createEventFromBytes: setting saving to true")
            _saving.value = true
            
            val event = Event(
                id = "", // ID будет назначен Firestore
                title = title,
                startAtMillis = startAtMillis,
                isOnline = isOnline,
                isFree = isFree,
                price = price,
                location = null,
                imageUrls = emptyList(),
                categories = emptyList()
            )
            
            EventsRepository.createEvent(event)
                .addOnSuccessListener { documentReference ->
                    val eventId = documentReference.id
                    
                    if (imageDatas.isEmpty()) {
                        _saving.value = false
                        android.util.Log.d("HomeViewModel", "Set saving to false (no images in createEventFromBytes)")
                        _message.value = "Сохранено"
                        return@addOnSuccessListener
                    }
                    val limited = imageDatas.take(5)
                    _message.value = "Сохранено, загружаем фото..."
                    _uploadProgress.value = 0f
                    _uploadCounters.value = 0 to limited.size
                    val remaining = AtomicInteger(limited.size)
                    limited.forEachIndexed { idx, bytes ->
                        val filename = "img_${idx + 1}.jpg"
                        android.util.Log.d("HomeViewModel", "Uploading image $filename in createEventFromBytes")
                        
                        try {
                            StorageRepository.uploadEventImageBytesWithProgress(context, eventId, filename, bytes) { part ->
                                android.util.Log.d("HomeViewModel", "Upload progress for $filename in createEventFromBytes: $part")
                                val current = _uploadProgress.value ?: 0f
                                _uploadProgress.value = max(current, (idx + part) / limited.size.toFloat())
                            }.addOnSuccessListener { result ->
                                android.util.Log.d("HomeViewModel", "Image $filename upload success callback triggered in createEventFromBytes")
                                val done = (_uploadCounters.value?.first ?: 0) + 1
                                _uploadCounters.value = done to limited.size
                                val downloadUrl = result.toString()
                                android.util.Log.d("HomeViewModel", "Image $filename uploaded successfully in createEventFromBytes, URL: $downloadUrl")
                                EventsRepository.appendImageUrl(eventId, downloadUrl)
                                
                                if (remaining.decrementAndGet() == 0) {
                                    android.util.Log.d("HomeViewModel", "All images uploaded in createEventFromBytes, finishing")
                                    _uploadProgress.value = null
                                    _uploadCounters.value = 0 to 0
                                    _saving.value = false
                                    android.util.Log.d("HomeViewModel", "Set saving to false (all images uploaded in createEventFromBytes)")
                                    _message.value = "Фото загружены"
                                }
                            }.addOnFailureListener { e ->
                                android.util.Log.e("HomeViewModel", "Failed to upload image $filename in createEventFromBytes", e)
                                val done = (_uploadCounters.value?.first ?: 0) + 1
                                _uploadCounters.value = done to limited.size
                                val msg = "Фото ${idx + 1}/${limited.size}: ошибка загрузки"
                                _message.value = msg
                                
                                if (remaining.decrementAndGet() == 0) {
                                    android.util.Log.d("HomeViewModel", "All image uploads finished (with errors) in createEventFromBytes")
                                    _uploadProgress.value = null
                                    _uploadCounters.value = 0 to 0
                                    _saving.value = false
                                    android.util.Log.d("HomeViewModel", "Set saving to false (image uploads with errors in createEventFromBytes)")
                                }
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("HomeViewModel", "Exception during image upload for $filename in createEventFromBytes", e)
                            if (remaining.decrementAndGet() == 0) {
                                android.util.Log.d("HomeViewModel", "All image uploads finished (with exceptions) in createEventFromBytes")
                                _uploadProgress.value = null
                                _uploadCounters.value = 0 to 0
                                _saving.value = false
                                android.util.Log.d("HomeViewModel", "Set saving to false (image uploads with exceptions in createEventFromBytes)")
                            }
                        }
                    }
                }
                .addOnFailureListener { e ->
                    _saving.value = false
                    android.util.Log.d("HomeViewModel", "Set saving to false (Firestore failure in createEventFromBytes)")
                    _message.value = e.message ?: "Ошибка сохранения"
                }
        }
    }

    fun consumeMessage() { _message.value = null }

    private fun loadTestEvents() {
        val testEvents = listOf(
            Event(
                id = "1",
                title = "Тестовое мероприятие 1",
                startAtMillis = System.currentTimeMillis() + 86400000, // Завтра
                isOnline = false,
                isFree = true,
                price = null,
                location = "Москва, ул. Примерная, 1",
                imageUrls = emptyList(),
                categories = listOf("Музыка", "Вечеринки")
            ),
            Event(
                id = "2",
                title = "Онлайн конференция",
                startAtMillis = System.currentTimeMillis() + 172800000, // Послезавтра
                isOnline = true,
                isFree = false,
                price = 1500.0,
                location = null,
                imageUrls = emptyList(),
                categories = listOf("IT", "Образование")
            )
        )
        _events.value = testEvents
        android.util.Log.d("HomeViewModel", "Test events loaded: ${testEvents.size}")
    }

    fun refreshEvents() {
        if (_refreshing.value) return
        
        viewModelScope.launch {
            _refreshing.value = true
            try {
                android.util.Log.d("HomeViewModel", "🔄 Обновляем события...")
                
                // Принудительно обновляем данные из Firebase
                EventsRepository.listenEvents().collect { events ->
                    _events.value = events
                    android.util.Log.d("HomeViewModel", "🔄 События обновлены: ${events.size}")
                    _refreshing.value = false
                    return@collect
                }
                
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "❌ Ошибка обновления событий", e)
                _message.value = "Ошибка обновления: ${e.message}"
                _refreshing.value = false
            }
        }
    }

    fun clearNewEventsNotification() {
        _hasNewEvents.value = false
        _newEventsCount.value = 0
        android.util.Log.d("HomeViewModel", "New events notification cleared")
    }

    override fun onCleared() {
        listenerRegistration?.remove()
        super.onCleared()
    }
}
