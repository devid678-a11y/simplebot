package com.mindfulgate.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindfulgate.data.LayoutElement
import com.mindfulgate.data.MindfulRepository
import com.mindfulgate.ui.components.HoldButton

@Composable
fun MindfulPauseScreen(
    onProceed: () -> Unit,
    onSkip: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { MindfulRepository(context) }
    val layout = remember { repository.loadLayout() }
    val holdDuration = remember { repository.getHoldDuration() }
    
    var drawingPath by remember { mutableStateOf<Path?>(null) }
    var drawingPoints by remember { mutableStateOf<List<Offset>>(emptyList()) }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Свободная область для контента
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 120.dp)
        ) {
            // Отображаем сохраненные элементы
            layout?.elements?.forEach { element ->
                when (element.type) {
                    LayoutElement.ElementType.TEXT -> {
                        TextElement(element = element)
                    }
                    LayoutElement.ElementType.IMAGE -> {
                        ImageElement(element = element)
                    }
                    LayoutElement.ElementType.DRAWING -> {
                        // Рисунки отображаются через Canvas ниже
                    }
                }
            }
            
            // Canvas для отображения рисунков
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                // Можно добавить интерактивное рисование в будущем
                            },
                            onDrag = { change, _ ->
                                // Можно добавить интерактивное рисование в будущем
                            },
                            onDragEnd = {
                                // Можно добавить интерактивное рисование в будущем
                            }
                        )
                    }
            ) {
                // Рисуем сохраненные пути
                layout?.elements
                    ?.filter { it.type == LayoutElement.ElementType.DRAWING }
                    ?.forEach { element ->
                        // Восстанавливаем путь из content
                        // Здесь можно добавить парсинг сохраненных путей
                    }
            }
        }
        
        // Нижняя панель с кнопками
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(androidx.compose.ui.Alignment.BottomCenter)
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            // Кнопка "Закрыть"
            Button(
                onClick = onSkip,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = Color.Black
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    "ЗАКРЫТЬ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Кнопка "Продолжить" с таймером
            HoldButton(
                onComplete = onProceed,
                durationSeconds = holdDuration,
                modifier = Modifier.size(96.dp)
            )
        }
    }
}

@Composable
fun TextElement(element: LayoutElement) {
    Text(
        text = element.content,
        fontSize = element.style.fontSize.sp,
        fontWeight = element.style.fontWeight,
        color = element.style.color,
        modifier = Modifier
            .offset(x = element.x.dp, y = element.y.dp)
    )
}

@Composable
fun ImageElement(element: LayoutElement) {
    Box(
        modifier = Modifier
            .offset(x = element.x.dp, y = element.y.dp)
            .size(element.width.dp, element.height.dp)
            .background(Color.White.copy(alpha = 0.3f))
    )
}

