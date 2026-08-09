package ru.almazmanager.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AlmazDarkColors = darkColorScheme(
    primary = Color(0xFF4AA6FF),
    onPrimary = Color(0xFF07111D),
    secondary = Color(0xFF64D9A4),
    background = Color(0xFF0B0F15),
    onBackground = Color(0xFFE9EDF4),
    surface = Color(0xFF111722),
    onSurface = Color(0xFFE9EDF4),
    surfaceVariant = Color(0xFF18202C),
    onSurfaceVariant = Color(0xFFA8B1C0),
    error = Color(0xFFFF7F8B),
)

@Composable
fun AlmazManagerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AlmazDarkColors,
        content = content,
    )
}
