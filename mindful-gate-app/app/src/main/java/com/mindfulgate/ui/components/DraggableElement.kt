package com.mindfulgate.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindfulgate.data.LayoutElement

@Composable
fun DraggableElement(
    element: LayoutElement,
    onPositionChange: (String, Float, Float) -> Unit,
    modifier: Modifier = Modifier
) {
    var offsetX by remember { mutableStateOf(element.x) }
    var offsetY by remember { mutableStateOf(element.y) }
    
    Box(
        modifier = modifier
            .offset(x = offsetX.dp, y = offsetY.dp)
            .pointerInput(element.id) {
                detectDragGestures(
                    onDrag = { change, dragAmount ->
                        change.consume()
                        offsetX += dragAmount.x
                        offsetY += dragAmount.y
                        onPositionChange(element.id, offsetX, offsetY)
                    }
                )
            }
    ) {
        when (element.type) {
            LayoutElement.ElementType.TEXT -> {
                Text(
                    text = element.content.ifEmpty { "Текст" },
                    fontSize = element.style.fontSize.sp,
                    color = element.style.color,
                    modifier = Modifier
                        .background(Color.Transparent)
                        .padding(4.dp)
                )
            }
            LayoutElement.ElementType.IMAGE -> {
                Box(
                    modifier = Modifier
                        .size(
                            width = if (element.width > 0) element.width.dp else 100.dp,
                            height = if (element.height > 0) element.height.dp else 100.dp
                        )
                        .background(Color.White.copy(alpha = 0.3f))
                ) {
                    Text(
                        text = "Изображение",
                        modifier = Modifier.padding(8.dp),
                        color = androidx.compose.ui.graphics.Color.White
                    )
                }
            }
            LayoutElement.ElementType.DRAWING -> {
                // Рисунки обрабатываются отдельно
            }
        }
    }
}

