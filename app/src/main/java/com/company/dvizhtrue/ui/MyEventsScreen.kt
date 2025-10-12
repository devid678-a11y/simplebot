package com.company.dvizhtrue.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.company.dvizhtrue.data.Event
import com.company.dvizhtrue.data.AttendanceRepository
import com.company.dvizhtrue.data.AttendanceLocalRepository
import com.company.dvizhtrue.data.EventsRepository
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyEventsScreen(
    onBack: () -> Unit
) {
    val vm: HomeViewModel = viewModel()
    // AttendanceRepository - это object, не нужно создавать экземпляр
    
    // Получаем события, на которые пользователь записался
    var myEvents by remember { mutableStateOf<List<Event>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    
    LaunchedEffect(Unit) {
        try {
            // Получаем ID событий из локального хранилища (для гостей)
            val localEventIds = AttendanceLocalRepository.getAllEventIds()
            android.util.Log.d("MyEventsScreen", "Local event IDs: $localEventIds")
            
            // Получаем ID событий из Firestore (для авторизованных пользователей)
            val remoteEventIds = AttendanceRepository.getAttendedEventIds()
            android.util.Log.d("MyEventsScreen", "Remote event IDs: $remoteEventIds")
            
            // Объединяем локальные и удаленные ID
            val allEventIds = (localEventIds + remoteEventIds).distinct()
            android.util.Log.d("MyEventsScreen", "All event IDs: $allEventIds")
            
            // Получаем полную информацию о событиях
            val events = mutableListOf<Event>()
            for (eventId in allEventIds) {
                try {
                    val eventResult = EventsRepository.getEventById(eventId)
                    if (eventResult.isSuccess) {
                        eventResult.getOrNull()?.let { event ->
                            events.add(event)
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("MyEventsScreen", "Error getting event $eventId", e)
                }
            }
            
            myEvents = events
            isLoading = false
            android.util.Log.d("MyEventsScreen", "Loaded ${events.size} events")
        } catch (e: Exception) {
            android.util.Log.e("MyEventsScreen", "Error loading events", e)
            isLoading = false
        }
    }
    
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Мои события", color = Color.White) },
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
        ) {
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF00E5FF))
                }
            } else if (myEvents.isEmpty()) {
                // Пустое состояние
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Filled.EventBusy,
                            contentDescription = "Нет событий",
                            tint = Color.Gray,
                            modifier = Modifier.size(64.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "Вы еще не записались ни на одно событие",
                            fontSize = 16.sp,
                            color = Color.Gray,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "Нажмите \"Я иду\" на интересном мероприятии",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(myEvents) { event ->
                        MyEventItem(event = event)
                    }
                }
            }
        }
    }
}

@Composable
private fun MyEventItem(event: Event) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* TODO: Открыть детали события */ },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Заголовок и статус
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = event.title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.weight(1f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                
                // Статус записи
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF00E5FF)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Я иду",
                        fontSize = 12.sp,
                        color = Color.Black,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Дата и время
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Filled.Schedule,
                    contentDescription = "Время",
                    tint = Color(0xFF00E5FF),
                    modifier = Modifier.size(16.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = formatEventDate(event.startAtMillis),
                    fontSize = 14.sp,
                    color = Color.Gray
                )
            }
            
            // Местоположение
            if (event.location != null) {
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.LocationOn,
                        contentDescription = "Место",
                        tint = Color(0xFF00E5FF),
                        modifier = Modifier.size(16.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Text(
                        text = event.location,
                        fontSize = 14.sp,
                        color = Color.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            // Цена
            if (event.price != null) {
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.AttachMoney,
                        contentDescription = "Цена",
                        tint = Color(0xFF00E5FF),
                        modifier = Modifier.size(16.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Text(
                        text = if (event.isFree) "Бесплатно" else "${event.price.toInt()} ₽",
                        fontSize = 14.sp,
                        color = Color.Gray
                    )
                }
            }
            
            // Категории
            if (event.categories.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.Tag,
                        contentDescription = "Категории",
                        tint = Color(0xFF00E5FF),
                        modifier = Modifier.size(16.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Text(
                        text = event.categories.joinToString(", "),
                        fontSize = 14.sp,
                        color = Color.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

private fun formatEventDate(timestamp: Long): String {
    val date = Date(timestamp)
    val formatter = SimpleDateFormat("dd MMM, HH:mm", Locale("ru"))
    return formatter.format(date)
}
