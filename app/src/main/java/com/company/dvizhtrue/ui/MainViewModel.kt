package com.company.dvizhtrue.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.company.dvizhtrue.data.AuthRepository
import com.company.dvizhtrue.data.UserRepository
import com.company.dvizhtrue.data.Community
import com.company.dvizhtrue.data.CommunityRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import com.google.firebase.storage.ktx.storage
import kotlinx.coroutines.tasks.await

sealed class RootScreen {
    data object Landing : RootScreen()
    data object CommunityLogin : RootScreen()
    data class Home(val role: String) : RootScreen()
    data object GuestMyEvents : RootScreen()
    data object MyEvents : RootScreen()
    data object CreateCommunity : RootScreen()
    data object MyCommunities : RootScreen()
    data class CommunityManagement(val communityId: String) : RootScreen()
    data object JoinCommunity : RootScreen()
    data class CommunityFeed(val communityId: String) : RootScreen()
}

class MainViewModel : ViewModel() {
    private val _screen = MutableStateFlow<RootScreen>(RootScreen.Home("community"))
    val screen: StateFlow<RootScreen> = _screen

    private val _role = MutableStateFlow<String?>("community")
    val role: StateFlow<String?> = _role

    private val _currentCommunity = MutableStateFlow<Community?>(null)
    val currentCommunity: StateFlow<Community?> = _currentCommunity

    private val _userCommunities = MutableStateFlow<List<Community>>(emptyList())
    val userCommunities: StateFlow<List<Community>> = _userCommunities

    // Creation state
    private val _creatingCommunity = MutableStateFlow(false)
    val creatingCommunity: StateFlow<Boolean> = _creatingCommunity
    private val _createCommunityError = MutableStateFlow<String?>(null)
    val createCommunityError: StateFlow<String?> = _createCommunityError

    // Avatar selection state (temporary while creating)
    private val _newCommunityAvatarUri = MutableStateFlow<android.net.Uri?>(null)
    val newCommunityAvatarUri: StateFlow<android.net.Uri?> = _newCommunityAvatarUri

    fun setNewCommunityAvatar(uri: android.net.Uri?) {
        _newCommunityAvatarUri.value = uri
    }

    init {
        // Start directly with home screen as community
        _screen.value = RootScreen.Home("community")
        _role.value = "community"
        
        // Firebase initialization
        android.util.Log.d("MainViewModel", "Initializing Firebase...")
        try {
            AuthRepository.signInAnonymously()
                .addOnSuccessListener { result ->
                    android.util.Log.d("MainViewModel", "Firebase auth success: ${result.user?.uid}")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("MainViewModel", "Firebase auth failed", e)
                }
        } catch (e: Exception) {
            android.util.Log.e("MainViewModel", "Firebase init error", e)
        }
    }

    fun chooseGuest() {
        android.util.Log.d("MainViewModel", "chooseGuest called")
        _role.value = "guest"
        _screen.value = RootScreen.Home("guest")
        android.util.Log.d("MainViewModel", "Guest mode enabled")
    }

    fun chooseCommunity() {
        android.util.Log.d("MainViewModel", "chooseCommunity called")
        _role.value = "community"
        _screen.value = RootScreen.Home("community")
        android.util.Log.d("MainViewModel", "Community mode enabled")
    }

    fun back() {
        when (_screen.value) {
            is RootScreen.CommunityLogin -> _screen.value = RootScreen.Landing
            is RootScreen.Home -> _screen.value = RootScreen.Landing
            is RootScreen.GuestMyEvents -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            is RootScreen.MyEvents -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            is RootScreen.CreateCommunity -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            is RootScreen.MyCommunities -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            is RootScreen.JoinCommunity -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            is RootScreen.CommunityManagement -> _screen.value = RootScreen.MyCommunities
            is RootScreen.CommunityFeed -> _screen.value = RootScreen.Home(_role.value ?: "guest")
            else -> { /* no-op */ }
        }
    }

    fun navigateToGuestMyEvents() {
        _screen.value = RootScreen.GuestMyEvents
    }
    
    fun navigateToMyEvents() {
        _screen.value = RootScreen.MyEvents
    }

    // Community management methods
    fun navigateToCreateCommunity() {
        _screen.value = RootScreen.CreateCommunity
    }

    fun navigateToMyCommunities() {
        _screen.value = RootScreen.MyCommunities
    }

    fun navigateToJoinCommunity() {
        _screen.value = RootScreen.JoinCommunity
    }

    fun navigateToCommunityManagement(communityId: String) {
        _screen.value = RootScreen.CommunityManagement(communityId)
    }

