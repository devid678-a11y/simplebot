package com.company.dvizhtrue.ui.components

import android.content.Context
import com.google.android.gms.maps.model.LatLng
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL

class GeocodingService {
    
    companion object {
        private const val GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"
        private const val API_KEY = "YOUR_GOOGLE_MAPS_API_KEY" // Замените на ваш API ключ
        
        suspend fun geocodeAddress(context: Context, address: String): LatLng? {
            return withContext(Dispatchers.IO) {
                try {
                    val encodedAddress = java.net.URLEncoder.encode(address, "UTF-8")
                    val url = "$GEOCODING_API_URL?address=$encodedAddress&key=$API_KEY&language=ru"
                    
                    val response = URL(url).readText()
                    val json = JSONObject(response)
                    
                    if (json.getString("status") == "OK") {
                        val results = json.getJSONArray("results")
                        if (results.length() > 0) {
                            val location = results.getJSONObject(0)
                                .getJSONObject("geometry")
                                .getJSONObject("location")
                            
                            val lat = location.getDouble("lat")
                            val lng = location.getDouble("lng")
                            
                            LatLng(lat, lng)
                        } else null
                    } else {
                        // Fallback к простому геокодированию
                        simpleGeocode(address)
                    }
                } catch (e: Exception) {
                    // Fallback к простому геокодированию
                    simpleGeocode(address)
                }
            }
        }
        
        private fun simpleGeocode(address: String): LatLng? {
            return when {
                address.contains("Москва", ignoreCase = true) -> {
                    when {
                        address.contains("Парк Горького", ignoreCase = true) -> LatLng(55.7317, 37.6010)
                        address.contains("Циферблат", ignoreCase = true) -> LatLng(55.7558, 37.6176)
                        address.contains("Тверская", ignoreCase = true) -> LatLng(55.7558, 37.6176)
                        address.contains("Арбат", ignoreCase = true) -> LatLng(55.7522, 37.5911)
                        address.contains("Красная площадь", ignoreCase = true) -> LatLng(55.7539, 37.6208)
                        address.contains("Сокольники", ignoreCase = true) -> LatLng(55.7900, 37.6800)
                        else -> LatLng(55.7558, 37.6176) // Центр Москвы
                    }
                }
                address.contains("Санкт-Петербург", ignoreCase = true) -> {
                    when {
                        address.contains("Невский", ignoreCase = true) -> LatLng(59.9311, 30.3609)
                        address.contains("Дворцовая", ignoreCase = true) -> LatLng(59.9386, 30.3141)
                        else -> LatLng(59.9311, 30.3609) // Центр СПб
                    }
                }
                address.contains("Казань", ignoreCase = true) -> LatLng(55.8304, 49.0661)
                address.contains("Екатеринбург", ignoreCase = true) -> LatLng(56.8431, 60.6454)
                address.contains("Новосибирск", ignoreCase = true) -> LatLng(55.0084, 82.9357)
                else -> LatLng(55.7558, 37.6176) // Москва по умолчанию
            }
        }
    }
}


