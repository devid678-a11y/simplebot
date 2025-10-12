package com.company.dvizhtrue.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.plugin.gestures.gestures
import com.mapbox.maps.plugin.gestures.addOnMapClickListener

private const val ENABLE_MAPBOX = true

@Composable
fun EventMapboxView(
    lat: Double,
    lon: Double,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    if (!ENABLE_MAPBOX) {
        Box(
            modifier = modifier
                .height(200.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF2A2A2A))
                .let { base -> if (onClick != null) base.clickable { onClick() } else base }
        )
        return
    }
    Box(
        modifier = modifier
            .height(200.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF2A2A2A))
            .let { base -> if (onClick != null) base.clickable { onClick() } else base }
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                try {
                    val mapView = MapView(ctx)
                    val mapboxMap = mapView.getMapboxMap()
                    mapboxMap.loadStyleUri(Style.MAPBOX_STREETS) {
                        mapboxMap.setCamera(
                            CameraOptions.Builder()
                                .center(Point.fromLngLat(lon, lat))
                                .zoom(12.0)
                                .build()
                        )
                        mapView.gestures.updateSettings {
                            rotateEnabled = false
                            pitchEnabled = false
                        }
                        if (onClick != null) {
                            mapboxMap.addOnMapClickListener {
                                onClick.invoke()
                                true
                            }
                        }
                    }
                    mapView
                } catch (e: Throwable) {
                    android.util.Log.e("EventMapboxView", "MapView init failed: ${e.message}")
                    android.view.View(ctx).apply { setBackgroundColor(0xFF2A2A2A.toInt()) }
                }
            }
        )
        Icon(
            imageVector = Icons.Filled.LocationOn,
            contentDescription = null,
            tint = Color(0xFF00E5FF),
            modifier = Modifier.align(Alignment.Center)
        )
    }
}


