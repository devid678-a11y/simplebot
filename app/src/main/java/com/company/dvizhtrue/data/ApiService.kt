package com.company.dvizhtrue.data

import retrofit2.Response
import retrofit2.http.*

/**
 * API интерфейс для работы с сервером событий
 */
interface ApiService {
    
    @GET("api/events")
    suspend fun getEvents(
        @Query("limit") limit: Int = 100,
        @Query("orderBy") orderBy: String = "start_at_millis",
        @Query("order") order: String = "desc"
    ): Response<List<EventResponse>>
    
    @GET("api/events/{id}")
    suspend fun getEvent(@Path("id") id: String): Response<EventResponse>
    
    @POST("api/events")
    suspend fun createEvent(@Body event: CreateEventRequest): Response<CreateEventResponse>
    
    @GET("api/events/{id}/attendees")
    suspend fun getAttendees(@Path("id") eventId: String): Response<List<AttendeeResponse>>
    
    @GET("api/events/{id}/attendees/{userId}")
    suspend fun checkAttending(
        @Path("id") eventId: String,
        @Path("userId") userId: String
    ): Response<AttendingResponse>
    
    @POST("api/events/{id}/attendees/{userId}")
    suspend fun addAttendee(
        @Path("id") eventId: String,
        @Path("userId") userId: String,
        @Body body: Map<String, Any> = emptyMap()
    ): Response<AttendeeActionResponse>
    
    @DELETE("api/events/{id}/attendees/{userId}")
    suspend fun removeAttendee(
        @Path("id") eventId: String,
        @Path("userId") userId: String
    ): Response<AttendeeActionResponse>
    
    @GET("api/users/{userId}/events")
    suspend fun getUserEvents(@Path("userId") userId: String): Response<List<EventResponse>>
}

/**
 * Ответ API для события
 */
data class EventResponse(
    val id: String,
    val title: String,
    val description: String?,
    val startAtMillis: Long?,
    val endAtMillis: Long?,
    val isFree: Boolean,
    val price: Int?,
    val isOnline: Boolean,
    val location: String?,
    val geo: GeoResponse?,
    val geohash: String?,
    val categories: List<String>?,
    val imageUrls: List<String>?,
    val links: Any?,
    val source: Any?,
    val attendeesCount: Int?,
    val createdAt: TimestampResponse?
)

data class GeoResponse(
    val lat: Double,
    val lng: Double
)

data class TimestampResponse(
    val _seconds: Long,
    val _nanoseconds: Int
)

/**
 * Запрос на создание события
 */
data class CreateEventRequest(
    val title: String,
    val description: String? = null,
    val startAtMillis: Long,
    val endAtMillis: Long? = null,
    val isFree: Boolean = true,
    val price: Int = 0,
    val isOnline: Boolean = false,
    val location: String? = null,
    val geo: GeoResponse? = null,
    val imageUrls: List<String> = emptyList(),
    val categories: List<String> = emptyList(),
    val links: Any? = null,
    val source: Map<String, Any>? = null,
    val createdBy: String? = null,
    val createdByDisplayName: String? = null,
    val createdByPhotoUrl: String? = null
)

/**
 * Ответ на создание события
 */
data class CreateEventResponse(
    val id: String,
    val success: Boolean,
    val message: String
)

/**
 * Ответ для attendee
 */
data class AttendeeResponse(
    val userId: String,
    val createdAt: String?
)

/**
 * Ответ проверки участия
 */
data class AttendingResponse(
    val going: Boolean
)

/**
 * Ответ на действие с attendee
 */
data class AttendeeActionResponse(
    val success: Boolean
)

/**
 * Расширение для преобразования EventResponse в Event
 */
fun EventResponse.toEvent(): Event {
    // Преобразуем geo в location если нужно
    val locationString = location ?: (geo?.let { "${it.lat}, ${it.lng}" })
    
    // Извлекаем links для получения URL
    val linksMap = when (links) {
        is Map<*, *> -> links as Map<String, Any>
        else -> null
    }
    val telegramUrl = linksMap?.get("telegram") as? String
    val originalUrl = linksMap?.get("original") as? String
    
    return Event(
        id = id,
        title = title,
        description = description,
        startAtMillis = startAtMillis ?: 0L,
        isOnline = isOnline,
        isFree = isFree,
        price = price?.toDouble(),
        location = locationString,
        place = location,
        imageUrls = imageUrls ?: emptyList(),
        categories = categories ?: emptyList(),
        telegramUrl = telegramUrl,
        originalUrl = originalUrl,
        externalUrl = originalUrl ?: telegramUrl,
        communityId = null // Можно добавить позже если нужно
    )
}

