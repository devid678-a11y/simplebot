package com.company.dvizhtrue.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import coil.compose.AsyncImage
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.layout.ContentScale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateCommunityScreen(
    onBack: () -> Unit,
    onCommunityCreated: () -> Unit
) {
    val vm: MainViewModel = viewModel()
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val screen by vm.screen.collectAsState()
    val creating by vm.creatingCommunity.collectAsState()
    val error by vm.createCommunityError.collectAsState()
    val avatarUri by vm.newCommunityAvatarUri.collectAsState()

    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        vm.setNewCommunityAvatar(uri)
    }
    // Если мы ушли с экрана создания — сбрасываем лоадер
    LaunchedEffect(screen) {
        if (screen !is RootScreen.CreateCommunity) {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Создать сообщество", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
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
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Text(
                text = "Создайте свое сообщество",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = "Организуйте мероприятия, приглашайте участников и управляйте событиями",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Name input
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Название сообщества", color = Color.White) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF00E5FF),
                    unfocusedBorderColor = Color(0xFF555555),
                    focusedLabelColor = Color(0xFF00E5FF),
                    unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
                ),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                singleLine = true
            )

            // Description input
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Описание", color = Color.White) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF00E5FF),
                    unfocusedBorderColor = Color(0xFF555555),
                    focusedLabelColor = Color(0xFF00E5FF),
                    unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
                ),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                maxLines = 4
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Features info
            Text(
                text = "Аватар сообщества",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(36.dp))
                        .background(Color(0xFF333333)),
                    contentAlignment = Alignment.Center
                ) {
                    if (avatarUri != null) {
                        AsyncImage(
                            model = avatarUri,
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White.copy(alpha = 0.6f))
                    }
                }
                OutlinedButton(onClick = { pickImage.launch("image/*") }) {
                    Text(if (avatarUri != null) "Изменить аватар" else "Выбрать аватар")
                }
                if (avatarUri != null) {
                    TextButton(onClick = { vm.setNewCommunityAvatar(null) }) {
                        Text("Убрать", color = Color.White)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Features info
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Возможности сообщества:",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold
                    )
                    
                    Text("• Создание и управление событиями", color = Color.White.copy(alpha = 0.8f))
                    Text("• Приглашение участников по коду", color = Color.White.copy(alpha = 0.8f))
                    Text("• Просмотр статистики посещений", color = Color.White.copy(alpha = 0.8f))
                    Text("• Управление участниками", color = Color.White.copy(alpha = 0.8f))
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Create button
            if (!error.isNullOrBlank()) {
                Text(
                    text = error!!,
                    color = Color(0xFFFF7373)
                )
            }

            Button(
                onClick = {
                    if (name.isNotBlank() && description.isNotBlank()) {
                        isLoading = true
                        vm.createCommunity(name.trim(), description.trim())
                    }
                },
                enabled = name.isNotBlank() && description.isNotBlank() && !creating,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF00E5FF),
                    disabledContainerColor = Color(0xFF333333)
                ),
                shape = RoundedCornerShape(28.dp)
            ) {
                if (creating) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                } else {
                    Text(
                        text = "Создать сообщество",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}


