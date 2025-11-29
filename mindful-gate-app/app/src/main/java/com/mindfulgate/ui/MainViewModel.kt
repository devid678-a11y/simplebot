package com.mindfulgate.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindfulgate.data.MindfulRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel(
    private val repository: MindfulRepository
) : ViewModel() {
    
    sealed class Screen {
        object PermissionRequest : Screen()
        object AppSelection : Screen()
        object Editor : Screen()
        object Pause : Screen()
        object Home : Screen()
    }
    
    private val _currentScreen = MutableStateFlow<Screen>(Screen.PermissionRequest)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()
    
    init {
        // Проверяем, был ли первый запуск
        val hasCompletedSetup = repository.getMonitoredApps().isNotEmpty()
        if (hasCompletedSetup) {
            _currentScreen.value = Screen.Home
        }
    }
    
    fun navigateTo(screen: Screen) {
        Log.d("MainViewModel", "navigateTo: $screen")
        _currentScreen.value = screen
    }
    
    fun onPermissionGranted() {
        Log.d("MainViewModel", "onPermissionGranted вызван, текущий экран: ${_currentScreen.value}")
        if (_currentScreen.value is Screen.PermissionRequest) {
            Log.d("MainViewModel", "Переходим к AppSelection")
            _currentScreen.value = Screen.AppSelection
        } else {
            Log.d("MainViewModel", "Игнорируем - уже не на экране разрешений")
        }
    }
    
    fun onAppsSelected() {
        Log.d("MainViewModel", "onAppsSelected вызван, текущий экран: ${_currentScreen.value}")
        Log.d("MainViewModel", "Переходим к Editor")
        _currentScreen.value = Screen.Editor
        Log.d("MainViewModel", "Экран изменен на: ${_currentScreen.value}")
    }
    
    fun onEditorSaved() {
        _currentScreen.value = Screen.Home
    }
    
    fun showPauseScreen() {
        repository.incrementStatsShown()
        _currentScreen.value = Screen.Pause
    }
    
    fun proceedFromPause() {
        repository.incrementStatsProceed()
        _currentScreen.value = Screen.Home
    }
    
    fun skipFromPause() {
        repository.incrementStatsSkip()
        _currentScreen.value = Screen.Home
    }
}

