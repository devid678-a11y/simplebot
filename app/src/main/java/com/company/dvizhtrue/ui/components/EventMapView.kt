package com.company.dvizhtrue.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import kotlinx.coroutines.launch

@Composable
fun EventMapView(
    location: String,
    eventTitle: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showMap by remember { mutableStateOf(false) }
    var coordinates by remember { mutableStateOf<LatLng?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Геокодирование адреса
    LaunchedEffect(location) {
        if (location.isNotBlank()) {
            isLoading = true
            error = null
            scope.launch {
                try {
                    coordinates = geocodeAddress(context, location)
                    isLoading = false
                } catch (e: Exception) {
                    error = "Не удалось найти адрес на карте"
                    isLoading = false
                }
            }
        }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { 
                if (coordinates != null) {
                    showMap = true
                } else if (location.isNotBlank()) {
                    // Открываем в внешнем приложении карт
                    openInExternalMaps(context, location)
                }
            },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = Color(0xFF00E5FF),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = "Место проведения",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = location,
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 14.sp
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            when {
                isLoading -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = Color(0xFF00E5FF)
                        )
                        Text(
                            text = "Загружаем карту...",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                    }
                }
                error != null -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Map,
                            contentDescription = null,
                            tint = Color.Red.copy(alpha = 0.7f),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = error!!,
                            color = Color.Red.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                    }
                }
                coordinates != null -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF2A2A2A))
                    ) {
                        GoogleMap(
                            modifier = Modifier.fillMaxSize(),
                            cameraPositionState = CameraPositionState(
                                position = CameraPosition.fromLatLngZoom(coordinates!!, 15f)
                            ),
                            properties = MapProperties(
                                isMyLocationEnabled = false,
                                mapType = MapType.NORMAL
                            ),
                            uiSettings = MapUiSettings(
                                zoomControlsEnabled = false,
                                compassEnabled = false,
                                myLocationButtonEnabled = false,
                                mapToolbarEnabled = false
                            )
                        ) {
                            Marker(
                                state = MarkerState(position = coordinates!!),
                                title = eventTitle,
                                snippet = location
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = "Нажмите для просмотра в полном размере",
                        color = Color(0xFF00E5FF),
                        fontSize = 12.sp
                    )
                }
                else -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Map,
                            contentDescription = null,
                            tint = Color(0xFF00E5FF),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Нажмите для открытия в картах",
                            color = Color(0xFF00E5FF),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }

    // Диалог с полной картой
    if (showMap && coordinates != null) {
        FullScreenMapDialog(
            coordinates = coordinates!!,
            eventTitle = eventTitle,
            location = location,
            onDismiss = { showMap = false }
        )
    }
}

@Composable
private fun FullScreenMapDialog(
    coordinates: LatLng,
    eventTitle: String,
    location: String,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = eventTitle,
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(400.dp)
                    .clip(RoundedCornerShape(8.dp))
            ) {
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = CameraPositionState(
                        position = CameraPosition.fromLatLngZoom(coordinates, 16f)
                    ),
                    properties = MapProperties(
                        isMyLocationEnabled = true,
                        mapType = MapType.NORMAL
                    ),
                    uiSettings = MapUiSettings(
                        zoomControlsEnabled = true,
                        compassEnabled = true,
                        myLocationButtonEnabled = true,
                        mapToolbarEnabled = true
                    )
                ) {
                    Marker(
                        state = MarkerState(position = coordinates),
                        title = eventTitle,
                        snippet = location
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Закрыть", color = Color.White)
            }
        },
        containerColor = Color(0xFF1A1A1A),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )
}

// Используем сервис геокодирования
private suspend fun geocodeAddress(context: Context, address: String): LatLng? {
    return GeocodingService.geocodeAddress(context, address)
}

private fun openInExternalMaps(context: Context, location: String) {
    try {
        val uri = Uri.parse("geo:0,0?q=${Uri.encode(location)}")
        val intent = Intent(Intent.ACTION_VIEW, uri)
        context.startActivity(intent)
    } catch (e: Exception) {
        // Fallback to web maps
        try {
            val uri = Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encode(location)}")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            context.startActivity(intent)
        } catch (e2: Exception) {
            // Ignore if no maps app available
        }
    }
}
