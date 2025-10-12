package com.company.dvizhtrue.data

data class Community(
    val id: String = "",
    val name: String,
    val description: String,
    val ownerId: String,
    val memberIds: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val imageUrl: String? = null,
    val isPublic: Boolean = true,
    val inviteCode: String? = null
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "name" to name,
            "description" to description,
            "ownerId" to ownerId,
            "memberIds" to memberIds,
            "createdAt" to createdAt,
            "imageUrl" to (imageUrl ?: ""),
            "isPublic" to isPublic,
            "inviteCode" to (inviteCode ?: "")
        )
    }

    companion object {
        fun fromMap(map: Map<String, Any>): Community {
            return Community(
                id = map["id"] as? String ?: "",
                name = map["name"] as? String ?: "",
                description = map["description"] as? String ?: "",
                ownerId = map["ownerId"] as? String ?: "",
                memberIds = (map["memberIds"] as? List<*>)?.mapNotNull { it as? String } ?: emptyList(),
                createdAt = (map["createdAt"] as? Long) ?: System.currentTimeMillis(),
                imageUrl = map["imageUrl"] as? String,
                isPublic = (map["isPublic"] as? Boolean) ?: true,
                inviteCode = map["inviteCode"] as? String
            )
        }
    }
}
