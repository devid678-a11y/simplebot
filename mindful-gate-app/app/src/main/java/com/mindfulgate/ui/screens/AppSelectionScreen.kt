package com.mindfulgate.ui.screens

import android.content.pm.PackageManager
import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mindfulgate.data.MindfulRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun AppSelectionScreen(
    onAppsSelected: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { MindfulRepository(context) }
    val packageManager = context.packageManager
    val scope = rememberCoroutineScope()
    
    var apps by remember { mutableStateOf<List<AppInfo>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var selectedApps by remember { mutableStateOf<Set<String>>(emptySet()) }
    
    // Загружаем приложения асинхронно в фоне, не блокируя UI
    LaunchedEffect(Unit) {
        scope.launch(Dispatchers.IO) {
            try {
                isLoading = true
                Log.d("AppSelectionScreen", "Начинаем загрузку приложений")
                val packages = packageManager.getInstalledPackages(0)
                Log.d("AppSelectionScreen", "Найдено пакетов: ${packages.size}")
                
                val loadedApps = packages
                    .take(100) // Ограничиваем до 100 приложений для скорости
                    .map { it.packageName }
                    .filter { 
                        !it.startsWith("com.android") && 
                        !it.startsWith("com.google") &&
                        it != context.packageName
                    }
                    .sorted()
                    .mapNotNull { packageName ->
                        try {
                            val appInfo = packageManager.getApplicationInfo(packageName, 0)
                            val appName = packageManager.getApplicationLabel(appInfo).toString()
                            AppInfo(packageName, appName)
                        } catch (e: Exception) {
                            null
                        }
                    }
                
                withContext(Dispatchers.Main) {
                    apps = loadedApps
                    isLoading = false
                    Log.d("AppSelectionScreen", "Загружено приложений: ${loadedApps.size}")
                }
            } catch (e: Exception) {
                Log.e("AppSelectionScreen", "Ошибка загрузки", e)
                withContext(Dispatchers.Main) {
                    isLoading = false
                }
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Выберите приложения для мониторинга",
            style = MaterialTheme.typography.headlineMedium
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Экран паузы будет появляться при открытии выбранных приложений",
            style = MaterialTheme.typography.bodyMedium
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            if (apps.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Приложения не найдены")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(apps) { app ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = app.name,
                                modifier = Modifier.weight(1f)
                            )
                            Checkbox(
                                checked = selectedApps.contains(app.packageName),
                                onCheckedChange = { checked ->
                                    selectedApps = if (checked) {
                                        selectedApps + app.packageName
                                    } else {
                                        selectedApps - app.packageName
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = {
                Log.d("AppSelectionScreen", "Кнопка нажата!")
                // Сохраняем асинхронно и сразу переходим
                scope.launch(Dispatchers.IO) {
                    try {
                        repository.saveMonitoredApps(selectedApps.toList())
                        Log.d("AppSelectionScreen", "Данные сохранены")
                    } catch (e: Exception) {
                        Log.e("AppSelectionScreen", "Ошибка сохранения", e)
                    }
                }
                // Сразу переходим, не ждем сохранения
                Log.d("AppSelectionScreen", "Вызываем onAppsSelected")
                onAppsSelected()
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (selectedApps.isEmpty()) "Продолжить без выбора" else "Продолжить")
        }
    }
}

data class AppInfo(
    val packageName: String,
    val name: String
)