    fun switchToCommunity(community: Community) {
        _currentCommunity.value = community
        _role.value = "community"
        _screen.value = RootScreen.Home("community")
    }

    fun switchToGuest() {
        _currentCommunity.value = null
        _role.value = "guest"
        _screen.value = RootScreen.Home("guest")
    }

    fun loadUserCommunities() {
        viewModelScope.launch {
            try {
                val userId = AuthRepository.getCurrentUserIdOrNull()
                if (userId != null) {
                    val result = CommunityRepository.getUserCommunities(userId)
                    if (result.isSuccess) {
                        _userCommunities.value = result.getOrNull() ?: emptyList()
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Error loading user communities", e)
            }
        }
    }

    fun createCommunity(name: String, description: String) {
        viewModelScope.launch {
            try {
                _createCommunityError.value = null
                _creatingCommunity.value = true
                val userId = AuthRepository.getCurrentUserIdOrNull()
                if (userId == null) {
                    // Если не авторизован — пробуем анонимный вход и повторить
                    AuthRepository.signInAnonymously()
                        .addOnSuccessListener { res ->
                            val newUid = res.user?.uid
                            if (newUid != null) {
                                // Повторяем создание уже с uid
                                createCommunity(name, description)
                            } else {
                                android.util.Log.e("MainViewModel", "Anonymous sign-in returned null uid")
                                _createCommunityError.value = "Не удалось войти. Повторите попытку"
                                _creatingCommunity.value = false
                            }
                        }
                        .addOnFailureListener { e ->
                            android.util.Log.e("MainViewModel", "Anonymous sign-in failed", e)
                            _createCommunityError.value = e.message
                            _creatingCommunity.value = false
                        }
                    return@launch
                }

                // Prepare optional avatar upload
                var imageUrl: String? = null
                val avatarUri = newCommunityAvatarUri.value
                if (avatarUri != null) {
                    try {
                        val storage = com.google.firebase.ktx.Firebase.storage
                        val idForImage = java.util.UUID.randomUUID().toString()
                        val ref = storage.reference.child("community_avatars/$idForImage.jpg")
                        val uploadTask = ref.putFile(avatarUri).await()
                        imageUrl = ref.downloadUrl.await().toString()
                    } catch (e: Exception) {
                        android.util.Log.e("MainViewModel", "Avatar upload failed", e)
                    }
                }

                val community = Community(
                    name = name,
                    description = description,
                    ownerId = userId,
                    imageUrl = imageUrl
                )
                val result = CommunityRepository.createCommunity(community)
                if (result.isSuccess) {
                    val newCommunity = result.getOrNull()
                    if (newCommunity != null) {
                        // Ensure it appears in "Мои сообщества" immediately
                        _userCommunities.value = (_userCommunities.value + newCommunity).distinctBy { it.id }
                        _currentCommunity.value = newCommunity
                        _screen.value = RootScreen.MyCommunities
                        loadUserCommunities()
                        _newCommunityAvatarUri.value = null
                        _creatingCommunity.value = false
                    } else {
                        _createCommunityError.value = "Ошибка создания сообщества"
                        _creatingCommunity.value = false
                    }
                } else {
                    _createCommunityError.value = result.exceptionOrNull()?.message ?: "Ошибка создания"
                    _creatingCommunity.value = false
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Error creating community", e)
                _createCommunityError.value = e.message
                _creatingCommunity.value = false
            }
        }
    }

    fun joinCommunity(inviteCode: String) {
        viewModelScope.launch {
            try {
                val userId = AuthRepository.getCurrentUserIdOrNull()
                if (userId != null) {
                    val result = CommunityRepository.joinCommunity(inviteCode, userId)
                    if (result.isSuccess) {
                        val community = result.getOrNull()
                        if (community != null) {
                            _userCommunities.value = _userCommunities.value + community
                            switchToCommunity(community)
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Error joining community", e)
            }
        }
    }

    fun leaveCommunity(communityId: String) {
        viewModelScope.launch {
            try {
                val userId = AuthRepository.getCurrentUserIdOrNull()
                if (userId != null) {
                    val result = CommunityRepository.leaveCommunity(communityId, userId)
                    if (result.isSuccess) {
                        _userCommunities.value = _userCommunities.value.filter { it.id != communityId }
                        if (_currentCommunity.value?.id == communityId) {
                            switchToGuest()
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Error leaving community", e)
            }
        }
    }

    fun navigateToCommunityFeed(communityId: String) {
        _screen.value = RootScreen.CommunityFeed(communityId)
    }
}
