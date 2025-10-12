package com.company.dvizhtrue.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.FabPosition
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.company.dvizhtrue.data.Event
import com.company.dvizhtrue.data.EventsRepository
import com.company.dvizhtrue.ui.components.GradientCard
import com.company.dvizhtrue.ui.components.LocationPickerDialog
import com.company.dvizhtrue.ui.formatTime
import com.company.dvizhtrue.ui.formatRelativeTime
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.google.android.gms.maps.model.LatLng
import androidx.compose.ui.platform.LocalContext
import java.util.Calendar
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreenNew(
    onNavigateToEventDetail: (Event) -> Unit = {},
    onNavigateToCommunityFeed: (String) -> Unit = {},
    onCreateEvent: () -> Unit = {}
) {
    val systemUiController = rememberSystemUiController()
    SideEffect {
        systemUiController.setStatusBarColor(Color.Black, darkIcons = false)
    }

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Все") }
    var showLocationPicker by remember { mutableStateOf(false) }
    var selectedLocation by remember { mutableStateOf("Москва") }
    var showFilters by remember { mutableStateOf(false) }

    val categories = listOf("Все", "Технологии", "Фотография", "Бизнес", "Здоровье", "Социальные")

    val filteredEvents by remember(searchQuery, selectedCategory, selectedLocation) {
        derivedStateOf {
            // TODO: Replace with actual events from repository
            emptyList<Event>()
                .filter { event ->
                    val matchesSearch = searchQuery.isBlank() || 
                        event.title.contains(searchQuery, ignoreCase = true) ||
                        event.description?.contains(searchQuery, ignoreCase = true) == true
                    val matchesCategory = selectedCategory == "Все" || 
                        event.categories.contains(selectedCategory)
                    val matchesLocation = selectedLocation == "Москва" || 
                        event.location?.contains(selectedLocation, ignoreCase = true) == true
                    matchesSearch && matchesCategory && matchesLocation
                }
        }
    }

    val context = LocalContext.current
    var showCreateDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color.Black,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = Color(0xFF00E5FF),
                contentColor = Color.White,
                modifier = Modifier
                    .size(56.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = "Создать мероприятие",
                    modifier = Modifier.size(24.dp)
                )
            }
        },
        floatingActionButtonPosition = FabPosition.End
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .padding(innerPadding)
        ) {
        // Header with gradient title
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black)
                .padding(16.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Discover Events",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        modifier = Modifier.weight(1f)
                    )
                    
                    IconButton(
                        onClick = { showFilters = true },
                        modifier = Modifier
                            .background(
                                Color(0xFF1A1A1A),
                                RoundedCornerShape(12.dp)
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Filled.FilterList,
                            contentDescription = "Фильтры",
                            tint = Color(0xFF9CA3AF),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Search Bar with rounded design
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Color(0xFF1A1A1A),
                            RoundedCornerShape(24.dp)
                        )
                        .border(
                            1.dp,
                            Color(0xFF2A2A2A),
                            RoundedCornerShape(24.dp)
                        )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Search,
                            contentDescription = null,
                            tint = Color(0xFF6B7280),
                            modifier = Modifier.size(20.dp)
                        )
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        BasicTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            textStyle = TextStyle(
                                color = Color.White,
                                fontSize = 16.sp
                            ),
                            decorationBox = { innerTextField ->
                                if (searchQuery.isEmpty()) {
                                    Text(
                                        "Search events...",
                                        color = Color(0xFF6B7280),
                                        fontSize = 16.sp
                                    )
                                }
                                innerTextField()
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
        
        // Categories with horizontal scroll
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                Box(
                    modifier = Modifier
                        .background(
                            if (selectedCategory == category) {
                                Color(0xFF374151)
                            } else {
                                Color(0xFF1A1A1A)
                            },
                            RoundedCornerShape(24.dp)
                        )
                        .border(
                            1.dp,
                            if (selectedCategory == category) {
                                Color(0xFF4B5563)
                            } else {
                                Color(0xFF2A2A2A)
                            },
                            RoundedCornerShape(24.dp)
                        )
                        .clickable { selectedCategory = category }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = category,
                        color = if (selectedCategory == category) Color.White else Color(0xFF9CA3AF),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
            // Events List
            EventsListNew(
                events = filteredEvents,
                onNavigateToEventDetail = onNavigateToEventDetail,
                onNavigateToCommunityFeed = onNavigateToCommunityFeed
            )
        }
    }

    // Диалог выбора локации
    LocationPickerDialog(
        isVisible = showLocationPicker,
        onDismiss = { showLocationPicker = false },
        onLocationSelected = { location, _ ->
            selectedLocation = location
            showLocationPicker = false
        }
    )

    // Диалог фильтров
    if (showFilters) {
        AlertDialog(
            onDismissRequest = { showFilters = false },
            title = { Text("Фильтры", color = Color.White) },
            text = { Text("Фильтры в разработке", color = Color.White) },
            confirmButton = {
                TextButton(onClick = { showFilters = false }) {
                    Text("Закрыть", color = Color.White)
                }
            },
            containerColor = Color(0xFF1A1A1A),
            titleContentColor = Color.White,
            textContentColor = Color.White
        )
    }

    // Диалог создания события (используем существующий CreateEventDialog API из HomeScreen)
    if (showCreateDialog) {
        val titleState = remember { mutableStateOf("") }
        val chosenTimeMillis = remember { mutableStateOf<Long?>(null) }
        val isOnline = remember { mutableStateOf(false) }
        val isFree = remember { mutableStateOf(true) }
        val price = remember { mutableStateOf("") }
        val location = remember { mutableStateOf("") }

        CreateEventDialog(
            title = titleState.value,
            onTitleChange = { titleState.value = it },
            chosenTimeMillis = chosenTimeMillis.value,
            onPickDateTime = {
                pickDateTime(context) { picked -> chosenTimeMillis.value = picked }
            },
            isOnline = isOnline.value,
            onToggleOnline = { isOnline.value = it },
            isFree = isFree.value,
            onToggleFree = { isFree.value = it },
            price = price.value,
            onPriceChange = { price.value = it },
            location = location.value,
            onLocationChange = { location.value = it },
            imagesCount = 0,
            onAddImage = { },
            onRemoveLastImage = { },
            onDismiss = { showCreateDialog = false },
            onSave = {
                // Пока только закрываем. Интеграцию с VM можно добавить аналогично HomeScreen.
                showCreateDialog = false
            }
        )
    }
}

