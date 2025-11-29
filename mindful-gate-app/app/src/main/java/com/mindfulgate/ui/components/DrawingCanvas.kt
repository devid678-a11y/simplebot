package com.mindfulgate.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput

@Composable
fun DrawingCanvas(
    isDrawingEnabled: Boolean,
    strokeColor: Color = Color.Black,
    strokeWidth: Float = 4f,
    onPathDrawn: (Path) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var currentPath by remember { mutableStateOf<Path?>(null) }
    var paths by remember { mutableStateOf<List<Path>>(emptyList()) }
    
    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(isDrawingEnabled) {
                if (isDrawingEnabled) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            currentPath = Path().apply {
                                moveTo(offset.x, offset.y)
                            }
                        },
                        onDrag = { change, _ ->
                            currentPath?.let { path ->
                                path.lineTo(change.position.x, change.position.y)
                            }
                        },
                        onDragEnd = {
                            currentPath?.let { path ->
                                paths = paths + path
                                onPathDrawn(path)
                                currentPath = null
                            }
                        }
                    )
                }
            }
    ) {
        // Рисуем все сохраненные пути
        paths.forEach { path ->
            drawPath(
                path = path,
                color = strokeColor,
                style = androidx.compose.ui.graphics.drawscope.Stroke(
                    width = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            )
        }
        
        // Рисуем текущий путь
        currentPath?.let { path ->
            drawPath(
                path = path,
                color = strokeColor,
                style = androidx.compose.ui.graphics.drawscope.Stroke(
                    width = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            )
        }
    }
}

