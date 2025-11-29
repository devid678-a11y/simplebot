package com.mindfulgate.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindfulgate.data.TextStyle

@Composable
fun TextEditor(
    text: String,
    style: TextStyle,
    onTextChange: (String) -> Unit,
    onStyleChange: (TextStyle) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = text,
            onValueChange = onTextChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Текст") }
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Размер шрифта
            Column {
                Text("Размер: ${style.fontSize.toInt()}sp")
                Slider(
                    value = style.fontSize,
                    onValueChange = { onStyleChange(style.copy(fontSize = it)) },
                    valueRange = 12f..48f,
                    modifier = Modifier.width(150.dp)
                )
            }
            
            // Жирность
            Column {
                Text("Жирность")
                Row {
                    Button(
                        onClick = { onStyleChange(style.copy(fontWeight = FontWeight.Normal)) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (style.fontWeight == FontWeight.Normal) 
                                Color.White else Color.White.copy(alpha = 0.3f),
                            contentColor = if (style.fontWeight == FontWeight.Normal) 
                                Color.Black else Color.White
                        )
                    ) {
                        Text("Обычный")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onStyleChange(style.copy(fontWeight = FontWeight.Bold)) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (style.fontWeight == FontWeight.Bold) 
                                Color.White else Color.White.copy(alpha = 0.3f),
                            contentColor = if (style.fontWeight == FontWeight.Bold) 
                                Color.Black else Color.White
                        )
                    ) {
                        Text("Жирный")
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Цвет
        Text("Цвет текста")
        Row {
            listOf(Color.White, Color(0xFFCCCCCC), Color(0xFF888888), Color(0xFF444444)).forEach { color ->
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(color)
                        .padding(4.dp)
                ) {
                    if (style.color == color) {
                        Text("✓", color = if (color == Color.White) Color.Black else Color.White)
                    }
                }
            }
        }
    }
}

