package com.mindfulgate.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mindfulgate.ui.screens.AppSelectionScreen
import com.mindfulgate.ui.screens.EditorScreen
import com.mindfulgate.ui.screens.MindfulPauseScreen
import com.mindfulgate.ui.screens.PermissionRequestScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun MainScreen(viewModel: MainViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsStateWithLifecycle()
    
    when (currentScreen) {
        is MainViewModel.Screen.PermissionRequest -> {
            PermissionRequestScreen(
                onPermissionGranted = { viewModel.onPermissionGranted() }
            )
        }
        is MainViewModel.Screen.AppSelection -> {
            AppSelectionScreen(
                onAppsSelected = { viewModel.onAppsSelected() }
            )
        }
        is MainViewModel.Screen.Editor -> {
            EditorScreen(
                onSave = { viewModel.onEditorSaved() }
            )
        }
        is MainViewModel.Screen.Pause -> {
            MindfulPauseScreen(
                onProceed = { viewModel.proceedFromPause() },
                onSkip = { viewModel.skipFromPause() }
            )
        }
        is MainViewModel.Screen.Home -> {
            HomeScreen(
                onShowPause = { viewModel.showPauseScreen() }
            )
        }
    }
}

@Composable
fun HomeScreen(
    onShowPause: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Mindful Gate",
            style = MaterialTheme.typography.headlineLarge
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onShowPause,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Показать экран паузы")
        }
    }
}

