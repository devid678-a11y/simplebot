package com.company.dvizhtrue.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    role: String = "guest",
    onNavigateToMyEvents: () -> Unit = {},
    onNavigateToMyCommunities: () -> Unit = {},
    onCreateCommunity: () -> Unit = {},
    onJoinCommunity: () -> Unit = {}
) {
    val scrollState = rememberScrollState()
    
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Профиль", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Назад", tint = Color.White)
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color(0xFF0A0A0A)
                )
            )
        },
        containerColor = Color(0xFF0A0A0A)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            // Аватар и основная информация
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Аватар
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF333333)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.Person,
                            contentDescription = "Аватар",
                            tint = Color.White,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = if (role == "community") "Сообщество" else "Гость",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    
                    Text(
                        text = if (role == "community") "Управляйте своими событиями" else "Просматривайте мероприятия",
                        fontSize = 14.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
            
            // Статистика убрана
            
            // Меню настроек
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column {
                    MenuItem(
                        title = "Мои события",
                        icon = Icons.Filled.Event,
                        onClick = { onNavigateToMyEvents() }
                    )
                    
                    MenuItem(
                        title = "Мои сообщества",
                        icon = Icons.Filled.Group,
                        onClick = { onNavigateToMyCommunities() }
                    )
                    
                    MenuItem(
                        title = "Создать сообщество",
                        icon = Icons.Filled.Add,
                        onClick = { onCreateCommunity() }
                    )
                    
                    MenuItem(
                        title = "Присоединиться к сообществу",
                        icon = Icons.Filled.GroupAdd,
                        onClick = { onJoinCommunity() }
                    )
                    
                    if (role == "community") {
                        MenuItem(
                            title = "Черновики",
                            icon = Icons.Filled.Edit,
                            onClick = { /* TODO */ }
                        )
                        
                        MenuItem(
                            title = "Аналитика",
                            icon = Icons.Filled.Analytics,
                            onClick = { /* TODO */ }
                        )
                    }
                    
                    MenuItem(
                        title = "Уведомления",
                        icon = Icons.Filled.Notifications,
                        onClick = { /* TODO */ }
                    )
                    
                    MenuItem(
                        title = "Настройки",
                        icon = Icons.Filled.Settings,
                        onClick = { /* TODO */ }
                    )
                    
                    MenuItem(
                        title = "О приложении",
                        icon = Icons.Filled.Info,
                        onClick = { /* TODO */ }
                    )
                }
            }
            
            // Выход
            if (role == "community") {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1A1A)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    MenuItem(
                        title = "Выйти",
                        icon = Icons.Filled.ExitToApp,
                        onClick = { /* TODO */ },
                        textColor = Color(0xFFFF6B6B)
                    )
                }
            }
        }
    }
}

// StatItem удалена - статистика убрана

@Composable
private fun MenuItem(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    textColor: Color = Color.White
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = title,
            tint = Color(0xFF00E5FF),
            modifier = Modifier.size(20.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Text(
            text = title,
            fontSize = 16.sp,
            color = textColor
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        Icon(
            Icons.Filled.ChevronRight,
            contentDescription = "Перейти",
            tint = Color.Gray,
            modifier = Modifier.size(16.dp)
        )
    }
}
