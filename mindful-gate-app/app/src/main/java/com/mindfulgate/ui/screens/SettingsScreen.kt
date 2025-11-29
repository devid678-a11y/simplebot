package com.mindfulgate.ui.screens

import android.content.pm.PackageManager
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

@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { MindfulRepository(context) }
    val packageManager = context.packageManager
    
    var holdDuration by remember { mutableStateOf(repository.getHoldDuration()) }
    var monitoredApps by remember { mutableStateOf(repository.getMonitoredApps()) }
    var showAppSelector by remember { mutableStateOf(false) }
    val stats = remember { repository.getStats() }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Заголовок
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Настройки",
                style = MaterialTheme.typography.headlineMedium
            )
            IconButton(onClick = onBack) {
                Text("Назад")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                // Настройка времени удержания
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Длительность удержания",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("${holdDuration} секунд")
                        Slider(
                            value = holdDuration.toFloat(),
                            onValueChange = { 
                                holdDuration = it.toInt()
                                repository.saveHoldDuration(holdDuration)
                            },
                            valueRange = 3f..15f,
                            steps = 11
                        )
                    }
                }
            }
            
            item {
                // Выбор приложений
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Мониторируемые приложения",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = { showAppSelector = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Выбрать приложения")
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        if (monitoredApps.isNotEmpty()) {
                            Text(
                                text = "Выбрано: ${monitoredApps.size}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
            
            item {
                // Статистика
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Статистика",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Показов: ${stats.shown}")
                        Text("Продолжили: ${stats.proceed}")
                        Text("Отказов: ${stats.skip}")
                    }
                }
            }
        }
    }
    
    // Диалог выбора приложений
    if (showAppSelector) {
        AppSelectorDialog(
            selectedApps = monitoredApps,
            onAppsSelected = { apps ->
                monitoredApps = apps
                repository.saveMonitoredApps(apps)
                showAppSelector = false
            },
            onDismiss = { showAppSelector = false }
        )
    }
}

@Composable
fun AppSelectorDialog(
    selectedApps: List<String>,
    onAppsSelected: (List<String>) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val packageManager = context.packageManager
    
    var apps by remember {
        mutableStateOf(
            packageManager.getInstalledPackages(PackageManager.GET_META_DATA)
                .map { it.packageName }
                .filter { 
                    // Фильтруем системные приложения и само приложение
                    !it.startsWith("com.android") && 
                    !it.startsWith("com.google") &&
                    it != context.packageName
                }
                .sorted()
        )
    }
    
    var selected by remember { mutableStateOf(selectedApps.toSet()) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Выберите приложения") },
        text = {
            LazyColumn(
                modifier = Modifier.height(400.dp)
            ) {
                items(apps) { packageName ->
                    val appName = try {
                        packageManager.getApplicationLabel(
                            packageManager.getApplicationInfo(packageName, 0)
                        ).toString()
                    } catch (e: Exception) {
                        packageName
                    }
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = appName)
                        Checkbox(
                            checked = selected.contains(packageName),
                            onCheckedChange = { checked ->
                                selected = if (checked) {
                                    selected + packageName
                                } else {
                                    selected - packageName
                                }
                            }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onAppsSelected(selected.toList()) }) {
                Text("Сохранить")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Отмена")
            }
        }
    )
}