@Composable
fun EventsListNew(
    events: List<Event>,
    onNavigateToEventDetail: (Event) -> Unit = {},
    onNavigateToCommunityFeed: (String) -> Unit = {}
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(events, key = { it.id }) { event ->
            EventCardNew(
                event = event,
                onNavigateToEventDetail = onNavigateToEventDetail,
                onNavigateToCommunityFeed = onNavigateToCommunityFeed
            )
        }
        
        // Empty state
        if (events.isEmpty()) {
            item {
                EmptyStateCard()
            }
        }
    }
}

@Composable
fun EventCardNew(
    event: Event,
    onNavigateToEventDetail: (Event) -> Unit = {},
    onNavigateToCommunityFeed: (String) -> Unit = {}
) {
    var isLiked by remember { mutableStateOf(false) }
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1F1F1F),
                        Color(0xFF2A2A2A),
                        Color(0xFF1F1F1F)
                    )
                )
            )
            .border(
                1.dp,
                Color(0xFF2A2A2A),
                RoundedCornerShape(24.dp)
            )
            .clickable { onNavigateToEventDetail(event) }
    ) {
        Column {
            // Event Image placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(192.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFF2A2A2A),
                                Color(0xFF1F1F1F),
                                Color(0xFF2A2A2A)
                            )
                        )
                    )
            ) {
                // Like button
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .background(
                            Color.Black.copy(alpha = 0.6f),
                            RoundedCornerShape(20.dp)
                        )
                        .clickable { isLiked = !isLiked }
                        .padding(8.dp)
                ) {
                    Icon(
                        imageVector = if (isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Like",
                        tint = if (isLiked) Color(0xFFEF4444) else Color(0xFF9CA3AF),
                        modifier = Modifier.size(20.dp)
                    )
                }
                
                // Category chip
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .background(
                                Color(0xFF374151),
                                RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = event.categories.firstOrNull() ?: "Событие",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            // Event Details
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = event.title,
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                if (!event.description.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = event.description!!,
                        color = Color(0xFF9CA3AF),
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Event info
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Date and time
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Event,
                            contentDescription = null,
                            tint = Color(0xFF6B7280),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = formatRelativeTime(event.startAtMillis),
                            color = Color(0xFF9CA3AF),
                            fontSize = 14.sp
                        )
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Icon(
                            imageVector = Icons.Outlined.Schedule,
                            contentDescription = null,
                            tint = Color(0xFF6B7280),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = formatTime(event.startAtMillis),
                            color = Color(0xFF9CA3AF),
                            fontSize = 14.sp
                        )
                    }
                    
                    // Location
                    if (!event.location.isNullOrBlank()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.LocationOn,
                                contentDescription = null,
                                tint = Color(0xFF6B7280),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = event.location!!,
                                color = Color(0xFF9CA3AF),
                                fontSize = 14.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    
                    // Attendees
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.People,
                            contentDescription = null,
                            tint = Color(0xFF6B7280),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "0 attending", // TODO: Get real count
                            color = Color(0xFF9CA3AF),
                            fontSize = 14.sp
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // View Details button
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    Color(0xFF2A2A2A),
                                    Color(0xFF374151),
                                    Color(0xFF2A2A2A)
                                )
                            ),
                            RoundedCornerShape(24.dp)
                        )
                        .border(
                            1.dp,
                            Color(0xFF374151),
                            RoundedCornerShape(24.dp)
                        )
                        .clickable { onNavigateToEventDetail(event) },
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "View Details",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Outlined.ChevronRight,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyStateCard() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .background(
                    Color(0xFF1A1A1A),
                    RoundedCornerShape(48.dp)
                )
                .border(
                    1.dp,
                    Color(0xFF2A2A2A),
                    RoundedCornerShape(48.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outlined.Search,
                contentDescription = null,
                tint = Color(0xFF6B7280),
                modifier = Modifier.size(48.dp)
            )
        }
        
        Text(
            text = "No events found",
            color = Color(0xFF9CA3AF),
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold
        )
        
        Text(
            text = "Try adjusting your search or filters to find what you're looking for.",
            color = Color(0xFF6B7280),
            fontSize = 14.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}

// Helper functions - using formatTime from TimeUtils.kt
