package com.company.dvizhtrue.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.net.URL
import com.company.dvizhtrue.R
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.plugin.gestures.gestures
import com.google.android.gms.maps.model.LatLng
import androidx.compose.ui.viewinterop.AndroidView

@Composable
fun LocationPickerDialog(
    isVisible: Boolean,
    onDismiss: () -> Unit,
    onLocationSelected: (String, LatLng) -> Unit,
    modifier: Modifier = Modifier
) {
    if (isVisible) {
    var addressText by remember { mutableStateOf("") }
        val context = LocalContext.current
        
        Dialog(
            onDismissRequest = onDismiss,
            properties = DialogProperties(
                dismissOnBackPress = true,
                dismissOnClickOutside = false,
                usePlatformDefaultWidth = false
            )
        ) {
            Card(
                modifier = modifier
                    .fillMaxWidth()
                    .fillMaxHeight(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(0.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize()
                ) {
                    // Заголовок
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Выберите место",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        
                        IconButton(onClick = onDismiss) {
                            Icon(
                                imageVector = Icons.Filled.Close,
                                contentDescription = "Закрыть",
                                tint = Color.White
                            )
                        }
                    }
                    
                    // Поле адреса
                    OutlinedTextField(
                        value = addressText,
                        onValueChange = { addressText = it },
                        label = { Text("Адрес", color = Color.White.copy(alpha = 0.7f)) },
                        placeholder = { Text("Введите адрес или выберите на карте", color = Color.White.copy(alpha = 0.5f)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF00E5FF),
                            unfocusedBorderColor = Color(0xFF555555),
                            focusedContainerColor = Color(0xFF2A2A2A),
                            unfocusedContainerColor = Color(0xFF2A2A2A)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Полноэкранная карта Mapbox с маркером по центру
                    var mapView by remember { mutableStateOf<MapView?>(null) }
                    var cameraCenter by remember { mutableStateOf(Point.fromLngLat(37.6176, 55.7558)) }
                    var addressPreview by remember { mutableStateOf<String?>(null) }
                    val token = LocalContext.current.getString(R.string.mapbox_access_token)

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                    ) {
                        AndroidView(
                            modifier = Modifier.fillMaxSize(),
                            factory = { ctx ->
                                val mv = MapView(ctx)
                                val mapboxMap = mv.mapboxMap
                                mapboxMap.loadStyleUri(Style.MAPBOX_STREETS) {
                                    mapboxMap.setCamera(
                                        CameraOptions.Builder()
                                            .center(Point.fromLngLat(37.6176, 55.7558))
                                            .zoom(12.0)
                                            .build()
                                    )
                                    mv.gestures.updateSettings {
                                        rotateEnabled = false
                                        pitchEnabled = false
                                    }
                                    mapboxMap.addOnMapIdleListener {
                                        val c = mapboxMap.cameraState.center
                                        cameraCenter = c
                                    }
                                }
                                mapView = mv
                                mv
                            }
                        )
                        // Центр-иконка поверх карты
                        Icon(
                            imageVector = Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = Color(0xFF00E5FF),
                            modifier = Modifier
                                .size(36.dp)
                                .align(Alignment.Center)
                        )
                        // Подпись текущего адреса внизу
                        addressPreview?.let { txt ->
                            Text(
                                text = txt,
                                color = Color.White,
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .background(Color(0xB3000000))
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            )
                        }
                    }

                    LaunchedEffect(cameraCenter) {
                        try {
                            delay(350)
                            val url = URL("https://api.mapbox.com/geocoding/v5/mapbox.places/${'$'}{cameraCenter.longitude()},${'$'}{cameraCenter.latitude()}.json?access_token=${'$'}token&language=ru&limit=1&types=poi,address,place")
                            val text = withContext(Dispatchers.IO) { url.readText() }
                            val json = org.json.JSONObject(text)
                            val feats = json.optJSONArray("features")
                            val best = feats?.optJSONObject(0)
                            val name = best?.optString("place_name", null)
                            addressPreview = name
                        } catch (_: Exception) {
                            // ignore
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Кнопки
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Text("Отмена")
                        }
                        
                        Button(
                            onClick = {
                                val lat = cameraCenter.latitude()
                                val lon = cameraCenter.longitude()
                                val finalText = if (addressText.isNotBlank()) addressText else (addressPreview ?: "${'$'}lat, ${'$'}lon")
                                onLocationSelected(finalText, LatLng(lat, lon))
                                onDismiss()
                            },
                            enabled = true,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF00E5FF)
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Check,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Выбрать")
                        }
                    }
                }
            }
        }
    }
}

