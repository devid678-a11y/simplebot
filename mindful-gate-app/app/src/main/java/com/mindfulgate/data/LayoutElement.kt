package com.mindfulgate.data

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight

data class LayoutElement(
    val id: String,
    val type: ElementType,
    val x: Float,
    val y: Float,
    val width: Float = 0f,
    val height: Float = 0f,
    val content: String = "",
    val style: TextStyle = TextStyle(),
    val imageUri: String? = null
) {
    enum class ElementType {
        TEXT,
        IMAGE,
        DRAWING
    }
}

data class TextStyle(
    val fontSize: Float = 16f,
    val fontWeight: FontWeight = FontWeight.Normal,
    val color: Color = Color.White,
    val fontFamily: String? = null
)

data class Layout(
    val elements: List<LayoutElement> = emptyList(),
    val backgroundColor: Color = Color.Black
)

