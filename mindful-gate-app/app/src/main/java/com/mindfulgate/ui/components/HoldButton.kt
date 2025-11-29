package com.mindfulgate.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun HoldButton(
    onComplete: () -> Unit,
    durationSeconds: Int = 7,
    modifier: Modifier = Modifier
) {
    var isHolding by remember { mutableStateOf(false) }
    var progress by remember { mutableStateOf(0f) }
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 100),
        label = "progress"
    )
    val scope = rememberCoroutineScope()
    
    val size = 96.dp
    val strokeWidth = 8.dp
    val primaryColor = MaterialTheme.colorScheme.primary
    
    Box(
        modifier = modifier
            .size(size)
            .pointerInput(Unit) {
                awaitEachGesture {
                    val down = awaitFirstDown()
                    isHolding = true
                    progress = 0f
                    
                    var job: Job? = null
                    job = scope.launch {
                        val duration = durationSeconds * 1000L
                        val step = 16L // ~60fps
                        val increment = step.toFloat() / duration
                        
                        while (isHolding && progress < 1f) {
                            delay(step)
                            progress += increment
                            if (progress >= 1f) {
                                progress = 1f
                                onComplete()
                                isHolding = false
                            }
                        }
                    }
                    
                    waitForUpOrCancellation()
                    job?.cancel()
                    isHolding = false
                    progress = 0f
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            val canvasSize = size.toPx()
            val center = Offset(canvasSize / 2, canvasSize / 2)
            val radius = (canvasSize - strokeWidth.toPx()) / 2
            
            // Background circle
            drawCircle(
                color = Color.White.copy(alpha = 0.3f),
                radius = radius,
                center = center,
                style = Stroke(width = strokeWidth.toPx())
            )
            
            // Progress arc
            if (animatedProgress > 0f) {
                val sweepAngle = 360f * animatedProgress
                drawArc(
                    color = Color.White,
                    startAngle = -90f,
                    sweepAngle = sweepAngle,
                    useCenter = false,
                    topLeft = Offset(center.x - radius, center.y - radius),
                    size = Size(radius * 2, radius * 2),
                    style = Stroke(
                        width = strokeWidth.toPx(),
                        cap = StrokeCap.Round
                    )
                )
            }
        }
        
        Column(
            modifier = Modifier,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = if (progress >= 1f) "✓" else "ПРОДОЛЖИТЬ",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                color = if (isHolding) Color.White else Color.White.copy(alpha = 0.6f)
            )
            if (isHolding && progress < 1f) {
                val remaining = ((durationSeconds * 1000) * (1f - progress)).toInt() / 1000
                Text(
                    text = "${remaining + 1}с",
                    fontSize = 10.sp,
                    color = Color.White
                )
            }
        }
    }
}

