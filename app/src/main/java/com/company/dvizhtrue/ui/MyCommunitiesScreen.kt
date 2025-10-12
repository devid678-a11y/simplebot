package com.company.dvizhtrue.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.company.dvizhtrue.data.Community
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyCommunitiesScreen(
    onBack: () -> Unit,
    onCreateCommunity: () -> Unit,
    onJoinCommunity: () -> Unit,
    onCommunityManagement: (String) -> Unit
) {
    val vm: MainViewModel = viewModel()
    val userCommunities by vm.userCommunities.collectAsState()
    val currentCommunity by vm.currentCommunity.collectAsState()

    LaunchedEffect(Unit) {
        vm.loadUserCommunities()
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Мои сообщества", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = onJoinCommunity) {
                        Icon(Icons.Filled.GroupAdd, contentDescription = "Присоединиться", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color(0xFF0A0A0A)
                )
            )
        },
        containerColor = Color(0xFF0A0A0A),
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateCommunity,
                containerColor = Color(0xFF00E5FF),
                contentColor = Color.White
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Создать сообщество")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (userCommunities.isEmpty()) {
                // Empty state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Icon(
                            Icons.Filled.Group,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.5f),
                            modifier = Modifier.size(64.dp)
                        )
                        Text(
                            text = "У вас пока нет сообществ",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Создайте свое первое сообщество или присоединитесь к существующему",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(userCommunities, key = { it.id }) { community ->
                        CommunityItem(
                            community = community,
                            isCurrent = currentCommunity?.id == community.id,
                            onSwitchTo = { vm.switchToCommunity(community) },
                            onManage = { onCommunityManagement(community.id) },
                            onLeave = { vm.leaveCommunity(community.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CommunityItem(
    community: Community,
    isCurrent: Boolean,
    onSwitchTo: () -> Unit,
    onManage: () -> Unit,
    onLeave: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    val isOwner = community.memberIds.isEmpty() || community.memberIds.firstOrNull() == community.ownerId

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSwitchTo() },
        colors = CardDefaults.cardColors(
            containerColor = if (isCurrent) Color(0xFF1A3A5C) else Color(0xFF1A1A1A)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = community.name,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    if (community.description.isNotBlank()) {
                        Text(
                            text = community.description,
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 14.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(
                            Icons.Filled.MoreVert,
                            contentDescription = "Меню",
                            tint = Color.White
                        )
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false },
                        modifier = Modifier.background(Color(0xFF2A2A2A))
                    ) {
                        if (isCurrent) {
                            DropdownMenuItem(
                                text = { Text("Текущее сообщество", color = Color.White) },
                                onClick = { showMenu = false },
                                enabled = false
                            )
                        } else {
                            DropdownMenuItem(
                                text = { Text("Переключиться", color = Color.White) },
                                onClick = {
                                    onSwitchTo()
                                    showMenu = false
                                }
                            )
                        }
                        
                        if (isOwner) {
                            DropdownMenuItem(
                                text = { Text("Управление", color = Color.White) },
                                onClick = {
                                    onManage()
                                    showMenu = false
                                }
                            )
                        }
                        
                        DropdownMenuItem(
                            text = { Text("Покинуть", color = Color.Red) },
                            onClick = {
                                onLeave()
                                showMenu = false
                            }
                        )
                    }
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Filled.People,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "${community.memberIds.size + 1} участников",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Filled.CalendarToday,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = SimpleDateFormat("dd.MM.yyyy", Locale.getDefault())
                            .format(Date(community.createdAt)),
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp
                    )
                }

                if (isCurrent) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF00E5FF))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Активно",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}


