package com.company.dvizhtrue.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Современная молодежная темная палитра
private val DarkColorScheme = darkColorScheme(
    // Основные цвета - неоновые акценты
    primary = Color(0xFF00E5FF), // Неоновый голубой
    onPrimary = Color.Black,
    primaryContainer = Color(0xFF00B8D4), // Темно-голубой
    onPrimaryContainer = Color.White,
    
    // Вторичные цвета - яркие акценты
    secondary = Color(0xFFFF6B9D), // Неоновый розовый
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFFE91E63), // Розовый
    onSecondaryContainer = Color.White,
    
    // Третичные цвета - энергетичные
    tertiary = Color(0xFFFFD600), // Неоновый желтый
    onTertiary = Color.Black,
    tertiaryContainer = Color(0xFFFFB300), // Янтарный
    onTertiaryContainer = Color.Black,
    
    // Фоновые цвета - глубокие темные
    background = Color(0xFF0A0A0A), // Почти черный
    onBackground = Color(0xFFF5F5F5), // Почти белый
    surface = Color(0xFF1A1A1A), // Темно-серый
    onSurface = Color(0xFFF5F5F5),
    surfaceVariant = Color(0xFF2A2A2A), // Средне-серый
    onSurfaceVariant = Color(0xFFE0E0E0),
    
    // Границы и контуры
    outline = Color(0xFF404040), // Серый
    outlineVariant = Color(0xFF2A2A2A), // Темно-серый
    
    // Ошибки
    error = Color(0xFFFF5252), // Неоновый красный
    onError = Color.Black,
    errorContainer = Color(0xFFD32F2F), // Темно-красный
    onErrorContainer = Color.White,
    
    // Дополнительные акценты
    inversePrimary = Color(0xFF00B8D4),
    inverseSurface = Color(0xFFF5F5F5),
    inverseOnSurface = Color(0xFF1A1A1A),
    surfaceTint = Color(0xFF00E5FF),
    scrim = Color(0xFF000000)
)

// Светлая тема (для полноты, хотя основная - темная)
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF00B8D4),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF00E5FF),
    onPrimaryContainer = Color.Black,
    
    secondary = Color(0xFFE91E63),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFF6B9D),
    onSecondaryContainer = Color.Black,
    
    tertiary = Color(0xFFFFB300),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFD600),
    onTertiaryContainer = Color.Black,
    
    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF1A1A1A),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF1A1A1A),
    surfaceVariant = Color(0xFFF5F5F5),
    onSurfaceVariant = Color(0xFF2A2A2A),
    
    outline = Color(0xFFE0E0E0),
    outlineVariant = Color(0xFFF5F5F5),
    
    error = Color(0xFFD32F2F),
    onError = Color.White,
    errorContainer = Color(0xFFFF5252),
    onErrorContainer = Color.Black,
    
    inversePrimary = Color(0xFF00E5FF),
    inverseSurface = Color(0xFF1A1A1A),
    inverseOnSurface = Color(0xFFF5F5F5),
    surfaceTint = Color(0xFF00B8D4),
    scrim = Color(0xFF000000)
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            // Устанавливаем прозрачный статус бар для современного вида
            window.statusBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
