package ru.almazmanager.app.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AlmazDarkColors = darkColorScheme(
    primary = Color(0xFF4AA6FF), onPrimary = Color(0xFF07111D),
    secondary = Color(0xFF64D9A4), background = Color(0xFF0B0F15),
    onBackground = Color(0xFFE9EDF4), surface = Color(0xFF111722),
    onSurface = Color(0xFFE9EDF4), surfaceVariant = Color(0xFF18202C),
    onSurfaceVariant = Color(0xFFA8B1C0), error = Color(0xFFFF7F8B),
)

private val AlmazLightColors = lightColorScheme(
    primary = Color(0xFF2563D9), onPrimary = Color.White,
    secondary = Color(0xFF168A58), background = Color(0xFFF0F3F7),
    onBackground = Color(0xFF172436), surface = Color.White,
    onSurface = Color(0xFF1F2D3D), surfaceVariant = Color(0xFFE5EAF0),
    onSurfaceVariant = Color(0xFF5E6C7D), error = Color(0xFFC93645),
)

@Composable
fun AlmazManagerTheme(
    themeMode: String = "System",
    content: @Composable () -> Unit,
) {
    val dark = when (themeMode) {
        "Dark" -> true
        "Light" -> false
        else -> isSystemInDarkTheme()
    }

    MaterialTheme(
        colorScheme = if (dark) AlmazDarkColors else AlmazLightColors,
        content = content,
    )
}
