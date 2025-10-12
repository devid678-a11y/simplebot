package com.company.dvizhtrue.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

// Современные молодежные формы с различными уровнями скругления
val Shapes = Shapes(
    // Маленькие элементы - мягкие скругления
    small = RoundedCornerShape(8.dp),
    
    // Средние элементы - современные скругления
    medium = RoundedCornerShape(16.dp),
    
    // Большие элементы - выраженные скругления
    large = RoundedCornerShape(24.dp)
)
