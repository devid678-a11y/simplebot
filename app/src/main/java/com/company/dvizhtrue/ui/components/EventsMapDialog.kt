package com.company.dvizhtrue.ui.components

import androidx.compose.foundation.background
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.viewinterop.AndroidView
import com.company.dvizhtrue.data.Event
import com.mapbox.geojson.Feature
import com.mapbox.geojson.FeatureCollection
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
// note: keep SDK minimal, avoid style extensions to reduce size
import com.mapbox.maps.plugin.gestures.addOnMapClickListener
import com.mapbox.maps.extension.style.layers.generated.circleLayer
import com.mapbox.maps.extension.style.sources.generated.geoJsonSource
import com.mapbox.maps.extension.style.sources.generated.GeoJsonSource
import com.mapbox.maps.extension.style.style
import com.mapbox.maps.extension.style.sources.getSource
import com.mapbox.maps.extension.style.sources.getSourceAs
import com.mapbox.maps.extension.style.sources.addSource
import com.mapbox.maps.extension.style.layers.getLayer
import com.mapbox.maps.extension.style.layers.addLayer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun EventsMapDialog(
    events: List<Event>,
    onDismiss: () -> Unit,
    onSelectEvent: (Event) -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var mapView by remember { mutableStateOf<MapView?>(null) }
    var features by remember { mutableStateOf<List<Feature>>(emptyList()) }
    val idToEvent = remember(events) { events.associateBy { it.id } }
    val sourceId = remember { "events-source" }
    val layerId = remember { "events-layer" }

    // Geocode locations to features
    LaunchedEffect(events) {
        val feats = mutableListOf<Feature>()
        for (e in events) {
            val loc = e.location ?: continue
            val latLng = withContext(Dispatchers.IO) { GeocodingService.geocodeAddress(context, loc) }
            if (latLng != null) {
                val f = Feature.fromGeometry(Point.fromLngLat(latLng.longitude, latLng.latitude)).apply {
                    addStringProperty("id", e.id)
                }
                feats.add(f)
            }
        }
        features = feats
        // Skipping style source/layer to avoid extra extensions; taps use nearest feature
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Карта", color = Color.White) },
        text = {
            if (true) {
                Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(600.dp)
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        try {
                            val mv = MapView(ctx)
                            mapView = mv
                            val mapboxMap = mv.mapboxMap
                            mapboxMap.loadStyleUri(Style.MAPBOX_STREETS) {
                                // Center to Moscow or first feature
                                val center = features.firstOrNull()?.geometry() as? Point
                                val camera = if (center != null) {
                                    CameraOptions.Builder().center(center).zoom(12.0).build()
                                } else {
                                    CameraOptions.Builder().center(Point.fromLngLat(37.6176, 55.7558)).zoom(10.0).build()
                                }
                                mapboxMap.setCamera(camera)

                                // Add GeoJSON source + simple circle layer for event markers
                                try {
                                    if (it.getSource(sourceId) == null) {
                                        it.addSource(
                                            geoJsonSource(sourceId) {
                                                featureCollection(FeatureCollection.fromFeatures(features))
                                            }
                                        )
                                    } else {
                                        it.getSourceAs<GeoJsonSource>(sourceId)?.featureCollection(
                                            FeatureCollection.fromFeatures(features)
                                        )
                                    }

                                    if (it.getLayer(layerId) == null) {
                                        it.addLayer(
                                            circleLayer(layerId, sourceId) {
                                                circleRadius(6.0)
                                                circleColor("#FF00E5FF")
                                                circleStrokeColor("#FFFFFFFF")
                                                circleStrokeWidth(1.5)
                                            }
                                        )
                                    }
                                } catch (e: Throwable) {
                                    android.util.Log.e("EventsMapDialog", "Failed to add markers: ${e.message}")
                                }
                            }
                            mapboxMap.addOnMapClickListener { point ->
                                // Find nearest feature (simple search)
                                val nearest = features.minByOrNull { f ->
                                    val p = f.geometry() as? Point
                                    if (p == null) Double.MAX_VALUE else haversine(p.latitude(), p.longitude(), point.latitude(), point.longitude())
                                }
                                val id = nearest?.getStringProperty("id")
                                id?.let { idToEvent[it] }?.let { ev -> onSelectEvent(ev) }
                                true
                            }
                            mv
                        } catch (e: Throwable) {
                            android.util.Log.e("EventsMapDialog", "MapView init failed: ${e.message}")
                            android.view.View(ctx).apply {
                                setBackgroundColor(0xFF2A2A2A.toInt())
                            }
                        }
                    }
                )
            }
            } else {
                // Fallback placeholder
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(500.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF2A2A2A))
                ) {
                    Text(
                        text = "Карта временно недоступна",
                        color = Color.White,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Закрыть", color = Color.White) }
        },
        containerColor = Color(0xFF1A1A1A),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )

    // Update markers dynamically when events/features change
    LaunchedEffect(features) {
        val currentMap = mapView?.mapboxMap ?: return@LaunchedEffect
        currentMap.getStyle { styleObj ->
            try {
                styleObj.getSourceAs<GeoJsonSource>(sourceId)?.featureCollection(
                    FeatureCollection.fromFeatures(features)
                )
            } catch (e: Throwable) {
                android.util.Log.e("EventsMapDialog", "Failed to update markers: ${e.message}")
            }
        }
    }
}

private fun Color.toArgb(): String = String.format("#%06X", 0xFFFFFF and this.value.toInt())

private fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val R = 6371e3
    val p1 = Math.toRadians(lat1)
    val p2 = Math.toRadians(lat2)
    val dp = Math.toRadians(lat2 - lat1)
    val dl = Math.toRadians(lon2 - lon1)
    val a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2)
    val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
}


