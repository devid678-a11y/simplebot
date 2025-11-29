package com.mindfulgate.ui.screens

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mindfulgate.data.Layout
import com.mindfulgate.data.LayoutElement
import com.mindfulgate.data.MindfulRepository
import com.mindfulgate.data.TextStyle
import com.mindfulgate.ui.components.DraggableElement
import com.mindfulgate.ui.components.DrawingCanvas
import com.mindfulgate.ui.components.TextEditor
import java.util.UUID

@Composable
fun EditorScreen(
    onSave: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { MindfulRepository(context) }
    
    var elements by remember { mutableStateOf(repository.loadLayout()?.elements ?: emptyList()) }
    var selectedElementId by remember { mutableStateOf<String?>(null) }
    var isDrawingMode by remember { mutableStateOf(false) }
    var showTextEditor by remember { mutableStateOf(false) }
    
    val selectedElement = elements.find { it.id == selectedElementId }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Панель инструментов
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(
                onClick = { showTextEditor = true }
            ) {
                Text("Текст")
            }
            
            Button(
                onClick = {
                    // Добавить изображение
                    val newElement = LayoutElement(
                        id = UUID.randomUUID().toString(),
                        type = LayoutElement.ElementType.IMAGE,
                        x = 100f,
                        y = 100f,
                        width = 200f,
                        height = 200f
                    )
                    elements = elements + newElement
                }
            ) {
                Text("Изображение")
            }
            
            Button(
                onClick = { isDrawingMode = !isDrawingMode },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isDrawingMode) Color.White else Color.White.copy(alpha = 0.3f),
                    contentColor = if (isDrawingMode) Color.Black else Color.White
                )
            ) {
                Text("Рисовать")
            }
        }
        
        // Область редактирования
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Canvas для рисования (поверх всего)
            DrawingCanvas(
                isDrawingEnabled = isDrawingMode,
                strokeColor = Color.White,
                strokeWidth = 4f,
                modifier = Modifier.fillMaxSize()
            )
            
            // Отображаем элементы с возможностью перетаскивания
            elements.forEach { element ->
                if (element.type != LayoutElement.ElementType.DRAWING) {
                    DraggableElement(
                        element = element,
                        onPositionChange = { id, x, y ->
                            elements = elements.map {
                                if (it.id == id) it.copy(x = x, y = y) else it
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
        
        // Кнопка сохранения
        Button(
            onClick = {
                repository.saveLayout(Layout(elements = elements))
                onSave()
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text("Сохранить")
        }
    }
    
    // Диалог редактирования текста
    if (showTextEditor) {
        var text by remember { mutableStateOf("") }
        var style by remember { mutableStateOf(TextStyle()) }
        
        AlertDialog(
            onDismissRequest = { showTextEditor = false },
            title = { Text("Добавить текст") },
            text = {
                TextEditor(
                    text = text,
                    style = style,
                    onTextChange = { text = it },
                    onStyleChange = { style = it }
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val newElement = LayoutElement(
                            id = UUID.randomUUID().toString(),
                            type = LayoutElement.ElementType.TEXT,
                            x = 100f,
                            y = 100f,
                            content = text,
                            style = style
                        )
                        elements = elements + newElement
                        showTextEditor = false
                    }
                ) {
                    Text("Добавить")
                }
            },
            dismissButton = {
                TextButton(onClick = { showTextEditor = false }) {
                    Text("Отмена")
                }
            }
        )
    }
}

