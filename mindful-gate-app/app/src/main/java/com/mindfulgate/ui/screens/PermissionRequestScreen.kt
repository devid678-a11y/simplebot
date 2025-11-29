package com.mindfulgate.ui.screens

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun PermissionRequestScreen(
    onPermissionGranted: () -> Unit
) {
    val context = LocalContext.current
    var isProcessing by remember { mutableStateOf(false) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Разрешение на отображение поверх других приложений",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Для работы приложения необходимо разрешение на отображение поверх других приложений. Это позволит показывать экран паузы при открытии выбранных приложений.",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = {
                Log.d("PermissionScreen", "Открыть настройки нажато")
                val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                } else {
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                }
                context.startActivity(intent)
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Открыть настройки")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Простая кнопка без условий с защитой от множественных кликов
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clickable(enabled = !isProcessing) {
                    if (isProcessing) return@clickable
                    isProcessing = true
                    Log.d("PermissionScreen", "Кнопка продолжить нажата!")
                    val hasPermission = Settings.canDrawOverlays(context)
                    Log.d("PermissionScreen", "Разрешение: $hasPermission")
                    if (hasPermission) {
                        Log.d("PermissionScreen", "Вызываем onPermissionGranted")
                        onPermissionGranted()
                    } else {
                        Log.d("PermissionScreen", "Разрешение не дано")
                        isProcessing = false
                    }
                }
                .background(
                    color = if (isProcessing) 
                        MaterialTheme.colorScheme.secondary.copy(alpha = 0.6f)
                    else 
                        MaterialTheme.colorScheme.secondary,
                    shape = MaterialTheme.shapes.medium
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (isProcessing) "Обработка..." else "Проверить и продолжить",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSecondary
            )
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "1. Нажмите 'Открыть настройки'\n2. Разрешите отображение поверх других приложений\n3. Вернитесь в приложение и нажмите 'Проверить и продолжить'",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}

