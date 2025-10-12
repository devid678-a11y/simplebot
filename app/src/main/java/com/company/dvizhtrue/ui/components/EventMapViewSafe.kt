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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import kotlinx.coroutines.launch

@Composable
fun EventMapViewSafe(
    location: String,
    eventTitle: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showMap by remember { mutableStateOf(false) }
    var coordinates by remember { mutableStateOf<LatLng?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var mapError by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Геокодирование адреса
    LaunchedEffect(location) {
        if (location.isNotBlank()) {
            isLoading = true
            error = null
            scope.launch {
                try {
                    coordinates = GeocodingService.geocodeAddress(context, location)
                    isLoading = false
                } catch (e: Exception) {
                    android.util.Log.e("EventMapViewSafe", "Geocoding error", e)
                    error = e.message
                    isLoading = false
                }
            }
        }
    }

    // Если есть ошибка или нет координат, показываем заглушку
    if (error != null || coordinates == null) {
        MapPlaceholder(
            location = location,
            eventTitle = eventTitle,
            modifier = modifier,
            onOpenExternal = { openInExternalMaps(context, location) }
        )
        return
    }

    // Показываем настоящую карту
    Box(
        modifier = modifier
            .height(200.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.Gray)
            .clickable { showMap = true }
    ) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = CameraPositionState(
                position = CameraPosition.fromLatLngZoom(coordinates!!, 12f)
            ),
            properties = MapProperties(
                isMyLocationEnabled = false,
                mapType = MapType.NORMAL
            ),
            uiSettings = MapUiSettings(
                zoomControlsEnabled = false,
                scrollGesturesEnabled = false,
                zoomGesturesEnabled = false,
                rotationGesturesEnabled = false,
                tiltGesturesEnabled = false,
                mapToolbarEnabled = false
            )
        ) {
            Marker(
                state = MarkerState(position = coordinates!!),
                title = eventTitle,
                snippet = location
            )
        }
        
        // Индикатор загрузки
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = Color(0xFF00E5FF)
                )
            }
        }
    }

    if (showMap) {
        FullScreenMapDialog(
            location = location,
            eventTitle = eventTitle,
            initialLatLng = coordinates!!,
            onDismiss = { showMap = false }
        )
    }
}

@Composable
private fun MapPlaceholder(
    location: String,
    eventTitle: String,
    modifier: Modifier,
    onOpenExternal: () -> Unit
) {
    Box(
        modifier = modifier
            .height(200.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF2A2A2A))
            .clickable { onOpenExternal() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Map,
                contentDescription = null,
                tint = Color(0xFF00E5FF),
                modifier = Modifier.size(48.dp)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "📍 $location",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "Нажмите, чтобы открыть в картах",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun FullScreenMapDialog(
    location: String,
    eventTitle: String,
    initialLatLng: LatLng,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(initialLatLng, 14f)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onDismiss) {
                    Text("Закрыть", color = Color.White)
                }
                Button(
                    onClick = { openInExternalMaps(context, location) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00E5FF))
                ) {
                    Text("Открыть в Картах", color = Color.White)
                }
            }
        },
        title = {
            Text(
                text = eventTitle,
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall
            )
        },
        text = {
            Column {
                Text(
                    text = location,
                    color = Color.White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(400.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Gray)
                ) {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        uiSettings = MapUiSettings(
                            zoomControlsEnabled = true,
                            compassEnabled = true,
                            myLocationButtonEnabled = true
                        )
                    ) {
                        Marker(
                            state = MarkerState(position = initialLatLng),
                            title = eventTitle,
                            snippet = location
                        )
                    }
                }
            }
        },
        containerColor = Color(0xFF1A1A1A),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )
}

private fun openInExternalMaps(context: Context, location: String) {
    try {
        val uri = Uri.parse("geo:0,0?q=${Uri.encode(location)}")
        val intent = Intent(Intent.ACTION_VIEW, uri)
        context.startActivity(intent)
    } catch (_: Exception) {
        // Fallback to web if no app can handle geo URI
        try {
            val webUri = Uri.parse("https://maps.google.com/?q=${Uri.encode(location)}")
            val webIntent = Intent(Intent.ACTION_VIEW, webUri)
            context.startActivity(webIntent)
        } catch (_: Exception) {
            // If all else fails, show a toast or do nothing
        }
    }
}
