package com.company.dvizhtrue.data

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.util.UUID

object CommunityRepository {
    private val firestore: FirebaseFirestore = Firebase.firestore
    private val communitiesCollection = firestore.collection("communities")

    suspend fun createCommunity(community: Community): Result<Community> {
        return try {
            val id = if (community.id.isBlank()) UUID.randomUUID().toString() else community.id
            val inviteCode = generateInviteCode()
            // Ensure owner is also in memberIds so it appears in member queries immediately
            val ownerInMembers = if (community.memberIds.contains(community.ownerId)) community.memberIds else community.memberIds + community.ownerId
            val communityWithId = community.copy(id = id, inviteCode = inviteCode, memberIds = ownerInMembers)
            
            communitiesCollection.document(id).set(communityWithId.toMap()).await()
            Result.success(communityWithId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCommunity(communityId: String): Result<Community?> {
        return try {
            val document = communitiesCollection.document(communityId).get().await()
            if (document.exists()) {
                val data = document.data ?: emptyMap()
                val community = Community.fromMap(data)
                Result.success(community)
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserCommunities(userId: String): Result<List<Community>> {
        return try {
            val ownedCommunities = communitiesCollection
                .whereEqualTo("ownerId", userId)
                .get()
                .await()
                .documents
                .mapNotNull { Community.fromMap(it.data ?: emptyMap()) }

            val memberCommunities = communitiesCollection
                .whereArrayContains("memberIds", userId)
                .get()
                .await()
                .documents
                .mapNotNull { Community.fromMap(it.data ?: emptyMap()) }

            val allCommunities = (ownedCommunities + memberCommunities).distinctBy { it.id }
            Result.success(allCommunities)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun joinCommunity(inviteCode: String, userId: String): Result<Community?> {
        return try {
            val communities = communitiesCollection
                .whereEqualTo("inviteCode", inviteCode)
                .get()
                .await()

            if (communities.isEmpty) {
                return Result.success(null)
            }

            val communityDoc = communities.documents.first()
            val community = Community.fromMap(communityDoc.data ?: emptyMap())
            
            if (userId in community.memberIds || userId == community.ownerId) {
                return Result.success(community)
            }

            val updatedMemberIds = community.memberIds + userId
            communityDoc.reference.update("memberIds", updatedMemberIds).await()
            
            val updatedCommunity = community.copy(memberIds = updatedMemberIds)
            Result.success(updatedCommunity)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun leaveCommunity(communityId: String, userId: String): Result<Boolean> {
        return try {
            val communityResult = getCommunity(communityId)
            if (communityResult.isFailure) {
                return Result.failure(communityResult.exceptionOrNull() ?: Exception("Failed to get community"))
            }

            val community = communityResult.getOrNull() ?: return Result.success(false)
            
            if (userId == community.ownerId) {
                // Владелец не может покинуть сообщество, только удалить его
                return Result.success(false)
            }

            val updatedMemberIds = community.memberIds.filter { it != userId }
            communitiesCollection.document(communityId)
                .update("memberIds", updatedMemberIds)
                .await()

            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateCommunity(community: Community): Result<Boolean> {
        return try {
            communitiesCollection.document(community.id)
                .set(community.toMap())
                .await()
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteCommunity(communityId: String, userId: String): Result<Boolean> {
        return try {
            val communityResult = getCommunity(communityId)
            if (communityResult.isFailure) {
                return Result.failure(communityResult.exceptionOrNull() ?: Exception("Failed to get community"))
            }

            val community = communityResult.getOrNull()
            if (community?.ownerId != userId) {
                return Result.success(false) // Только владелец может удалить
            }

            communitiesCollection.document(communityId).delete().await()
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun listenUserCommunities(userId: String): Flow<List<Community>> = flow {
        try {
            val ownedCommunities = communitiesCollection
                .whereEqualTo("ownerId", userId)
                .get()
                .await()
                .documents
                .mapNotNull { Community.fromMap(it.data ?: emptyMap()) }

            val memberCommunities = communitiesCollection
                .whereArrayContains("memberIds", userId)
                .get()
                .await()
                .documents
                .mapNotNull { Community.fromMap(it.data ?: emptyMap()) }

            val allCommunities = (ownedCommunities + memberCommunities).distinctBy { it.id }
            emit(allCommunities)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }

    private fun generateInviteCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..8)
            .map { chars.random() }
            .joinToString("")
    }
}
