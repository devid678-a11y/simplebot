package com.company.dvizhtrue.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.company.dvizhtrue.data.Event
// Removed HomeScreenNew import to restore original HomeScreen flow

sealed class BottomNavItem(
    val title: String,
    val icon: ImageVector,
    val route: String
) {
    object MyEvents : BottomNavItem("Мои события", Icons.Filled.Event, "my_events")
    object Search : BottomNavItem("Найти", Icons.Filled.Search, "search")
    object Notifications : BottomNavItem("Уведомления", Icons.Filled.Notifications, "notifications")
    object Profile : BottomNavItem("Профиль", Icons.Filled.Person, "profile")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToGuestMyEvents: () -> Unit,
    onNavigateToMyEvents: () -> Unit = {},
    onNavigateToMyCommunities: () -> Unit = {},
    onCreateCommunity: () -> Unit = {},
    onJoinCommunity: () -> Unit = {},
    onNavigateToCommunityFeed: (String) -> Unit = {}
) {
    // Устанавливаем тёмный цвет статус-бара и навигационной панели
    val systemUiController = rememberSystemUiController()
    SideEffect {
        systemUiController.setStatusBarColor(Color(0xFF0A0A0A), darkIcons = false)
        systemUiController.setNavigationBarColor(Color(0xFF0A0A0A), darkIcons = false)
        systemUiController.setSystemBarsColor(Color(0xFF0A0A0A), darkIcons = false)
    }
    var selectedTab by remember { mutableStateOf(0) }
    var selectedEvent by remember { mutableStateOf<com.company.dvizhtrue.data.Event?>(null) }
    val vm: MainViewModel = viewModel()
    val role by vm.role.collectAsState()
    val safeRole = role ?: "guest"
    
    val bottomNavItems = listOf(
        BottomNavItem.MyEvents,
        BottomNavItem.Search,
        BottomNavItem.Notifications,
        BottomNavItem.Profile
    )
    
    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF0A0A0A),
                contentColor = Color.White
            ) {
                bottomNavItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { 
                            Icon(
                                item.icon, 
                                contentDescription = item.title,
                                tint = if (selectedTab == index) Color(0xFF00E5FF) else Color.Gray
                            ) 
                        },
                        label = { 
                            Text(
                                item.title,
                                color = if (selectedTab == index) Color(0xFF00E5FF) else Color.Gray,
                                style = MaterialTheme.typography.labelSmall
                            ) 
                        },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }
        },
        containerColor = Color(0xFF0A0A0A)
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedTab) {
                0 -> MyEventsScreen(onBack = { /* Bottom nav не нужен back */ }) // Мои события - индивидуальная лента
                    1 -> HomeScreen(
                        onNavigateToEventDetail = { event ->
                            android.util.Log.d("MainScreen", "Event selected: ${event.title}")
                            selectedEvent = event
                        }
                    ) // Найти - поиск мероприятий
                2 -> NotificationsScreen() // Уведомления
                3 -> ProfileScreen(
                    onBack = { /* Bottom nav не нужен back */ },
                    role = safeRole,
                    onNavigateToMyEvents = onNavigateToMyEvents,
                    onNavigateToMyCommunities = onNavigateToMyCommunities,
                    onCreateCommunity = onCreateCommunity,
                    onJoinCommunity = onJoinCommunity
                )
            }
            
            // Показываем детальную страницу события поверх основного контента
            selectedEvent?.let { event ->
                android.util.Log.d("MainScreen", "Showing EventDetailScreen for: ${event.title}")
                EventDetailScreen(
                    event = event,
                    onBack = { 
                        android.util.Log.d("MainScreen", "Closing EventDetailScreen")
                        selectedEvent = null 
                    }
                )
            }
            
            // Удалена временная тестовая кнопка, чтобы FAB на экране поиска открывал окно создания
        }
    }
}

@Composable
fun NotificationsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Filled.Notifications,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Color.Gray
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Уведомления",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Здесь будут ваши уведомления",
            style = MaterialTheme.typography.bodyLarge,
            color = Color.Gray
        )
    }
}