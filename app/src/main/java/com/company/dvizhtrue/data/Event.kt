package com.company.dvizhtrue.data

data class Event(
    val id: String,
    val title: String,
    val description: String? = null,
    val startAtMillis: Long,
    val isOnline: Boolean,
    val isFree: Boolean,
    val price: Double?,
    val location: String?,
    val place: String? = null,
    val imageUrls: List<String>,
    val categories: List<String>,
    val telegramUrl: String? = null,
    val originalUrl: String? = null,
    val externalUrl: String? = null,
    val communityId: String? = null
) {
    companion object {
        fun fromMap(map: Map<String, Any>, id: String): Event {
            // Безопасно обрабатываем поле price
            val priceValue = map["price"]
            val priceDouble = when (priceValue) {
                is Number -> priceValue.toDouble()
                is String -> {
                    // Пытаемся извлечь число из строки (например, "500 рублей" -> 500.0)
                    val numberRegex = Regex("""(\d+(?:\.\d+)?)""")
                    val match = numberRegex.find(priceValue)
                    match?.value?.toDoubleOrNull() ?: 0.0
                }
                else -> 0.0
            }
            
            return Event(
                id = id,
                title = map["title"] as? String ?: "",
                description = map["description"] as? String,
                startAtMillis = map["startAtMillis"] as? Long ?: 0L,
                isOnline = map["isOnline"] as? Boolean ?: false,
                isFree = map["isFree"] as? Boolean ?: true,
                price = priceDouble,
                location = map["location"] as? String,
                place = map["place"] as? String,
                imageUrls = map["imageUrls"] as? List<String> ?: emptyList(),
                categories = map["categories"] as? List<String> ?: emptyList(),
                telegramUrl = map["telegramUrl"] as? String,
                originalUrl = map["originalUrl"] as? String,
                externalUrl = (map["externalUrl"] as? String)
                    ?: (map["originalUrl"] as? String)
                    ?: (map["telegramUrl"] as? String),
                communityId = map["communityId"] as? String
            )
        }
    }
}
