package com.ishark.bloodbanknankana.ui.theme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
private val Scheme = lightColorScheme(primary=Color(0xFFC1121F), onPrimary=Color.White, background=Color(0xFFFAF7F5), onBackground=Color(0xFF1B1B1B), surface=Color(0xFFFFFBF9), outline=Color(0xFFE3D9D6))
@Composable fun BloodBankTheme(content: @Composable () -> Unit) = MaterialTheme(colorScheme=Scheme, typography=Typography(), content=content)
