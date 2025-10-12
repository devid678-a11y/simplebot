package com.company.dvizhtrue.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FabPosition
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SearchBar
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.zIndex
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.company.dvizhtrue.data.AttendanceRepository
import com.company.dvizhtrue.data.AuthRepository
import com.company.dvizhtrue.data.Event
import com.company.dvizhtrue.data.AttendanceLocalRepository
import com.company.dvizhtrue.ui.components.GradientButton
import com.company.dvizhtrue.ui.components.GradientCard
import com.company.dvizhtrue.ui.components.GradientChip
import com.company.dvizhtrue.ui.components.LocationPickerDialog
import com.company.dvizhtrue.ui.components.EventMapboxView
import com.company.dvizhtrue.ui.components.EventsMapDialog
import java.util.Calendar
import java.util.concurrent.TimeUnit
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import kotlinx.coroutines.withContext
import org.json.JSONObject
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import androidx.compose.foundation.shape.CircleShape
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.firebase.functions.ktx.functions
import com.google.firebase.Timestamp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToEventDetail: (Event) -> Unit = {}
) {
    val mainVm: MainViewModel = viewModel()
    val vm: HomeViewModel = viewModel()
    val role by mainVm.role.collectAsState()
    val events by vm.events.collectAsState()
    val message by vm.message.collectAsState()
    val uploadProgress by vm.uploadProgress.collectAsState()
    val uploadCounters by vm.uploadCounters.collectAsState()
    val saving by vm.saving.collectAsState()
    val refreshing by vm.refreshing.collectAsState()
    val hasNewEvents by vm.hasNewEvents.collectAsState()
    val newEventsCount by vm.newEventsCount.collectAsState()
    
    // Debug logging for saving state
    LaunchedEffect(saving) {
        android.util.Log.d("HomeScreen", "Saving state changed to: $saving")
    }
    
    // Add error handling for role
    val safeRole = role ?: "guest"

    val showDialog = remember { mutableStateOf(false) }
    val showCommunitySelector = remember { mutableStateOf(false) }
    val showLocationPicker = remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val savingStarted = remember { mutableStateOf(false) }
    val selectedCommunity = remember { mutableStateOf<com.company.dvizhtrue.data.Community?>(null) }
    val titleState = remember { mutableStateOf("") }
    val description = remember { mutableStateOf("") }
    val chosenTimeMillis = remember { mutableStateOf<Long?>(null) }
    val isOnline = remember { mutableStateOf(false) }
    val isFree = remember { mutableStateOf(true) }
    val price = remember { mutableStateOf("") }
    val location = remember { mutableStateOf("") }
    val selectedLocation = remember { mutableStateOf<com.google.android.gms.maps.model.LatLng?>(null) }

    val imageUrisState = remember { mutableStateOf<List<Uri>>(emptyList()) }
    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(5)
    ) { uris ->
        android.util.Log.d("HomeScreen", "Photo picker result: ${uris.size} photos selected")
        val merged = (imageUrisState.value + uris).distinct().take(5)
        android.util.Log.d("HomeScreen", "Merged photos: ${merged.size} total")
        imageUrisState.value = merged
        android.util.Log.d("HomeScreen", "Updated imageUrisState: ${imageUrisState.value.size} photos")
    }

    // Event creation categories
    val eventCreationCategories = remember { mutableStateOf<Set<String>>(emptySet()) }

    // Search & filters
    val searchQuery = remember { mutableStateOf("") }
    val filterToday = remember { mutableStateOf(false) }
    val filterTomorrow = remember { mutableStateOf(false) }
    val filterWeekend = remember { mutableStateOf(false) }
    val filterOnlyOnline = remember { mutableStateOf(false) }
    val filterOnlyFree = remember { mutableStateOf(false) }

    // Refresh button

    // Category filters
    val categories = listOf("Музыка","Спорт","Вечеринки","Образование","IT","Бизнес","Семья","Культура","Кино","Театр")
    val selectedCategories = remember { mutableStateOf<Set<String>>(emptySet()) }
    val categoryKeywords = remember {
        mapOf(
            "Музыка" to listOf("концерт","музыка","dj","диджей","песня","рок","рэп","фестиваль"),
            "Спорт" to listOf("спорт","турнир","пробег","йога","футбол","баскетбол","бег","тренировка"),
            "Вечеринки" to listOf("вечеринка","party","клуб","бар","night","вечер"),
            "Образование" to listOf("лекция","семинар","курс","обучение","мастер-класс","воркшоп","webinar","вебинар"),
            "IT" to listOf("it","айти","хакатон","программ","dev","frontend","backend","android","kotlin","ml","data"),
            "Бизнес" to listOf("бизнес","стартап","инвест","предприним","networking","нетворкинг"),
            "Семья" to listOf("семья","дети","семейный","детский","малыш","родители"),
            "Культура" to listOf("культура","музей","выставка","экскурсия","литература","поэзия"),
            "Кино" to listOf("кино","премьер","фильм","сеанс","кинопоказ"),
            "Театр" to listOf("театр","спектакль","постановка","сцена")
        )
    }

    // App bar actions state
    val menuExpanded = remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val showMapDialog = remember { mutableStateOf(false) }
    LaunchedEffect(message) {
        message?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            vm.consumeMessage()
        }
    }

    val context = LocalContext.current

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        floatingActionButton = {
            if (safeRole == "community") {
                FloatingActionButton(onClick = {
                    showCommunitySelector.value = true
                }) {
                    Icon(imageVector = Icons.Filled.Add, contentDescription = "Add")
                }
            }
        },
        floatingActionButtonPosition = FabPosition.Center,

    ) { innerPadding ->
        // Search bar state
        var isSearchFocused by remember { mutableStateOf(false) }
        
        Column(modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
            .clickable { 
                // Снимаем фокус с поля поиска при клике в любом месте
                isSearchFocused = false
            }
            .padding(innerPadding)) {
            
            // Заголовок экрана
            Text(
                text = "Лента",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(16.dp)
            )
            val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
            
            // Отслеживаем фокус
            LaunchedEffect(interactionSource) {
                interactionSource.interactions.collect { interaction ->
                    when (interaction) {
                        is androidx.compose.foundation.interaction.FocusInteraction.Focus -> {
                            isSearchFocused = true
                        }
                        is androidx.compose.foundation.interaction.FocusInteraction.Unfocus -> {
                            isSearchFocused = false
                        }
                    }
                }
            }
            
            val animatedScale by animateFloatAsState(
                targetValue = if (isSearchFocused) 1.02f else 1f,
                animationSpec = tween(200),
                label = "search_scale"
            )
            val animatedBorderColor by animateColorAsState(
                targetValue = if (isSearchFocused) Color.White else Color(0xFF555555),
                animationSpec = tween(200),
                label = "search_border"
            )
            val animatedContainerColor by animateColorAsState(
                targetValue = if (isSearchFocused) Color(0xFF3A3A3A) else Color(0xFF2A2A2A),
                animationSpec = tween(200),
                label = "search_container"
            )
            
            OutlinedTextField(
                value = searchQuery.value,
                onValueChange = { searchQuery.value = it },
                interactionSource = interactionSource,
                placeholder = { 
                    Text(
                        "Поиск по названию и локации", 
                        color = Color.White.copy(alpha = 0.7f)
                    ) 
                },
                colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = animatedBorderColor,
                    unfocusedBorderColor = animatedBorderColor,
                    focusedContainerColor = animatedContainerColor,
                    unfocusedContainerColor = animatedContainerColor,
                    cursorColor = Color(0xFF00E5FF)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .scale(animatedScale)
                    .clickable { 
                        // Предотвращаем снятие фокуса при клике на само поле
                        isSearchFocused = true
                    },
                shape = RoundedCornerShape(20.dp),
                trailingIcon = {
                    if (searchQuery.value.isNotEmpty()) {
                        IconButton(
                            onClick = { searchQuery.value = "" }
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Очистить поиск",
                                tint = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            )

            // Filter chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                GradientChip(
                    text = "Сегодня",
                    onClick = { 
                        filterToday.value = !filterToday.value
                        filterTomorrow.value = false
                        filterWeekend.value = false 
                    },
                    selected = filterToday.value
                )
                GradientChip(
                    text = "Завтра",
                    onClick = { 
                        filterTomorrow.value = !filterTomorrow.value
                        filterToday.value = false
                        filterWeekend.value = false 
                    },
                    selected = filterTomorrow.value
                )
                GradientChip(
                    text = "Выходные",
                    onClick = { 
                        filterWeekend.value = !filterWeekend.value
                        filterToday.value = false
                        filterTomorrow.value = false 
                    },
                    selected = filterWeekend.value
                )
                GradientChip(
                    text = "Онлайн",
                    onClick = { filterOnlyOnline.value = !filterOnlyOnline.value },
                    selected = filterOnlyOnline.value
                )
                GradientChip(
                    text = "Бесплатно",
                    onClick = { filterOnlyFree.value = !filterOnlyFree.value },
                    selected = filterOnlyFree.value
                )
            }

            // Category chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                categories.forEach { cat ->
                    GradientChip(
                        text = cat,
                        onClick = {
                            selectedCategories.value = if (selectedCategories.value.contains(cat)) {
                                selectedCategories.value - cat
                            } else {
                                selectedCategories.value + cat
                            }
                        },
                        selected = selectedCategories.value.contains(cat)
                    )
                }
            }

            val filtered = events.filter { e ->
                val q = searchQuery.value.trim().lowercase()
                val matchQuery = q.isEmpty() || e.title.lowercase().contains(q) || (e.location?.lowercase()?.contains(q) == true)
                val now = System.currentTimeMillis()
                val startOfToday = Calendar.getInstance().apply {
                    timeInMillis = now
                    set(Calendar.HOUR_OF_DAY, 0)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis
                val startOfTomorrow = startOfToday + TimeUnit.DAYS.toMillis(1)
                val startOfDayAfter = startOfToday + TimeUnit.DAYS.toMillis(2)
                val startOfWeekend = Calendar.getInstance().apply {
                    timeInMillis = startOfToday
                    val dow = get(Calendar.DAY_OF_WEEK)
                    val daysToSat = ((Calendar.SATURDAY - dow) + 7) % 7
                    add(Calendar.DAY_OF_YEAR, daysToSat)
                }.timeInMillis
                val endOfWeekend = startOfWeekend + TimeUnit.DAYS.toMillis(2)

                val matchDate = when {
                    filterToday.value -> e.startAtMillis in startOfToday until startOfTomorrow
                    filterTomorrow.value -> e.startAtMillis in startOfTomorrow until startOfDayAfter
                    filterWeekend.value -> e.startAtMillis in startOfWeekend until endOfWeekend
                    else -> true
                }
                val matchOnline = !filterOnlyOnline.value || e.isOnline
                val matchFree = !filterOnlyFree.value || e.isFree
                val matchCategory = matchesCategories(e, selectedCategories.value, categoryKeywords)
                matchQuery && matchDate && matchOnline && matchFree && matchCategory
            }

            if (filtered.isEmpty()) {
                Text(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    text = "Событий нет",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyLarge
                )
                         } else {
                // Кнопка уведомления о новых событиях
                if (hasNewEvents) {
                    NewEventsNotificationButton(
                        newEventsCount = newEventsCount,
                        onShowNewEvents = {
                            vm.clearNewEventsNotification()
                        }
                    )
                }
                SwipeRefresh(
                    state = rememberSwipeRefreshState(isRefreshing = refreshing),
                    onRefresh = { vm.refreshEvents() }
                ) {
                    EventsList(
                        PaddingValues(bottom = 0.dp), 
                        filtered, 
                        safeRole, 
                        vm, 
                        refreshing,
                        onNavigateToCommunityFeed = { communityId ->
                            mainVm.navigateToCommunityFeed(communityId)
                        },
                        onNavigateToEventDetail = onNavigateToEventDetail,
                        onShowMap = { showMapDialog.value = true }
                    )
                }
            }
        }
    }

    if (showDialog.value) {
        ModalBottomSheet(
            onDismissRequest = { if (!saving) showDialog.value = false },
            sheetState = sheetState,
            dragHandle = {
                androidx.compose.material3.BottomSheetDefaults.DragHandle()
            },
            containerColor = Color(0xFF0A0A0A),
            tonalElevation = 4.dp
        ) {
            Column(modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                    Text("Создать мероприятие", style = MaterialTheme.typography.titleLarge, color = Color.White)
                        if (selectedCommunity.value != null) {
                            Text(
                                "от ${selectedCommunity.value!!.name}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFF00E5FF)
                            )
                        }
                    }
                    IconButton(onClick = { if (!saving) showDialog.value = false }) {
                        Icon(Icons.Filled.Close, contentDescription = "Закрыть", tint = Color.White)
                    }
                }
                if (uploadProgress != null) {
                    LinearProgressIndicator(
                        progress = { uploadProgress!! },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(6.dp))
                    val (done, total) = uploadCounters ?: (0 to 0)
                    if (total > 0) Text("Фото ${done}/${total}", color = Color.White)
                    Spacer(Modifier.height(8.dp))
                }
                
                // Прокручиваемая область контента
                val formScroll = rememberScrollState()
                Box(
                    modifier = Modifier
                        .weight(1f, fill = true)
                        .verticalScroll(formScroll)
                ) {
                    Column {
                OutlinedTextField(
                    value = titleState.value,
                    onValueChange = { titleState.value = it },
                    label = { Text("Название") },
                    enabled = !saving,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                
                // Description field
                OutlinedTextField(
                    value = description.value,
                    onValueChange = { if (!saving) description.value = it },
                    label = { Text("Описание мероприятия") },
                    enabled = !saving,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    maxLines = 4
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = { if (!saving) pickDateTime(context) { chosenTimeMillis.value = it } }, enabled = !saving) {
                     Text(chosenTimeMillis.value?.let { time -> "Время: ${formatTime(time)}" } ?: "Выбрать дату и время")
                }
                Spacer(Modifier.height(12.dp))
                Row { Text("Онлайн", modifier = Modifier.weight(1f), color = Color.White); Switch(checked = isOnline.value, onCheckedChange = { if (!saving) isOnline.value = it }, enabled = !saving) }
                Row { Text("Бесплатно", modifier = Modifier.weight(1f), color = Color.White); Switch(checked = isFree.value, onCheckedChange = { if (!saving) isFree.value = it }, enabled = !saving) }
                if (!isFree.value) {
                    OutlinedTextField(value = price.value, onValueChange = { if (!saving) price.value = it }, label = { Text("Стоимость (₽)") }, enabled = !saving, shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth())
                }
                // Mapbox suggestions state
                val mapboxToken = androidx.compose.ui.platform.LocalContext.current.getString(com.company.dvizhtrue.R.string.mapbox_access_token)
                val suggestions = remember { mutableStateOf(listOf<Pair<String, com.google.android.gms.maps.model.LatLng>>()) }
                val showSuggestions = remember { mutableStateOf(false) }
                val coroutineScope = rememberCoroutineScope()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f).zIndex(10f)) {
                    OutlinedTextField(
                        value = location.value, 
                        onValueChange = { q ->
                            if (!saving) {
                                location.value = q
                                showSuggestions.value = q.length >= 3
                                if (showSuggestions.value) {
                                    coroutineScope.launch(Dispatchers.IO) {
                                        try {
                                            val encoded = URLEncoder.encode(q, "UTF-8")
                                            val url = URL("https://api.mapbox.com/geocoding/v5/mapbox.places/$encoded.json?access_token=$mapboxToken&autocomplete=true&language=ru&limit=5&country=ru&types=place,locality,neighborhood,address,poi&proximity=37.6176,55.7558&worldview=ru")
                                            val conn = url.openConnection() as HttpURLConnection
                                            conn.requestMethod = "GET"
                                            conn.connectTimeout = 6000
                                            conn.readTimeout = 6000
                                            conn.inputStream.buffered().use { ins ->
                                                val text = ins.reader().use { it.readText() }
                                                val json = JSONObject(text)
                                                val feats = json.optJSONArray("features")
                                                val list = mutableListOf<Pair<String, com.google.android.gms.maps.model.LatLng>>()
                                                if (feats != null) {
                                                    for (i in 0 until feats.length()) {
                                                        val f = feats.optJSONObject(i) ?: continue
                                                        val typesArr = f.optJSONArray("place_type")
                                                        val hasZip = (0 until (typesArr?.length() ?: 0)).any { idx ->
                                                            val t = typesArr?.optString(idx)
                                                            t == "postcode" || t == "country"
                                                        }
                                                        if (hasZip) continue
                                                        val contextArr = f.optJSONArray("context")
                                                        val language = f.optString("language", "")
                                                        val placeNameCandidate: String? = if (language == "ru") {
                                                            f.optString("place_name", null)
                                                        } else {
                                                            val textRu = f.optString("text_ru", null)
                                                            val placeRu = contextArr?.let { ctx ->
                                                                var res: String? = null
                                                                for (j in 0 until ctx.length()) {
                                                                    val c = ctx.optJSONObject(j)
                                                                    val v = c?.optString("text_ru", null)
                                                                    if (!v.isNullOrBlank()) { res = v; break }
                                                                }
                                                                res
                                                            }
                                                            val base = textRu ?: f.optString("text", null)
                                                            if (base != null) {
                                                                if (!placeRu.isNullOrBlank()) "$base, $placeRu" else base
                                                            } else f.optString("place_name", null)
                                                        }
                                                        val center = f.optJSONArray("center")
                                                        if (center != null && center.length() >= 2) {
                                                            val lon = center.optDouble(0)
                                                            val lat = center.optDouble(1)
                                                            val placeName = placeNameCandidate ?: continue
                                                            list.add(placeName to com.google.android.gms.maps.model.LatLng(lat, lon))
                                                        }
                                                    }
                                                }
                                                // Fallback for common cases
                                                if (list.isEmpty() && q.lowercase().contains("моск")) {
                                                    list.add("Москва, Россия" to com.google.android.gms.maps.model.LatLng(55.7558, 37.6176))
                                                }
                                                withContext(Dispatchers.Main) {
                                                    val finalList = if (list.isEmpty() && q.length >= 3) {
                                                        listOf("Нет результатов" to com.google.android.gms.maps.model.LatLng(55.7558, 37.6176))
                                                    } else list
                                                    suggestions.value = finalList
                                                    android.util.Log.d("LocationSuggest", "Got ${finalList.size} items for '$q'")
                                                }
                                            }
                                        } catch (_: Exception) {
                                            withContext(Dispatchers.Main) { 
                                                suggestions.value = if (q.lowercase().contains("моск")) listOf(
                                                    "Москва, Россия" to com.google.android.gms.maps.model.LatLng(55.7558, 37.6176)
                                                ) else emptyList() 
                                            }
                                        }
                                    }
                                } else {
                                    suggestions.value = emptyList()
                                }
                            }
                        }, 
                        label = { Text("Локация") }, 
                        enabled = !saving, 
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp), 
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (showSuggestions.value && suggestions.value.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .zIndex(20f)
                                .align(Alignment.TopStart)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF1E1E1E), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color(0xFF2A2A2A), RoundedCornerShape(10.dp))
                            ) {
                                suggestions.value.take(5).forEach { pair ->
                                    val title = pair.first
                                    val latLng = pair.second
                                    TextButton(
                                        onClick = {
                                            location.value = title
                                            selectedLocation.value = latLng
                                            suggestions.value = emptyList()
                                            showSuggestions.value = false
                                            android.util.Log.d("LocationSuggest", "Selected: $title -> ${latLng.latitude},${latLng.longitude}")
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(title, color = Color.White, maxLines = 2)
                                    }
                                }
                            }
                        }
                    }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { showLocationPicker.value = true },
                        enabled = !saving && !isOnline.value,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF00E5FF)
                        ),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.LocationOn,
                            contentDescription = "Выбрать на карте",
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    // Предпросмотр карты с маркером, если выбрана локация
                    if (selectedLocation.value != null) {
                        val p = selectedLocation.value!!
                        Spacer(Modifier.height(8.dp))
                        EventMapboxView(
                            lat = p.latitude,
                            lon = p.longitude,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                
                // Categories section
                Text(
                    "Категории", 
                    style = MaterialTheme.typography.titleLarge, 
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(16.dp))
                val showAllCategories = remember { mutableStateOf(false) }
                val displayedCategories = if (showAllCategories.value) categories else categories.take(6)
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(displayedCategories) { cat ->
                        val selected = eventCreationCategories.value.contains(cat)
                        GradientChip(
                            text = cat,
                            onClick = {
                                if (!saving) {
                                    eventCreationCategories.value = if (selected) {
                                        eventCreationCategories.value - cat
                                    } else {
                                        eventCreationCategories.value + cat
                                    }
                                }
                            },
                            selected = selected
                        )
                    }
                }
                
                if (categories.size > 6) {
                    Spacer(Modifier.height(16.dp))
                    TextButton(
                        onClick = { showAllCategories.value = !showAllCategories.value },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (showAllCategories.value) "Скрыть" else "Показать все",
                            color = Color(0xFF00E5FF),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
                
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text("Фото: ${imageUrisState.value.size}/5", modifier = Modifier.weight(1f), color = Color.White)
                    OutlinedButton(onClick = { photoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }, enabled = imageUrisState.value.size < 5 && !saving) { Text("Добавить фото") }
                    Spacer(Modifier.width(8.dp))
                    OutlinedButton(onClick = { 
                        if (imageUrisState.value.isNotEmpty()) {
                            android.util.Log.d("HomeScreen", "Removing last photo, current count: ${imageUrisState.value.size}")
                            imageUrisState.value = imageUrisState.value.dropLast(1)
                            android.util.Log.d("HomeScreen", "Photo removed, new count: ${imageUrisState.value.size}")
                        }
                    }, enabled = imageUrisState.value.isNotEmpty() && !saving) { Text("Удалить") }
                }
                
                // Контейнер для отображения выбранных фотографий
                if (imageUrisState.value.isNotEmpty()) {
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Выбранные фотографии:",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(Modifier.height(8.dp))
                    
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(imageUrisState.value) { uri ->
                            Box(
                                modifier = Modifier
                                    .width(140.dp)
                                    .height(120.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.Gray, RoundedCornerShape(8.dp))
                            ) {
                                AsyncImage(
                                    model = uri,
                                    contentDescription = "Выбранное фото",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                                
                                // Кнопка удаления конкретной фотографии
                                IconButton(
                                    onClick = {
                                        if (!saving) {
                                            android.util.Log.d("HomeScreen", "Removing specific photo, current count: ${imageUrisState.value.size}")
                                            imageUrisState.value = imageUrisState.value.filter { it != uri }
                                            android.util.Log.d("HomeScreen", "Specific photo removed, new count: ${imageUrisState.value.size}")
                                        }
                                    },
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .size(24.dp)
                                        .background(Color.Black.copy(alpha = 0.7f), CircleShape)
                                ) {
                                    Icon(
                                        Icons.Filled.Close,
                                        contentDescription = "Удалить фото",
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
                    }
                }
                
                Spacer(Modifier.height(8.dp))
                // Фиксированная панель действий
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(onClick = { 
                        if (!saving) {
                            vm.resetSavingState() // Принудительно сбрасываем состояние
                            showDialog.value = false 
                            savingStarted.value = false
                            selectedCommunity.value = null
                            titleState.value = ""
                            description.value = ""
                            chosenTimeMillis.value = null
                            isOnline.value = false
                            isFree.value = true
                            price.value = ""
                            location.value = ""
                            imageUrisState.value = emptyList()
                            eventCreationCategories.value = emptySet()
                        }
                    }, enabled = !saving, modifier = Modifier.weight(1f)) {
                        Text("Отмена")
                    }
                    Button(onClick = {
                     android.util.Log.d("HomeScreen", "Save button clicked, saving=$saving")
                     if (saving) {
                         android.util.Log.d("HomeScreen", "Button blocked because saving=$saving")
                         return@Button
                     }
                     
                     // Дополнительная защита: если кнопка заблокирована слишком долго, разблокируем
                     if (savingStarted.value && !saving) {
                         android.util.Log.w("HomeScreen", "Save button was stuck, resetting state")
                         vm.resetSavingState()
                         savingStarted.value = false
                     }
                     
                    val title = titleState.value.trim()
                    val startAt = chosenTimeMillis.value
                    val priceVal = price.value.toDoubleOrNull()
                     android.util.Log.d("HomeScreen", "Validation: title='$title', startAt=$startAt, isFree=${isFree.value}, priceVal=$priceVal")
                    if (title.isNotEmpty() && startAt != null && (isFree.value || (!isFree.value && priceVal != null))) {
                         android.util.Log.d("HomeScreen", "Creating event: $title")
                        savingStarted.value = true
                         vm.createEvent(context, title, description.value.ifBlank { null }, startAt, isOnline.value, isFree.value, priceVal, location.value.ifBlank { null }, imageUrisState.value, eventCreationCategories.value.toList(), selectedCommunity.value?.id)
                     } else {
                         android.util.Log.d("HomeScreen", "Validation failed: title='$title', startAt=$startAt, isFree=${isFree.value}, priceVal=$priceVal")
                    }
                    }, enabled = !saving, modifier = Modifier.weight(1f)) {
                        Text(if (saving) "Сохранение..." else "Сохранить")
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        }
        LaunchedEffect(saving, uploadProgress, savingStarted.value) {
            android.util.Log.d("HomeScreen", "LaunchedEffect triggered: saving=$saving, uploadProgress=$uploadProgress, savingStarted=${savingStarted.value}")
            
            // Сброс состояния когда операция завершена
            if (savingStarted.value && !saving && uploadProgress == null) {
                android.util.Log.d("HomeScreen", "Closing dialog and resetting state")
                showDialog.value = false
                savingStarted.value = false
                selectedCommunity.value = null
                titleState.value = ""
                chosenTimeMillis.value = null
                isOnline.value = false
                isFree.value = true
                price.value = ""
                location.value = ""
                imageUrisState.value = emptyList()
                eventCreationCategories.value = emptySet()
            }
            
            // Дополнительная защита: сброс состояния если что-то пошло не так
            if (savingStarted.value && !saving) {
                // Если savingStarted = true, но saving = false, значит операция завершилась
                // Ждем немного и сбрасываем состояние
                delay(1000)
                if (savingStarted.value && !saving) {
                    android.util.Log.d("HomeScreen", "Safety reset of savingStarted state")
                    vm.resetSavingState() // Используем новый метод
                    savingStarted.value = false
                    showDialog.value = false
                    selectedCommunity.value = null
                    titleState.value = ""
                    chosenTimeMillis.value = null
                    isOnline.value = false
                    isFree.value = true
                    price.value = ""
                    location.value = ""
                    imageUrisState.value = emptyList()
                    eventCreationCategories.value = emptySet()
                }
            }
            
            // Еще одна защита: если диалог открыт слишком долго, закрываем его
            if (showDialog.value && savingStarted.value) {
                delay(5000) // 5 секунд
                if (showDialog.value && savingStarted.value && !saving) {
                    android.util.Log.d("HomeScreen", "Timeout protection: closing dialog after 5 seconds")
                    vm.resetSavingState()
                    savingStarted.value = false
                    showDialog.value = false
                    selectedCommunity.value = null
                    titleState.value = ""
                    chosenTimeMillis.value = null
                    isOnline.value = false
                    isFree.value = true
                    price.value = ""
                    location.value = ""
                    imageUrisState.value = emptyList()
                    eventCreationCategories.value = emptySet()
                }
            }
            
            // Критическая защита: если что-то пошло не так, принудительно сбрасываем через 10 секунд
            if (showDialog.value && savingStarted.value) {
                delay(10000) // 10 секунд
                if (showDialog.value && savingStarted.value) {
                    android.util.Log.e("HomeScreen", "CRITICAL: Dialog stuck for 10 seconds, forcing reset!")
                    vm.resetSavingState()
                    savingStarted.value = false
                    showDialog.value = false
                    selectedCommunity.value = null
                    titleState.value = ""
                    chosenTimeMillis.value = null
                    isOnline.value = false
                    isFree.value = true
                    price.value = ""
                    location.value = ""
                    imageUrisState.value = emptyList()
                    eventCreationCategories.value = emptySet()
                }
            }
        }
    }

    // Community selector dialog
    if (showCommunitySelector.value) {
        CommunitySelectorDialog(
            onDismiss = { showCommunitySelector.value = false },
            onCommunitySelected = { community ->
                selectedCommunity.value = community
                showCommunitySelector.value = false
                showDialog.value = true
                savingStarted.value = false
            }
        )
        
        // Диалог выбора места на карте
        LocationPickerDialog(
            isVisible = showLocationPicker.value,
            onDismiss = { showLocationPicker.value = false },
            onLocationSelected = { address, latLng ->
                location.value = address
                selectedLocation.value = latLng
            }
        )
    }

    // Диалог с картой (Mapbox)
    if (showMapDialog.value) {
        EventsMapDialog(
            events = events,
            onDismiss = { showMapDialog.value = false },
            onSelectEvent = { ev ->
                showMapDialog.value = false
                onNavigateToEventDetail(ev)
            }
        )
    }
}

 fun matchesCategories(
    event: Event,
    selected: Set<String>,
    dict: Map<String, List<String>>
): Boolean {
    if (selected.isEmpty()) return true
    
    // First check if event has explicit categories that match
    val eventCategories = event.categories.map { it.lowercase() }
    val selectedLower = selected.map { it.lowercase() }
    
    // If event has categories and any of them match selected filters, return true
    if (eventCategories.isNotEmpty()) {
        if (eventCategories.any { it in selectedLower }) {
            return true
        }
    }
    
    // Fallback to keyword matching if no explicit categories or no matches
    val hay = buildString {
        append(event.title.lowercase())
        event.location?.let { append(" "); append(it.lowercase()) }
    }
    return selected.any { cat ->
        val keys = dict[cat] ?: return@any false
        keys.any { k -> hay.contains(k) }
    }
}

@Composable
fun EventsList(
    padding: PaddingValues, 
    events: List<Event>, 
    role: String, 
    vm: HomeViewModel? = null, 
    refreshing: Boolean = false, 
    onNavigateToCommunityFeed: (String) -> Unit = {},
    onNavigateToEventDetail: (Event) -> Unit = {},
    onShowMap: () -> Unit = {}
) {
    android.util.Log.d("EventsList", "Rendering ${events.size} events")
    events.forEach { event ->
        android.util.Log.d("EventsList", "Event: ${event.title}, imageUrls: ${event.imageUrls.size}")
    }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = padding
    ) {
        // Добавляем кнопки в начало списка (только если vm не null)
        if (vm != null) {
            item {
                Button(
                    onClick = { onShowMap() },
                    enabled = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text("Смотреть карту")
                }
            }
        }
        
        items(events, key = { it.id }) { e ->
            EventItem(
                event = e, 
                role = role, 
                onNavigateToCommunityFeed = onNavigateToCommunityFeed,
                onNavigateToEventDetail = onNavigateToEventDetail
            )
        }
        item { Spacer(Modifier.padding(bottom = 72.dp)) }
    }
}

@Composable
fun EventItem(
    event: Event, 
    role: String, 
    onNavigateToCommunityFeed: (String) -> Unit = {},
    onNavigateToEventDetail: (Event) -> Unit = {}
) {
    android.util.Log.d("EventItem", "Rendering event: ${event.title}, imageUrls: ${event.imageUrls.size}")
    
    val context = LocalContext.current
    val authUid = remember { mutableStateOf(AuthRepository.getCurrentUserIdOrNull()) }
    val going = remember { mutableStateOf(false) }
    val count = remember { mutableStateOf(0) }
    val pendingGoingUpdate = rememberSaveable(event.id) { mutableStateOf(false) }
    val desiredGoingState = rememberSaveable(event.id) { mutableStateOf<Boolean?>(null) }
    val scope = rememberCoroutineScope()
    
    // Community info
    var community by remember { mutableStateOf<com.company.dvizhtrue.data.Community?>(null) }
    var showCommunityInfo by remember { mutableStateOf(false) }

    LaunchedEffect(pendingGoingUpdate.value) {
        if (pendingGoingUpdate.value) {
            delay(4000)
            if (pendingGoingUpdate.value) {
                // Timeout safeguard: re-enable button to avoid lock
                pendingGoingUpdate.value = false
            }
        }
    }

    DisposableEffect(event.id, authUid.value) {
        val c = scope.launch {
            AttendanceRepository.listenAttendanceCount(event.id).collect { count.value = it }
        }
        val r = authUid.value?.let { uid ->
            scope.launch {
                AttendanceRepository.listenUserGoing(event.id, uid).collect { remoteGoing ->
                if (pendingGoingUpdate.value) {
                    val desired = desiredGoingState.value
                    if (desired != null && desired == remoteGoing) {
                        pendingGoingUpdate.value = false
                        desiredGoingState.value = null
                        going.value = remoteGoing
                    } else {
                        // Ignore interim remote snapshot while pending
                    }
                } else {
                    going.value = remoteGoing
                    }
                }
            }
        }
        onDispose {
            c.cancel()
            r?.cancel()
        }
    }

    // Also merge with local attendance for fully offline/guest mode
    LaunchedEffect(event.id) {
        AttendanceLocalRepository.isGoingFlow(event.id).collect { local ->
            if (authUid.value == null && !pendingGoingUpdate.value) {
                going.value = local
            }
        }
    }

    // Load community info if event has communityId
    LaunchedEffect(event.communityId) {
        event.communityId?.let { communityId ->
            try {
                val result = com.company.dvizhtrue.data.CommunityRepository.getCommunity(communityId)
                if (result.isSuccess) {
                    community = result.getOrNull()
                }
            } catch (e: Exception) {
                android.util.Log.e("EventItem", "Error loading community", e)
            }
        }
    }

    GradientCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { 
                android.util.Log.d("EventItem", "Card clicked for event: ${event.title}")
                onNavigateToEventDetail(event) 
            }
    ) {
        Column {
            // Community header (avatar + name)
            if (community != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { showCommunityInfo = true },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF3A3A3A)),
                        contentAlignment = Alignment.Center
                    ) {
                        val avatar = community!!.imageUrl
                        if (!avatar.isNullOrBlank()) {
                            AsyncImage(
                                model = avatar,
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Icon(
                                Icons.Filled.Group,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = community!!.name,
                        color = Color.White,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
            Text(
                text = event.title,
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            // Event description
            if (!event.description.isNullOrBlank()) {
                Spacer(Modifier.padding(top = 4.dp))
                Text(
                    text = event.description!!,
                    color = Color.White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            Spacer(Modifier.padding(top = 6.dp))
            Column {
                                 Row {
                     Icon(imageVector = Icons.Outlined.Event, contentDescription = null, tint = Color.White.copy(alpha = 0.7f))
                     Spacer(Modifier.padding(horizontal = 6.dp))
                     Text(text = formatRelativeTime(event.startAtMillis), color = Color.White.copy(alpha = 0.7f))
                 }
                Spacer(Modifier.padding(top = 6.dp))
                                 Row {
                     AssistChip(
                         onClick = {}, 
                         label = { Text(if (event.isOnline) "Онлайн" else "Оффлайн", color = Color.White) }, 
                         colors = AssistChipDefaults.assistChipColors(
                             labelColor = androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                         )
                     )
                     Spacer(Modifier.padding(horizontal = 6.dp))
                     AssistChip(
                         onClick = {}, 
                         label = { Text(if (event.isFree) "Бесплатно" else (event.price?.let { "${it.toInt()} ₽" } ?: "Платно"), color = Color.White) }, 
                         colors = AssistChipDefaults.assistChipColors(
                             labelColor = androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                         )
                     )
                 }
                if (!event.location.isNullOrBlank()) {
                    Spacer(Modifier.padding(top = 6.dp))
                    Text(text = event.location, color = Color.White.copy(alpha = 0.7f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                
                // Display event categories if available
                if (event.categories.isNotEmpty()) {
                    Spacer(Modifier.padding(top = 12.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        event.categories.take(3).forEach { category ->
                                                         Box(
                                 modifier = Modifier
                                     .clip(RoundedCornerShape(16.dp))
                                     .background(Color(0xFF2A2A2A))
                                     .border(
                                         width = 1.dp,
                                         color = Color(0xFF555555),
                                         shape = RoundedCornerShape(16.dp)
                                     )
                                     .padding(horizontal = 12.dp, vertical = 6.dp)
                             ) {
                                Text(
                                    text = category,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        if (event.categories.size > 3) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFF2A2A2A))
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "+${event.categories.size - 3}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White.copy(alpha = 0.7f),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
                if (event.imageUrls.isNotEmpty()) {
                    android.util.Log.d("EventItem", "Displaying ${event.imageUrls.size} photos for event: ${event.title}")
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Фотографии:",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color.White.copy(alpha = 0.8f),
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        event.imageUrls.take(5).forEach { url ->
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            ) {
                                AsyncImage(
                                    model = url,
                                    contentDescription = "Фото мероприятия",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                        if (event.imageUrls.size > 5) {
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF2A2A2A))
                                    .border(1.dp, Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "+${event.imageUrls.size - 5}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White.copy(alpha = 0.7f),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
                 Spacer(Modifier.padding(top = 12.dp))
                Text(text = "${count.value} идут", color = Color.White.copy(alpha = 0.7f))
            }
            // Ссылки: Подробнее (externalUrl/originalUrl) и Источник (originalUrl)
            run {
                val detailsUrl = event.externalUrl ?: event.originalUrl
                val sourceUrl = event.originalUrl
                if (!detailsUrl.isNullOrBlank() || !sourceUrl.isNullOrBlank()) {
                    Spacer(Modifier.height(10.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (!detailsUrl.isNullOrBlank()) {
                            OutlinedButton(
                                onClick = {
                                    try {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(detailsUrl))
                                        context.startActivity(intent)
                                    } catch (_: Exception) {}
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Подробнее")
                            }
                        }
                        if (!sourceUrl.isNullOrBlank()) {
                            OutlinedButton(
                                onClick = {
                                    try {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(sourceUrl))
                                        context.startActivity(intent)
                                    } catch (_: Exception) {}
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Источник")
                            }
                        }
                    }
                }
            }

            // Кнопка "Я иду" для всех ролей
                Spacer(Modifier.padding(top = 10.dp))
                Row {
                    val visualGoing = desiredGoingState.value ?: going.value
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .clip(RoundedCornerShape(24.dp))
                                                         .background(
                                 if (visualGoing) {
                                     Color(0xFF404040)
                                 } else {
                                     Color(0xFF2A2A2A)
                                 }
                             )
                                                         .clickable(enabled = !pendingGoingUpdate.value) {
                                 val id = authUid.value
                                 if (id == null) {
                                     pendingGoingUpdate.value = true
                                     desiredGoingState.value = true
                                     going.value = true
                                     kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                         AttendanceLocalRepository.add(event.id)
                                     }
                                     AuthRepository.signInAnonymously()
                                         .addOnSuccessListener { res ->
                                             val newUid = res.user?.uid
                                             authUid.value = newUid
                                             if (newUid != null) {
                                                 AttendanceRepository.markGoing(event.id, newUid)
                                             } else {
                                                 pendingGoingUpdate.value = false
                                                 desiredGoingState.value = null
                                                 going.value = false
                                                 kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                                     AttendanceLocalRepository.remove(event.id)
                                                 }
                                             }
                                         }
                                        .addOnFailureListener { _ ->
                                             pendingGoingUpdate.value = false
                                             desiredGoingState.value = null
                                             going.value = false
                                             kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                                 AttendanceLocalRepository.remove(event.id)
                                             }
                                         }
                                 } else {
                                     val target = !going.value
                                     pendingGoingUpdate.value = true
                                     desiredGoingState.value = target
                                     going.value = target
                                     if (target) {
                                         kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                             AttendanceLocalRepository.add(event.id)
                                         }
                                         AttendanceRepository.markGoing(event.id, id)
                                            .addOnFailureListener { _ ->
                                                 kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                                     AttendanceLocalRepository.remove(event.id)
                                                 }
                                                 pendingGoingUpdate.value = false
                                                 desiredGoingState.value = null
                                                 going.value = !target
                                             }
                                     } else {
                                         kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                             AttendanceLocalRepository.remove(event.id)
                                         }
                                         AttendanceRepository.unmarkGoing(event.id, id)
                                            .addOnFailureListener { _ ->
                                                 kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                                     AttendanceLocalRepository.add(event.id)
                                                 }
                                                 pendingGoingUpdate.value = false
                                                 desiredGoingState.value = null
                                                 going.value = !target
                                             }
                                     }
                                 }
                             },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (visualGoing) "Не пойду" else "Пойду",
                            color = Color.White,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            
            
        }
    }

    // Community info dialog
    if (showCommunityInfo && community != null) {
        AlertDialog(
            onDismissRequest = { showCommunityInfo = false },
            title = {
                Text(
                    text = community!!.name,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (community!!.description.isNotBlank()) {
                        Text(
                            text = community!!.description,
                            color = Color.White.copy(alpha = 0.8f),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                            Text(
                        text = "${community!!.memberIds.size + 1} участников",
                        color = Color.White.copy(alpha = 0.6f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            },
            confirmButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { showCommunityInfo = false }) {
                        Text("Закрыть", color = Color.White)
                    }
                    Button(
                        onClick = {
                            showCommunityInfo = false
                            onNavigateToCommunityFeed(community!!.id)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00E5FF))
                    ) {
                        Text("Перейти к ленте", color = Color.White)
                    }
                }
            },
            containerColor = Color(0xFF1A1A1A),
            titleContentColor = Color.White,
            textContentColor = Color.White
        )
    }
}

@Composable
fun RowWithIcon(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row {
        Icon(imageVector = icon, contentDescription = null, tint = Color.White.copy(alpha = 0.7f))
        Spacer(Modifier.padding(horizontal = 6.dp))
        Text(text = text, color = Color.White.copy(alpha = 0.7f))
    }
}

@Composable
fun CreateEventDialog(
    title: String,
    onTitleChange: (String) -> Unit,
    chosenTimeMillis: Long?,
    onPickDateTime: () -> Unit,
    isOnline: Boolean,
    onToggleOnline: (Boolean) -> Unit,
    isFree: Boolean,
    onToggleFree: (Boolean) -> Unit,
    price: String,
    onPriceChange: (String) -> Unit,
    location: String,
    onLocationChange: (String) -> Unit,
    imagesCount: Int,
    onAddImage: () -> Unit,
    onRemoveLastImage: () -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            GradientButton(text = "Сохранить", onClick = onSave)
        },
        dismissButton = {
            androidx.compose.material3.OutlinedButton(onClick = onDismiss, colors = ButtonDefaults.outlinedButtonColors()) {
                Text("Отмена")
            }
        },
        title = { Text("Создать мероприятие") },
        text = {
            Column {
                OutlinedTextField(value = title, onValueChange = onTitleChange, label = { Text("Название") })
                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 8.dp))
                GradientButton(text = chosenTimeMillis?.let { "Время: ${formatTime(it)}" } ?: "Выбрать дату и время", onClick = onPickDateTime)
                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))
                Row { Text("Онлайн", modifier = Modifier.weight(1f)); Switch(checked = isOnline, onCheckedChange = onToggleOnline) }
                Row { Text("Бесплатно", modifier = Modifier.weight(1f)); Switch(checked = isFree, onCheckedChange = onToggleFree) }
                if (!isFree) {
                    OutlinedTextField(value = price, onValueChange = onPriceChange, label = { Text("Стоимость (₽)") })
                }
                OutlinedTextField(value = location, onValueChange = onLocationChange, label = { Text("Локация") })
                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text("Фото: $imagesCount/5", modifier = Modifier.weight(1f))
                    OutlinedButton(onClick = onAddImage, enabled = imagesCount < 5) { Text("Добавить фото") }
                    androidx.compose.foundation.layout.Spacer(Modifier.width(8.dp))
                    OutlinedButton(onClick = onRemoveLastImage, enabled = imagesCount > 0) { Text("Удалить") }
                }
            }
        }
    )
}

fun pickDateTime(context: Context, onPicked: (Long) -> Unit) {
    val cal = Calendar.getInstance()
    DatePickerDialog(context, { _, y, m, d ->
        cal.set(Calendar.YEAR, y)
        cal.set(Calendar.MONTH, m)
        cal.set(Calendar.DAY_OF_MONTH, d)
        TimePickerDialog(context, { _, h, min ->
            cal.set(Calendar.HOUR_OF_DAY, h)
            cal.set(Calendar.MINUTE, min)
            cal.set(Calendar.SECOND, 0)
            onPicked(cal.timeInMillis)
        }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
    }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
}

// Moved to TimeUtils.kt: formatTime, formatRelativeTime

@Composable
fun CommunitySelectorDialog(
    onDismiss: () -> Unit,
    onCommunitySelected: (com.company.dvizhtrue.data.Community) -> Unit
) {
    val vm: com.company.dvizhtrue.ui.MainViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
    val userCommunities by vm.userCommunities.collectAsState()
    val currentCommunity by vm.currentCommunity.collectAsState()

    LaunchedEffect(Unit) {
        vm.loadUserCommunities()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Выберите сообщество",
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall
            )
        },
        text = {
            if (userCommunities.isEmpty()) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        Icons.Filled.Group,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.5f),
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = "У вас нет сообществ",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "Создайте сообщество в профиле",
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(userCommunities, key = { it.id }) { community ->
                        CommunitySelectorItem(
                            community = community,
                            isCurrent = currentCommunity?.id == community.id,
                            onSelect = { onCommunitySelected(community) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Отмена", color = Color.White)
            }
        },
        containerColor = Color(0xFF1A1A1A),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )
}

@Composable
fun CommunitySelectorItem(
    community: com.company.dvizhtrue.data.Community,
    isCurrent: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        colors = CardDefaults.cardColors(
            containerColor = if (isCurrent) Color(0xFF1A3A5C) else Color(0xFF2A2A2A)
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = community.name,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                if (community.description.isNotBlank()) {
                    Text(
                        text = community.description,
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = "${community.memberIds.size + 1} участников",
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.labelSmall
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
                        text = "Текущее",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// Компонент кнопки уведомления о новых событиях
@Composable
fun NewEventsNotificationButton(
    newEventsCount: Int,
    onShowNewEvents: () -> Unit
) {
    Button(
        onClick = onShowNewEvents,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFF4CAF50)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Notifications,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Text(
                text = "Появились новые события ($newEventsCount) - показать",
                color = Color.White,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
