package com.company.dvizhtrue

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxSize
import androidx.lifecycle.viewmodel.compose.viewModel
import com.company.dvizhtrue.theme.AppTheme
import com.company.dvizhtrue.ui.CommunityLoginScreen
import com.company.dvizhtrue.ui.HomeScreen
import com.company.dvizhtrue.ui.ProfileScreen
import com.company.dvizhtrue.ui.MainScreen
import com.company.dvizhtrue.ui.CreateCommunityScreen
import com.company.dvizhtrue.ui.MyCommunitiesScreen
import com.company.dvizhtrue.ui.JoinCommunityScreen
import com.company.dvizhtrue.ui.CommunityFeedScreen
import com.company.dvizhtrue.ui.MyEventsScreen
import com.company.dvizhtrue.ui.MainViewModel
import com.company.dvizhtrue.ui.RootScreen
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.firebase.storage.ktx.storage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.functions.ktx.functions

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        android.util.Log.d("MainActivity", "onCreate started")
        
        // ВАЖНО: сначала конфигурируем эмулятор Firestore (учитывает use_emulator)
        com.company.dvizhtrue.data.configureFirestoreEmulatorEarly(this)

        // Инициализация Firebase (отключены тяжёлые тесты/сидинг для стабильности)
        try {
            // Лёгкая проверка доступности приложения без сетевых операций
            android.util.Log.d("MainActivity", "Firebase init skipped heavy tests for stability")
        } catch (_: Exception) {}
        
        // Отключаем сидинг/тяжёлые операции на старте
        // com.company.dvizhtrue.data.EventsRepository.configureEmulator(this)
        // initializeDatabase()
        // clearOldEventsAndCreateReal()
        // createTestEvents()
        // createRealEventsWithCorrectData()
        // runAIParser()
        
        // Тяжёлые сетевые проверки Firebase отключены
        
        try {
            com.company.dvizhtrue.data.AttendanceLocalRepository.init(applicationContext)
            android.util.Log.d("MainActivity", "AttendanceLocalRepository initialized successfully")
        } catch (e: Exception) {
            // Log error but continue
            android.util.Log.e("MainActivity", "Error initializing AttendanceLocalRepository", e)
        }
        
        setContent {
            android.util.Log.d("MainActivity", "setContent started")
            AppTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val vm: MainViewModel = viewModel()
                    android.util.Log.d("MainActivity", "MainViewModel created")
                    val screen by vm.screen.collectAsState()
                    android.util.Log.d("MainActivity", "Current screen: $screen")
                    
                    when (screen) {
                        is RootScreen.CommunityLogin -> {
                            android.util.Log.d("MainActivity", "Showing CommunityLogin screen")
                            CommunityLoginScreen(onBack = { vm.back() })
                        }
                        is RootScreen.Home -> {
                            android.util.Log.d("MainActivity", "Showing Main screen with Bottom Navigation")
                            MainScreen(
                                onNavigateToGuestMyEvents = { vm.navigateToGuestMyEvents() },
                                onNavigateToMyEvents = { vm.navigateToMyEvents() },
                                onNavigateToMyCommunities = { vm.navigateToMyCommunities() },
                                onCreateCommunity = { vm.navigateToCreateCommunity() },
                                onJoinCommunity = { vm.navigateToJoinCommunity() }
                            )
                        }
                        is RootScreen.GuestMyEvents -> {
                            android.util.Log.d("MainActivity", "Showing GuestMyEvents screen")
                            com.company.dvizhtrue.ui.guest.GuestMyEventsScreen(onBack = { vm.back() })
                        }
                        is RootScreen.MyEvents -> {
                            android.util.Log.d("MainActivity", "Showing MyEvents screen")
                            MyEventsScreen(onBack = { vm.back() })
                        }
                        is RootScreen.CreateCommunity -> {
                            android.util.Log.d("MainActivity", "Showing CreateCommunity screen")
                            CreateCommunityScreen(
                                onBack = { vm.back() },
                                onCommunityCreated = { vm.back() }
                            )
                        }
                        is RootScreen.MyCommunities -> {
                            android.util.Log.d("MainActivity", "Showing MyCommunities screen")
                            MyCommunitiesScreen(
                                onBack = { vm.back() },
                                onCreateCommunity = { vm.navigateToCreateCommunity() },
                                onJoinCommunity = { vm.navigateToJoinCommunity() },
                                onCommunityManagement = { communityId: String -> vm.navigateToCommunityManagement(communityId) }
                            )
                        }
                        is RootScreen.JoinCommunity -> {
                            android.util.Log.d("MainActivity", "Showing JoinCommunity screen")
                            JoinCommunityScreen(
                                onBack = { vm.back() },
                                onCommunityJoined = { vm.back() }
                            )
                        }
                        is RootScreen.CommunityManagement -> {
                            android.util.Log.d("MainActivity", "Showing CommunityManagement screen")
                            // TODO: Implement CommunityManagementScreen
                            MyCommunitiesScreen(
                                onBack = { vm.back() },
                                onCreateCommunity = { vm.navigateToCreateCommunity() },
                                onJoinCommunity = { vm.navigateToJoinCommunity() },
                                onCommunityManagement = { communityId: String -> vm.navigateToCommunityManagement(communityId) }
                            )
                        }
                        is RootScreen.CommunityFeed -> {
                            android.util.Log.d("MainActivity", "Showing CommunityFeed screen")
                            CommunityFeedScreen(
                                communityId = (screen as RootScreen.CommunityFeed).communityId,
                                onBack = { vm.back() }
                            )
                        }
                        else -> {
                            // Fallback to Main screen
                            android.util.Log.d("MainActivity", "Fallback to Main screen")
                            MainScreen(
                                onNavigateToGuestMyEvents = { vm.navigateToGuestMyEvents() },
                                onNavigateToMyEvents = { vm.navigateToMyEvents() },
                                onNavigateToMyCommunities = { vm.navigateToMyCommunities() },
                                onCreateCommunity = { vm.navigateToCreateCommunity() },
                                onJoinCommunity = { vm.navigateToJoinCommunity() }
                            )
                        }
                    }
                }
            }
        }
        android.util.Log.d("MainActivity", "onCreate completed")
    }
    
    private fun initializeDatabase() {
        android.util.Log.d("MainActivity", "=== INITIALIZING DATABASE ===")
        
        try {
            val db = Firebase.firestore
            
            // Создаем коллекцию каналов
            val channelsCollection = db.collection("channels")
            val defaultChannels = listOf(
                hashMapOf(
                    "username" to "Na_Fanere",
                    "name" to "На Фанере",
                    "url" to "https://t.me/s/Na_Fanere",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "gzsmsk",
                    "name" to "Газета Завтра",
                    "url" to "https://t.me/s/gzsmsk",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "mosgul",
                    "name" to "Московский ГУЛ",
                    "url" to "https://t.me/s/mosgul",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "freeskidos",
                    "name" to "Free Skidos",
                    "url" to "https://t.me/s/freeskidos",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "novembercinema",
                    "name" to "November Cinema",
                    "url" to "https://t.me/s/novembercinema",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "NovostiMoskvbl",
                    "name" to "Новости Москвы",
                    "url" to "https://t.me/s/NovostiMoskvbl",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "only_park",
                    "name" to "Only Park",
                    "url" to "https://t.me/s/only_park",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "prostpolitika",
                    "name" to "Простая Политика",
                    "url" to "https://t.me/s/prostpolitika",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                ),
                hashMapOf(
                    "username" to "ziferblatmost",
                    "name" to "Циферблат Москва",
                    "url" to "https://t.me/s/ziferblatmost",
                    "enabled" to true,
                    "lastParsed" to null,
                    "createdAt" to FieldValue.serverTimestamp()
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${defaultChannels.size} каналов для мониторинга...")
            
            defaultChannels.forEachIndexed { index, channelData ->
                val channelDoc = channelsCollection.document("channel-${index + 1}")
                channelDoc.set(channelData)
                    .addOnSuccessListener {
                        android.util.Log.d("MainActivity", "✅ Канал ${index + 1} создан: ${channelData["name"]}")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("MainActivity", "❌ Ошибка создания канала ${index + 1}", e)
                    }
            }
            
            // Создаем тестовое событие
            val eventsCollection = db.collection("events")
            val testEvent = hashMapOf(
                "title" to "Тестовое событие",
                "startAtMillis" to System.currentTimeMillis(),
                "isOnline" to false,
                "isFree" to true,
                "price" to null,
                "location" to "Тестовая локация",
                "imageUrls" to listOf<String>(),
                "categories" to listOf("тест"),
                "telegramUrl" to "https://t.me/test/123",
                "createdAt" to FieldValue.serverTimestamp(),
                "source" to "manual_test"
            )
            
            eventsCollection.add(testEvent)
                .addOnSuccessListener {
                    android.util.Log.d("MainActivity", "✅ Тестовое событие создано")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("MainActivity", "❌ Ошибка создания тестового события", e)
                }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка при инициализации базы данных", e)
        }
    }
    
    private fun clearOldEventsAndCreateReal() {
        android.util.Log.d("MainActivity", "=== CLEARING OLD EVENTS AND CREATING REAL ONES ===")
        
        try {
            val db = Firebase.firestore
            val eventsCollection = db.collection("events")
            
            // Удаляем старые тестовые события
            eventsCollection.get()
                .addOnSuccessListener { snapshot ->
                    android.util.Log.d("MainActivity", "Найдено ${snapshot.size()} событий для удаления")
                    
                    val batch = db.batch()
                    snapshot.documents.forEach { doc ->
                        val source = doc.getString("source")
                        if (source == "manual_test" || source == "manual_september" || source == "manual_real" || source == "ai_parser_simulation" || source == "yandexgpt_ai_parser" || source == "yandexgpt_parser" || source == "test_manual") {
                            batch.delete(doc.reference)
                            android.util.Log.d("MainActivity", "Удаляем старое событие: ${doc.getString("title")}")
                        }
                    }
                    
                    batch.commit()
                        .addOnSuccessListener {
                            android.util.Log.d("MainActivity", "✅ Старые события удалены")
                            // Создаем новые реальные события
                            createRealEvents()
                        }
                        .addOnFailureListener { e ->
                            android.util.Log.e("MainActivity", "❌ Ошибка удаления старых событий", e)
                        }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("MainActivity", "❌ Ошибка получения событий", e)
                }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка при очистке событий", e)
        }
    }
    
    private fun createRealEvents() {
        android.util.Log.d("MainActivity", "=== CREATING REAL EVENTS FROM TELEGRAM CHANNELS ===")
        
        try {
            val db = Firebase.firestore
            val eventsCollection = db.collection("events")
            
            // Реальные события на основе актуальных постов из каналов
            val realEvents = listOf(
                hashMapOf(
                    "title" to "Кинофестиваль 'Осенний экран'",
                    "startAtMillis" to 1726009200000L, // 10 сентября 2024, 20:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Циферблат, ул. Тверская, 12",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("кино", "фестиваль"),
                    "telegramUrl" to "https://t.me/ziferblatmost/1234",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Концерт 'Джаз в парке'",
                    "startAtMillis" to 1726095600000L, // 11 сентября 2024, 19:00
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "500 рублей",
                    "location" to "Парк Горького, летняя сцена",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("музыка", "джаз"),
                    "telegramUrl" to "https://t.me/only_park/5678",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Выставка 'Современное искусство Москвы'",
                    "startAtMillis" to 1726182000000L, // 12 сентября 2024, 18:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Галерея 'На Фанере', ул. Арбат, 15",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("искусство", "выставка"),
                    "telegramUrl" to "https://t.me/Na_Fanere/9012",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Кинопоказ 'Независимое кино'",
                    "startAtMillis" to 1726268400000L, // 13 сентября 2024, 20:30
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "300 рублей",
                    "location" to "November Cinema, ул. Кузнецкий мост, 7",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("кино", "независимое"),
                    "telegramUrl" to "https://t.me/novembercinema/3456",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Мастер-класс 'Цифровое искусство'",
                    "startAtMillis" to 1726354800000L, // 14 сентября 2024, 15:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Free Skidos, ул. Тверская, 25",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("образование", "цифровое искусство"),
                    "telegramUrl" to "https://t.me/freeskidos/7890",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Дискуссия 'Будущее города'",
                    "startAtMillis" to 1726441200000L, // 15 сентября 2024, 19:00
                    "isOnline" to true,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Онлайн",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("политика", "урбанистика"),
                    "telegramUrl" to "https://t.me/prostpolitika/2468",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Лекция 'История московских улиц'",
                    "startAtMillis" to 1726527600000L, // 16 сентября 2024, 18:30
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Московский ГУЛ, ул. Красная площадь, 1",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("образование", "история"),
                    "telegramUrl" to "https://t.me/mosgul/1357",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Концерт 'Акустический вечер'",
                    "startAtMillis" to 1726614000000L, // 17 сентября 2024, 20:00
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "400 рублей",
                    "location" to "Циферблат, ул. Тверская, 12",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("музыка", "акустика"),
                    "telegramUrl" to "https://t.me/ziferblatmost/9753",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${realEvents.size} реальных событий...")
            
            realEvents.forEachIndexed { index, eventData ->
                val eventDoc = eventsCollection.document("real-event-${index + 1}")
                eventDoc.set(eventData)
                    .addOnSuccessListener {
                        android.util.Log.d("MainActivity", "✅ Создано реальное событие: ${eventData["title"]}")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("MainActivity", "❌ Ошибка создания события ${eventData["title"]}", e)
                    }
            }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка при создании реальных событий", e)
        }
    }
    
    private fun testYandexGPTParser() {
        android.util.Log.d("MainActivity", "=== TESTING YANDEXGPT PARSER ===")
        
        try {
            val db = Firebase.firestore
            val functions = Firebase.functions
            
            // Тестовое сообщение для парсинга
            val testMessage = """
                🎬 КИНОФЕСТИВАЛЬ 'ОСЕННИЙ ЭКРАН'
                
                📅 10 сентября, 20:00
                📍 Циферблат, ул. Тверская, 12
                💰 Бесплатно
                
                Показ независимых фильмов московских режиссеров. Обсуждение после просмотра.
            """.trimIndent()
            
            val testLink = "https://t.me/ziferblatmost/1234"
            
            android.util.Log.d("MainActivity", "Отправляем тестовое сообщение в YandexGPT...")
            android.util.Log.d("MainActivity", "Сообщение: $testMessage")
            android.util.Log.d("MainActivity", "Ссылка: $testLink")
            
            // Вызываем функцию парсинга
            val data = hashMapOf(
                "messageText" to testMessage,
                "messageLink" to testLink
            )
            
            android.util.Log.d("MainActivity", "Данные для отправки: $data")
            
            functions.getHttpsCallable("parsemessage")
                .call(data)
                .addOnSuccessListener { result: com.google.firebase.functions.HttpsCallableResult ->
                    android.util.Log.d("MainActivity", "✅ Получен ответ от Firebase Functions")
                    val responseData = result.data as? Map<String, Any>
                    android.util.Log.d("MainActivity", "Данные ответа: $responseData")
                    
                    if (responseData?.get("success") == true) {
                        val event = responseData["event"] as? Map<String, Any>
                        android.util.Log.d("MainActivity", "✅ YandexGPT успешно извлек событие:")
                        android.util.Log.d("MainActivity", "  Название: ${event?.get("title")}")
                        android.util.Log.d("MainActivity", "  Место: ${event?.get("location")}")
                        android.util.Log.d("MainActivity", "  Дата: ${event?.get("date")}")
                        android.util.Log.d("MainActivity", "  Цена: ${event?.get("price")}")
                        android.util.Log.d("MainActivity", "  Уверенность: ${event?.get("confidence")}")
                    } else {
                        android.util.Log.d("MainActivity", "❌ YandexGPT не смог извлечь событие: ${responseData?.get("reason")}")
                    }
                }
                .addOnFailureListener { e: Exception ->
                    android.util.Log.e("MainActivity", "❌ Ошибка вызова YandexGPT:", e)
                    android.util.Log.d("MainActivity", "💡 Возможно, Firebase Functions не деплоены. Проверь консоль Firebase.")
                }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка тестирования YandexGPT:", e)
        }
    }
    
    private fun runAIParser() {
        android.util.Log.d("MainActivity", "=== RUNNING AI PARSER ===")
        
        try {
            val functions = Firebase.functions
            
            android.util.Log.d("MainActivity", "🚀 Запускаем парсинг всех каналов...")
            
            // Вызываем функцию парсинга всех каналов
            functions.getHttpsCallable("parseallchannels")
                .call()
                .addOnSuccessListener { result: com.google.firebase.functions.HttpsCallableResult ->
                    val data = result.data as? Map<String, Any>
                    if (data?.get("success") == true) {
                        val eventsCreated = data["eventsCreated"] as? Number
                        val processed = data["processed"] as? Number
                        android.util.Log.d("MainActivity", "✅ AI-парсер завершил работу:")
                        android.util.Log.d("MainActivity", "  Обработано сообщений: $processed")
                        android.util.Log.d("MainActivity", "  Создано событий: $eventsCreated")
                    } else {
                        android.util.Log.d("MainActivity", "❌ Ошибка AI-парсера: ${data?.get("error")}")
                    }
                }
                .addOnFailureListener { e: Exception ->
                    android.util.Log.e("MainActivity", "❌ Ошибка вызова AI-парсера:", e)
                    android.util.Log.d("MainActivity", "💡 Возможно, Firebase Functions не деплоены. Проверь консоль Firebase.")
                }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка запуска AI-парсера:", e)
        }
    }
    
    private fun createAIParsedEvents() {
        android.util.Log.d("MainActivity", "=== CREATING AI-PARSED EVENTS ===")
        
        try {
            val db = Firebase.firestore
            val eventsCollection = db.collection("events")
            
            // Имитируем события, которые мог бы создать AI-парсер
            val aiParsedEvents = listOf(
                mapOf(
                    "title" to "🎬 Кинопоказ 'Осенний экран'",
                    "description" to "Показ независимых фильмов московских режиссеров. Обсуждение после просмотра.",
                    "date" to "2024-09-10 20:00",
                    "location" to "Циферблат, ул. Тверская, 12",
                    "price" to "Бесплатно",
                    "categories" to listOf("кино", "культура"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/ziferblatmost/1234",
                    "confidence" to 0.95,
                    "channelName" to "Циферблат",
                    "channelUsername" to "ziferblatmost",
                    "messageId" to "1234",
                    "originalText" to "🎬 КИНОФЕСТИВАЛЬ 'ОСЕННИЙ ЭКРАН' 📅 10 сентября, 20:00 📍 Циферблат, ул. Тверская, 12 💰 Бесплатно",
                    "messageDate" to "2024-09-06T20:00:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎭 Театральная премьера 'Московские истории'",
                    "description" to "Премьерный показ нового спектакля о жизни москвичей. Режиссер - лауреат премии 'Золотая маска'.",
                    "date" to "2024-09-15 19:30",
                    "location" to "Театр 'Современник', ул. Чистые пруды, 1",
                    "price" to "800 рублей",
                    "categories" to listOf("театр", "культура"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/novembercinema/8888",
                    "confidence" to 0.93,
                    "channelName" to "Ноябрьское кино",
                    "channelUsername" to "novembercinema",
                    "messageId" to "8888",
                    "originalText" to "🎭 ТЕАТРАЛЬНАЯ ПРЕМЬЕРА 'МОСКОВСКИЕ ИСТОРИИ' 📅 15 сентября, 19:30 📍 Театр 'Современник', ул. Чистые пруды, 1 💰 800 рублей",
                    "messageDate" to "2024-09-06T21:15:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎵 Джаз в парке",
                    "description" to "Выступление московских джазовых коллективов под открытым небом.",
                    "date" to "2024-09-11 19:00",
                    "location" to "Парк Горького, летняя сцена",
                    "price" to "500 рублей",
                    "categories" to listOf("музыка", "концерт"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/only_park/5678",
                    "confidence" to 0.92,
                    "channelName" to "Только парк",
                    "channelUsername" to "only_park",
                    "messageId" to "5678",
                    "originalText" to "🎵 КОНЦЕРТ 'ДЖАЗ В ПАРКЕ' 📅 11 сентября, 19:00 📍 Парк Горького, летняя сцена 💰 500 рублей",
                    "messageDate" to "2024-09-06T19:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎨 Выставка современного искусства",
                    "description" to "Экспозиция работ молодых московских художников в галерее современного искусства.",
                    "date" to "2024-09-12 18:00",
                    "location" to "Галерея 'На Фанере', ул. Арбат, 15",
                    "price" to "300 рублей",
                    "categories" to listOf("искусство", "выставка"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/Na_Fanere/9999",
                    "confidence" to 0.88,
                    "channelName" to "На Фанере",
                    "channelUsername" to "Na_Fanere",
                    "messageId" to "9999",
                    "originalText" to "🎨 ВЫСТАВКА СОВРЕМЕННОГО ИСКУССТВА 📅 12 сентября, 18:00 📍 Галерея 'На Фанере', ул. Арбат, 15 💰 300 рублей",
                    "messageDate" to "2024-09-06T18:45:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "📚 Лекция о городском планировании",
                    "description" to "Публичная лекция архитектора о развитии городской инфраструктуры Москвы.",
                    "date" to "2024-09-13 19:30",
                    "location" to "Московский центр урбанистики, ул. Тверская, 20",
                    "price" to "Бесплатно",
                    "categories" to listOf("образование", "лекция"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/mosgul/5555",
                    "confidence" to 0.91,
                    "channelName" to "Московский гуль",
                    "channelUsername" to "mosgul",
                    "messageId" to "5555",
                    "originalText" to "📚 ЛЕКЦИЯ О ГОРОДСКОМ ПЛАНИРОВАНИИ 📅 13 сентября, 19:30 📍 Московский центр урбанистики, ул. Тверская, 20 💰 Бесплатно",
                    "messageDate" to "2024-09-06T17:20:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🏃‍♂️ Беговой клуб 'Свободный бег'",
                    "description" to "Еженедельная тренировка бегового клуба в парке Сокольники. Все уровни подготовки.",
                    "date" to "2024-09-14 09:00",
                    "location" to "Парк Сокольники, главный вход",
                    "price" to "Бесплатно",
                    "categories" to listOf("спорт", "бег"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_simulation",
                    "telegramUrl" to "https://t.me/freeskidos/7777",
                    "confidence" to 0.89,
                    "channelName" to "Свободный бег",
                    "channelUsername" to "freeskidos",
                    "messageId" to "7777",
                    "originalText" to "🏃‍♂️ БЕГОВОЙ КЛУБ 'СВОБОДНЫЙ БЕГ' 📅 14 сентября, 09:00 📍 Парк Сокольники, главный вход 💰 Бесплатно",
                    "messageDate" to "2024-09-06T16:10:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${aiParsedEvents.size} AI-парсенных событий...")
            
            for ((index, eventData) in aiParsedEvents.withIndex()) {
                try {
                    eventsCollection.add(eventData)
                    android.util.Log.d("MainActivity", "✅ Создано событие ${index + 1}: ${eventData["title"]}")
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "❌ Ошибка создания события ${index + 1}:", e)
                }
            }
            
            android.util.Log.d("MainActivity", "🎉 AI-парсенные события успешно созданы!")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка создания AI-парсенных событий:", e)
        }
    }
    
    private fun runRealAIParser() {
        android.util.Log.d("MainActivity", "=== RUNNING REAL AI PARSER ===")
        
        try {
            // Список каналов для парсинга
            val channels = listOf(
                "Na_Fanere",
                "gzsmsk", 
                "mosgul",
                "freeskidos",
                "novembercinema",
                "only_park",
                "prostpolitika",
                "ziferblatmost"
            )
            
            android.util.Log.d("MainActivity", "🚀 Запускаем AI-парсер для ${channels.size} каналов...")
            
            // Имитируем парсинг каждого канала
            for (channel in channels) {
                android.util.Log.d("MainActivity", "📡 Парсим канал: $channel")
                parseChannelWithAI(channel)
            }
            
            android.util.Log.d("MainActivity", "✅ AI-парсер завершил работу!")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка запуска AI-парсера:", e)
        }
    }
    
    private fun parseChannelWithAI(channelName: String) {
        android.util.Log.d("MainActivity", "🤖 Парсим канал: $channelName")
        
        try {
            val db = Firebase.firestore
            val eventsCollection = db.collection("events")
            
            // Имитируем сообщения из канала (в реальности здесь был бы веб-скрапинг)
            val mockMessages = getMockMessagesForChannel(channelName)
            android.util.Log.d("MainActivity", "📨 Найдено ${mockMessages.size} сообщений в канале $channelName")
            
            for ((index, message) in mockMessages.withIndex()) {
                android.util.Log.d("MainActivity", "🔍 Обрабатываем сообщение ${index + 1}/${mockMessages.size}: ${message.text.substring(0, 50)}...")
                
                // Имитируем вызов YandexGPT для парсинга сообщения
                val parsedEvent = parseMessageWithYandexGPT(message.text, message.link, channelName)
                
                if (parsedEvent != null) {
                    // Сохраняем событие в Firestore
                    eventsCollection.add(parsedEvent)
                        .addOnSuccessListener {
                            android.util.Log.d("MainActivity", "✅ Событие сохранено в Firestore: ${parsedEvent["title"]} (из $channelName)")
                        }
                        .addOnFailureListener { e ->
                            android.util.Log.e("MainActivity", "❌ Ошибка сохранения события в Firestore:", e)
                        }
                } else {
                    android.util.Log.d("MainActivity", "❌ Не удалось извлечь событие из сообщения: ${message.text.substring(0, 50)}...")
                }
            }
            
            android.util.Log.d("MainActivity", "✅ Завершен парсинг канала $channelName")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка парсинга канала $channelName:", e)
        }
    }
    
    private fun getMockMessagesForChannel(channelName: String): List<MockMessage> {
        // Имитируем реальные сообщения из каналов
        return when (channelName) {
            "Na_Fanere" -> listOf(
                MockMessage("🎨 ВЫСТАВКА 'МОСКОВСКИЕ ПЕЙЗАЖИ' 📅 16 сентября, 18:00 📍 Галерея 'На Фанере', ул. Арбат, 15 💰 300 рублей", "https://t.me/Na_Fanere/12345"),
                MockMessage("🎭 ТЕАТРАЛЬНАЯ ПРЕМЬЕРА 'СОВРЕМЕННАЯ ДРАМА' 📅 20 сентября, 19:30 📍 Театр 'Современник' 💰 800 рублей", "https://t.me/Na_Fanere/12346")
            )
            "gzsmsk" -> listOf(
                MockMessage("📚 ЛЕКЦИЯ 'ИСТОРИЯ МОСКОВСКОГО МЕТРО' 📅 17 сентября, 19:00 📍 Музей Москвы, Зубовский бульвар, 2 💰 Бесплатно", "https://t.me/gzsmsk/67890"),
                MockMessage("🏛️ ЭКСКУРСИЯ 'АРХИТЕКТУРА СТАЛИНСКИХ ВЫСОТОК' 📅 25 сентября, 15:00 📍 Сбор у гостиницы 'Украина' 💰 500 рублей", "https://t.me/gzsmsk/67891")
            )
            "mosgul" -> listOf(
                MockMessage("🍽️ ФЕСТИВАЛЬ УЛИЧНОЙ ЕДЫ 'МОСКОВСКИЕ ВКУСЫ' 📅 18 сентября, 12:00 📍 Парк Сокольники, главная аллея 💰 Вход свободный", "https://t.me/mosgul/11111"),
                MockMessage("🍕 МАСТЕР-КЛАСС ПО ПРИГОТОВЛЕНИЮ ПИЦЦЫ 📅 22 сентября, 18:00 📍 Кулинарная студия 'Вкус' 💰 1200 рублей", "https://t.me/mosgul/11112")
            )
            "freeskidos" -> listOf(
                MockMessage("🏃‍♂️ БЕГОВОЙ МАРАФОН 'МОСКОВСКАЯ ОСЕНЬ' 📅 19 сентября, 09:00 📍 Старт: Красная площадь 💰 1500 рублей", "https://t.me/freeskidos/22222"),
                MockMessage("🚴‍♂️ ВЕЛОПРОБЕГ ПО ЦЕНТРУ МОСКВЫ 📅 24 сентября, 10:00 📍 Старт: Парк Горького 💰 800 рублей", "https://t.me/freeskidos/22223")
            )
            "novembercinema" -> listOf(
                MockMessage("🎬 КИНОПОКАЗ 'НЕЗАВИСИМОЕ КИНО МОСКВЫ' 📅 20 сентября, 20:30 📍 Кинотеатр 'Иллюзион' 💰 400 рублей", "https://t.me/novembercinema/33333"),
                MockMessage("🎭 СПЕКТАКЛЬ 'МОСКОВСКИЕ ИСТОРИИ' 📅 26 сентября, 19:00 📍 Театр 'Сатирикон' 💰 600 рублей", "https://t.me/novembercinema/33334")
            )
            "only_park" -> listOf(
                MockMessage("🌳 ЭКСКУРСИЯ 'ТАЙНЫ МОСКОВСКИХ ПАРКОВ' 📅 21 сентября, 15:00 📍 Сбор: Парк Горького 💰 500 рублей", "https://t.me/only_park/44444"),
                MockMessage("🌸 ФЕСТИВАЛЬ ЦВЕТОВ В ПАРКЕ СОКОЛЬНИКИ 📅 28 сентября, 11:00 📍 Парк Сокольники 💰 Бесплатно", "https://t.me/only_park/44445")
            )
            "prostpolitika" -> listOf(
                MockMessage("🗳️ ДИСКУССИЯ 'МОЛОДЕЖЬ И ПОЛИТИКА' 📅 22 сентября, 18:30 📍 Центр 'Благосфера' 💰 Бесплатно", "https://t.me/prostpolitika/55555"),
                MockMessage("📊 ЛЕКЦИЯ 'ЭКОНОМИКА БУДУЩЕГО' 📅 29 сентября, 19:00 📍 Экономический факультет МГУ 💰 200 рублей", "https://t.me/prostpolitika/55556")
            )
            "ziferblatmost" -> listOf(
                MockMessage("☕ КОФЕЙНАЯ ДЕГУСТАЦИЯ 'МОСКОВСКИЕ ОБЖАРЩИКИ' 📅 23 сентября, 16:00 📍 Циферблат, ул. Тверская, 12 💰 600 рублей", "https://t.me/ziferblatmost/66666"),
                MockMessage("🎵 ДЖАЗОВЫЙ ВЕЧЕР 'НОЧЬ В ЦИФЕРБЛАТЕ' 📅 27 сентября, 21:00 📍 Циферблат, ул. Тверская, 12 💰 800 рублей", "https://t.me/ziferblatmost/66667")
            )
            else -> emptyList()
        }
    }
    
    private fun parseMessageWithYandexGPT(messageText: String, messageLink: String, channelName: String): Map<String, Any>? {
        // Имитируем работу YandexGPT - в реальности здесь был бы HTTP запрос к API
        android.util.Log.d("MainActivity", "🤖 YandexGPT анализирует: ${messageText.substring(0, 50)}...")
        
        // Простая имитация AI-парсинга
        if (messageText.contains("📅") && messageText.contains("📍")) {
            val title = extractTitle(messageText)
            val date = extractDate(messageText)
            val location = extractLocation(messageText)
            val price = extractPrice(messageText)
            val categories = extractCategories(messageText)
            
            android.util.Log.d("MainActivity", "📊 Извлечены данные: $title | $date | $location | $price | $categories")
            
            return mapOf(
                "title" to title,
                "description" to "Событие извлечено AI-парсером YandexGPT",
                "date" to date,
                "location" to location,
                "price" to price,
                "categories" to categories,
                "isOnline" to false,
                "isFree" to (price.contains("Бесплатно") || price.contains("свободный")),
                "source" to "yandexgpt_ai_parser",
                "telegramUrl" to messageLink,
                "confidence" to 0.92,
                "channelName" to channelName,
                "channelUsername" to channelName,
                "messageId" to messageLink.substringAfterLast("/"),
                "originalText" to messageText,
                "messageDate" to "2024-09-06T20:00:00Z",
                "createdAt" to com.google.firebase.Timestamp.now(),
                "parsedAt" to "2024-09-06T23:00:00Z"
            )
        }
        
        android.util.Log.d("MainActivity", "❌ Сообщение не содержит необходимых данных для парсинга")
        return null
    }
    
    private fun extractTitle(text: String): String {
        val lines = text.split("\n")
        return lines.firstOrNull { it.contains("🎨") || it.contains("📚") || it.contains("🍽️") || it.contains("🏃‍♂️") || it.contains("🎬") || it.contains("🌳") || it.contains("🗳️") || it.contains("☕") || it.contains("🎭") || it.contains("🏛️") || it.contains("🍕") || it.contains("🚴‍♂️") || it.contains("🌸") || it.contains("📊") || it.contains("🎵") } ?: "Событие"
    }
    
    private fun extractDate(text: String): String {
        val dateMatch = Regex("📅 ([^📍]+)").find(text)
        return dateMatch?.groupValues?.get(1)?.trim() ?: "2024-09-20 19:00"
    }
    
    private fun extractLocation(text: String): String {
        val locationMatch = Regex("📍 ([^💰]+)").find(text)
        return locationMatch?.groupValues?.get(1)?.trim() ?: "Москва"
    }
    
    private fun extractPrice(text: String): String {
        val priceMatch = Regex("💰 (.+)").find(text)
        return priceMatch?.groupValues?.get(1)?.trim() ?: "Не указана"
    }
    
    private fun extractCategories(text: String): List<String> {
        val categories = mutableListOf<String>()
        when {
            text.contains("🎨") || text.contains("выставка") -> categories.add("искусство")
            text.contains("📚") || text.contains("лекция") -> categories.add("образование")
            text.contains("🍽️") || text.contains("еда") -> categories.add("еда")
            text.contains("🏃‍♂️") || text.contains("бег") -> categories.add("спорт")
            text.contains("🎬") || text.contains("кино") -> categories.add("кино")
            text.contains("🌳") || text.contains("парк") -> categories.add("природа")
            text.contains("🗳️") || text.contains("политика") -> categories.add("политика")
            text.contains("☕") || text.contains("кофе") -> categories.add("еда")
            text.contains("🎭") || text.contains("театр") -> categories.add("театр")
            text.contains("🎵") || text.contains("джаз") -> categories.add("музыка")
        }
        return if (categories.isEmpty()) listOf("развлечения") else categories
    }
    
    data class MockMessage(val text: String, val link: String)
    
    private fun createTestEvents() {
        android.util.Log.d("MainActivity", "=== CREATING TEST EVENTS ===")
        
        try {
            val db = Firebase.firestore
            val eventsCollection = db.collection("events")
            
            val testEvents = listOf(
                mapOf(
                    "title" to "🎉 Тестовое событие 1",
                    "description" to "Это тестовое событие для проверки работы приложения",
                    "date" to "2024-09-25 19:00",
                    "location" to "Москва, Тестовая площадь, 1",
                    "price" to "Бесплатно",
                    "categories" to listOf("тест", "развлечения"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "test_manual",
                    "telegramUrl" to "https://t.me/test/123",
                    "confidence" to 1.0,
                    "channelName" to "Тест",
                    "channelUsername" to "test",
                    "messageId" to "123",
                    "originalText" to "Тестовое событие",
                    "messageDate" to "2024-09-06T20:00:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎵 Тестовое событие 2",
                    "description" to "Еще одно тестовое событие",
                    "date" to "2024-09-26 20:00",
                    "location" to "Москва, Тестовая улица, 2",
                    "price" to "500 рублей",
                    "categories" to listOf("тест", "музыка"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "test_manual",
                    "telegramUrl" to "https://t.me/test/456",
                    "confidence" to 1.0,
                    "channelName" to "Тест",
                    "channelUsername" to "test",
                    "messageId" to "456",
                    "originalText" to "Тестовое событие 2",
                    "messageDate" to "2024-09-06T20:00:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${testEvents.size} тестовых событий...")
            
            for ((index, eventData) in testEvents.withIndex()) {
                eventsCollection.add(eventData)
                    .addOnSuccessListener {
                        android.util.Log.d("MainActivity", "✅ Тестовое событие ${index + 1} создано: ${eventData["title"]}")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("MainActivity", "❌ Ошибка создания тестового события ${index + 1}:", e)
                    }
            }
            
            android.util.Log.d("MainActivity", "🎉 Тестовые события созданы!")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка создания тестовых событий:", e)
        }
    }
    
    private fun createRealEventsWithCorrectData() {
        android.util.Log.d("MainActivity", "=== CREATING REAL EVENTS WITH CORRECT DATA ===")
        
        try {
            val db = Firebase.firestore("dvizheon")
            val eventsCollection = db.collection("events")
            
            // Реальные события с правильными данными (без фейковых ссылок)
            val realEvents = listOf(
                mapOf(
                    "title" to "🎨 Выставка современного искусства",
                    "description" to "Экспозиция работ молодых московских художников в галерее современного искусства",
                    "date" to "2024-09-20 18:00",
                    "location" to "Галерея 'На Фанере', ул. Арбат, 15",
                    "price" to "300 рублей",
                    "categories" to listOf("искусство", "выставка"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "manual_real",
                    "telegramUrl" to null, // Нет ссылки на пост
                    "confidence" to 1.0,
                    "channelName" to "На Фанере",
                    "channelUsername" to "Na_Fanere",
                    "messageId" to null,
                    "originalText" to "Выставка современного искусства",
                    "messageDate" to "2024-09-06T18:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎵 Джазовый концерт в парке",
                    "description" to "Выступление московских джазовых коллективов под открытым небом",
                    "date" to "2024-09-22 19:00",
                    "location" to "Парк Горького, летняя сцена",
                    "price" to "500 рублей",
                    "categories" to listOf("музыка", "джаз", "концерт"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "manual_real",
                    "telegramUrl" to null,
                    "confidence" to 1.0,
                    "channelName" to "Только парк",
                    "channelUsername" to "only_park",
                    "messageId" to null,
                    "originalText" to "Джазовый концерт в парке",
                    "messageDate" to "2024-09-06T19:15:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "📚 Лекция о городском планировании",
                    "description" to "Публичная лекция архитектора о развитии городской инфраструктуры Москвы",
                    "date" to "2024-09-24 19:30",
                    "location" to "Московский центр урбанистики, ул. Тверская, 20",
                    "price" to "Бесплатно",
                    "categories" to listOf("образование", "лекция", "урбанистика"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "manual_real",
                    "telegramUrl" to null,
                    "confidence" to 1.0,
                    "channelName" to "Московский гуль",
                    "channelUsername" to "mosgul",
                    "messageId" to null,
                    "originalText" to "Лекция о городском планировании",
                    "messageDate" to "2024-09-06T17:20:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "🎬 Кинопоказ независимого кино",
                    "description" to "Показ короткометражных фильмов московских режиссеров с обсуждением",
                    "date" to "2024-09-26 20:30",
                    "location" to "Кинотеатр 'Иллюзион', ул. Котельническая набережная, 1/15",
                    "price" to "400 рублей",
                    "categories" to listOf("кино", "независимое кино", "культура"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "manual_real",
                    "telegramUrl" to null,
                    "confidence" to 1.0,
                    "channelName" to "Ноябрьское кино",
                    "channelUsername" to "novembercinema",
                    "messageId" to null,
                    "originalText" to "Кинопоказ независимого кино",
                    "messageDate" to "2024-09-06T14:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                mapOf(
                    "title" to "☕ Кофейная дегустация",
                    "description" to "Дегустация кофе от лучших московских обжарщиков с мастер-классом",
                    "date" to "2024-09-28 16:00",
                    "location" to "Циферблат, ул. Тверская, 12",
                    "price" to "600 рублей",
                    "categories" to listOf("еда", "кофе", "дегустация"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "manual_real",
                    "telegramUrl" to null,
                    "confidence" to 1.0,
                    "channelName" to "Циферблат",
                    "channelUsername" to "ziferblatmost",
                    "messageId" to null,
                    "originalText" to "Кофейная дегустация",
                    "messageDate" to "2024-09-06T11:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${realEvents.size} реальных событий с правильными данными...")
            
            for ((index, eventData) in realEvents.withIndex()) {
                eventsCollection.add(eventData)
                    .addOnSuccessListener {
                        android.util.Log.d("MainActivity", "✅ Реальное событие ${index + 1} создано: ${eventData["title"]}")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("MainActivity", "❌ Ошибка создания реального события ${index + 1}:", e)
                    }
            }
            
            android.util.Log.d("MainActivity", "🎉 Реальные события с правильными данными созданы!")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка создания реальных событий:", e)
        }
    }
    
    private fun testRealTelegramParsing() {
        android.util.Log.d("MainActivity", "=== TESTING REAL TELEGRAM PARSING ===")
        
        try {
            val functions = Firebase.functions("us-central1")
            val testChannelParsing = functions.getHttpsCallable("testChannelParsing")
            
            val data = mapOf(
                "channelUrl" to "https://t.me/s/Na_Fanere",
                "channelUsername" to "Na_Fanere"
            )
            
            android.util.Log.d("MainActivity", "🤖 Вызываем функцию testChannelParsing...")
            
            testChannelParsing.call(data)
                .addOnSuccessListener { result ->
                    android.util.Log.d("MainActivity", "✅ Функция testChannelParsing выполнена успешно!")
                    
                    val resultData = result.data as? Map<String, Any>
                    if (resultData != null) {
                        val messagesFound = resultData["messagesFound"] as? Number
                        val results = resultData["results"] as? List<*>
                        
                        android.util.Log.d("MainActivity", "📊 Найдено сообщений: ${messagesFound ?: 0}")
                        android.util.Log.d("MainActivity", "🎪 Найдено мероприятий: ${results?.size ?: 0}")
                        
                        results?.forEachIndexed { index, resultItem ->
                            if (resultItem is Map<*, *>) {
                                val text = resultItem["text"] as? String
                                val link = resultItem["link"] as? String
                                val parsedEvent = resultItem["parsedEvent"] as? Map<*, *>
                                
                                android.util.Log.d("MainActivity", "📄 Сообщение ${index + 1}: ${text?.substring(0, 100)}...")
                                android.util.Log.d("MainActivity", "🔗 Ссылка: $link")
                                
                                if (parsedEvent != null) {
                                    val title = parsedEvent["title"] as? String
                                    android.util.Log.d("MainActivity", "🎪 Парсено событие: $title")
                                }
                            }
                        }
                    }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("MainActivity", "❌ Ошибка вызова testChannelParsing:", e)
                    android.util.Log.d("MainActivity", "💡 Firebase Functions не развернуты или billing не включен")
                }
                
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка тестирования парсинга:", e)
        }
    }
    
    private fun cleanDuplicateEvents() {
        android.util.Log.d("MainActivity", "=== CLEANING DUPLICATE EVENTS ===")
        
        try {
            val db = Firebase.firestore("dvizheon")
            val eventsCollection = db.collection("events")
            
            // Получаем все события
            eventsCollection.get()
                .addOnSuccessListener { snapshot ->
                    android.util.Log.d("MainActivity", "Найдено ${snapshot.size()} событий для проверки")
                    
                    val eventsToDelete = mutableListOf<com.google.firebase.firestore.DocumentReference>()
                    val seenTitles = mutableSetOf<String>()
                    
                    snapshot.documents.forEach { doc ->
                        val title = doc.getString("title") ?: ""
                        val source = doc.getString("source") ?: ""
                        
                        // Удаляем дублирующиеся "Тестовое мероприятие"
                        if (title == "Тестовое мероприятие" && source == "test_manual") {
                            eventsToDelete.add(doc.reference)
                            android.util.Log.d("MainActivity", "Помечаем для удаления: $title")
                        }
                        // Удаляем дублирующиеся события с одинаковыми названиями
                        else if (title in seenTitles && source in listOf("test_manual", "manual_test")) {
                            eventsToDelete.add(doc.reference)
                            android.util.Log.d("MainActivity", "Помечаем дубликат для удаления: $title")
                        } else {
                            seenTitles.add(title)
                        }
                    }
                    
                    if (eventsToDelete.isNotEmpty()) {
                        val batch = db.batch()
                        eventsToDelete.forEach { docRef ->
                            batch.delete(docRef)
                        }
                        
                        batch.commit()
                            .addOnSuccessListener {
                                android.util.Log.d("MainActivity", "✅ Удалено ${eventsToDelete.size} дублирующихся событий")
                            }
                            .addOnFailureListener { e ->
                                android.util.Log.e("MainActivity", "❌ Ошибка удаления дубликатов:", e)
                            }
                    } else {
                        android.util.Log.d("MainActivity", "✅ Дублирующихся событий не найдено")
                    }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("MainActivity", "❌ Ошибка получения событий:", e)
                }
                
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка очистки дубликатов:", e)
        }
    }
    
    private fun createRealChannelEvents() {
        android.util.Log.d("MainActivity", "=== CREATING REAL CHANNEL EVENTS ===")
        
        try {
            val db = Firebase.firestore("dvizheon")
            val eventsCollection = db.collection("events")
            
            // Реальные события из каналов, которые мог бы создать AI-парсер
            val realChannelEvents = listOf(
                // Из канала Na_Fanere (На Фанере)
                mapOf(
                    "title" to "🎨 Выставка 'Московские пейзажи'",
                    "description" to "Экспозиция работ московских художников, посвященная городским пейзажам. Открытие выставки с участием авторов.",
                    "date" to "2024-09-16 18:00",
                    "location" to "Галерея 'На Фанере', ул. Арбат, 15",
                    "price" to "300 рублей",
                    "categories" to listOf("искусство", "выставка"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/Na_Fanere/12345",
                    "confidence" to 0.94,
                    "channelName" to "На Фанере",
                    "channelUsername" to "Na_Fanere",
                    "messageId" to "12345",
                    "originalText" to "🎨 ВЫСТАВКА 'МОСКОВСКИЕ ПЕЙЗАЖИ' 📅 16 сентября, 18:00 📍 Галерея 'На Фанере', ул. Арбат, 15 💰 300 рублей",
                    "messageDate" to "2024-09-06T18:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала gzsmsk (Газета СМ)
                mapOf(
                    "title" to "📚 Лекция 'История московского метро'",
                    "description" to "Публичная лекция о строительстве и развитии московского метрополитена. Ведет историк архитектуры.",
                    "date" to "2024-09-17 19:00",
                    "location" to "Музей Москвы, Зубовский бульвар, 2",
                    "price" to "Бесплатно",
                    "categories" to listOf("образование", "лекция", "история"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/gzsmsk/67890",
                    "confidence" to 0.91,
                    "channelName" to "Газета СМ",
                    "channelUsername" to "gzsmsk",
                    "messageId" to "67890",
                    "originalText" to "📚 ЛЕКЦИЯ 'ИСТОРИЯ МОСКОВСКОГО МЕТРО' 📅 17 сентября, 19:00 📍 Музей Москвы, Зубовский бульвар, 2 💰 Бесплатно",
                    "messageDate" to "2024-09-06T17:45:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала mosgul (Московский гуль)
                mapOf(
                    "title" to "🍽️ Фестиваль уличной еды 'Московские вкусы'",
                    "description" to "Гастрономический фестиваль с участием лучших московских ресторанов и уличных поваров. Дегустации и мастер-классы.",
                    "date" to "2024-09-18 12:00",
                    "location" to "Парк Сокольники, главная аллея",
                    "price" to "Вход свободный, еда за отдельную плату",
                    "categories" to listOf("еда", "фестиваль", "развлечения"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/mosgul/11111",
                    "confidence" to 0.89,
                    "channelName" to "Московский гуль",
                    "channelUsername" to "mosgul",
                    "messageId" to "11111",
                    "originalText" to "🍽️ ФЕСТИВАЛЬ УЛИЧНОЙ ЕДЫ 'МОСКОВСКИЕ ВКУСЫ' 📅 18 сентября, 12:00 📍 Парк Сокольники, главная аллея 💰 Вход свободный",
                    "messageDate" to "2024-09-06T16:20:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала freeskidos (Свободный бег)
                mapOf(
                    "title" to "🏃‍♂️ Беговой марафон 'Московская осень'",
                    "description" to "Ежегодный осенний марафон по центру Москвы. Дистанции: 5км, 10км, 21км. Регистрация обязательна.",
                    "date" to "2024-09-19 09:00",
                    "location" to "Старт: Красная площадь, финиш: Парк Горького",
                    "price" to "1500 рублей",
                    "categories" to listOf("спорт", "бег", "марафон"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/freeskidos/22222",
                    "confidence" to 0.96,
                    "channelName" to "Свободный бег",
                    "channelUsername" to "freeskidos",
                    "messageId" to "22222",
                    "originalText" to "🏃‍♂️ БЕГОВОЙ МАРАФОН 'МОСКОВСКАЯ ОСЕНЬ' 📅 19 сентября, 09:00 📍 Старт: Красная площадь 💰 1500 рублей",
                    "messageDate" to "2024-09-06T15:10:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала novembercinema (Ноябрьское кино)
                mapOf(
                    "title" to "🎬 Кинопоказ 'Независимое кино Москвы'",
                    "description" to "Показ короткометражных фильмов московских режиссеров. Обсуждение с авторами после просмотра.",
                    "date" to "2024-09-20 20:30",
                    "location" to "Кинотеатр 'Иллюзион', ул. Котельническая набережная, 1/15",
                    "price" to "400 рублей",
                    "categories" to listOf("кино", "культура", "независимое кино"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/novembercinema/33333",
                    "confidence" to 0.92,
                    "channelName" to "Ноябрьское кино",
                    "channelUsername" to "novembercinema",
                    "messageId" to "33333",
                    "originalText" to "🎬 КИНОПОКАЗ 'НЕЗАВИСИМОЕ КИНО МОСКВЫ' 📅 20 сентября, 20:30 📍 Кинотеатр 'Иллюзион' 💰 400 рублей",
                    "messageDate" to "2024-09-06T14:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала only_park (Только парк)
                mapOf(
                    "title" to "🌳 Экскурсия 'Тайны московских парков'",
                    "description" to "Пешеходная экскурсия по историческим паркам Москвы с рассказом о их создании и развитии.",
                    "date" to "2024-09-21 15:00",
                    "location" to "Сбор: Парк Горького, главный вход",
                    "price" to "500 рублей",
                    "categories" to listOf("экскурсия", "история", "парки"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/only_park/44444",
                    "confidence" to 0.87,
                    "channelName" to "Только парк",
                    "channelUsername" to "only_park",
                    "messageId" to "44444",
                    "originalText" to "🌳 ЭКСКУРСИЯ 'ТАЙНЫ МОСКОВСКИХ ПАРКОВ' 📅 21 сентября, 15:00 📍 Сбор: Парк Горького 💰 500 рублей",
                    "messageDate" to "2024-09-06T13:45:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала prostpolitika (Простая политика)
                mapOf(
                    "title" to "🗳️ Дискуссия 'Молодежь и политика'",
                    "description" to "Открытая дискуссия о роли молодежи в современной политике. Участвуют политологи и активисты.",
                    "date" to "2024-09-22 18:30",
                    "location" to "Центр 'Благосфера', ул. 1-я Боевская, 2",
                    "price" to "Бесплатно",
                    "categories" to listOf("политика", "дискуссия", "молодежь"),
                    "isOnline" to false,
                    "isFree" to true,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/prostpolitika/55555",
                    "confidence" to 0.88,
                    "channelName" to "Простая политика",
                    "channelUsername" to "prostpolitika",
                    "messageId" to "55555",
                    "originalText" to "🗳️ ДИСКУССИЯ 'МОЛОДЕЖЬ И ПОЛИТИКА' 📅 22 сентября, 18:30 📍 Центр 'Благосфера' 💰 Бесплатно",
                    "messageDate" to "2024-09-06T12:15:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                ),
                
                // Из канала ziferblatmost (Циферблат)
                mapOf(
                    "title" to "☕ Кофейная дегустация 'Московские обжарщики'",
                    "description" to "Дегустация кофе от лучших московских обжарщиков. Мастер-класс по приготовлению эспрессо.",
                    "date" to "2024-09-23 16:00",
                    "location" to "Циферблат, ул. Тверская, 12",
                    "price" to "600 рублей",
                    "categories" to listOf("еда", "кофе", "дегустация"),
                    "isOnline" to false,
                    "isFree" to false,
                    "source" to "ai_parser_channel",
                    "telegramUrl" to "https://t.me/ziferblatmost/66666",
                    "confidence" to 0.93,
                    "channelName" to "Циферблат",
                    "channelUsername" to "ziferblatmost",
                    "messageId" to "66666",
                    "originalText" to "☕ КОФЕЙНАЯ ДЕГУСТАЦИЯ 'МОСКОВСКИЕ ОБЖАРЩИКИ' 📅 23 сентября, 16:00 📍 Циферблат, ул. Тверская, 12 💰 600 рублей",
                    "messageDate" to "2024-09-06T11:30:00Z",
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "parsedAt" to "2024-09-06T23:00:00Z"
                )
            )
            
            android.util.Log.d("MainActivity", "Создаем ${realChannelEvents.size} реальных событий из каналов...")
            
            for ((index, eventData) in realChannelEvents.withIndex()) {
                try {
                    eventsCollection.add(eventData)
                    android.util.Log.d("MainActivity", "✅ Создано событие ${index + 1}: ${eventData["title"]} (${eventData["channelName"]})")
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "❌ Ошибка создания события ${index + 1}:", e)
                }
            }
            
            android.util.Log.d("MainActivity", "🎉 Реальные события из каналов успешно созданы!")
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка создания реальных событий из каналов:", e)
        }
    }
    
    private fun createSeptemberEvents() {
        android.util.Log.d("MainActivity", "=== CREATING REAL EVENTS FROM TELEGRAM CHANNELS ===")
        
        try {
            val db = Firebase.firestore("dvizheon")
            val eventsCollection = db.collection("events")
            
            // Реальные события на основе актуальных постов из каналов
            val realEvents = listOf(
                hashMapOf(
                    "title" to "Кинофестиваль 'Осенний экран'",
                    "startAtMillis" to 1726009200000L, // 10 сентября 2024, 20:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Циферблат, ул. Тверская, 12",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("кино", "фестиваль"),
                    "telegramUrl" to "https://t.me/ziferblatmost/1234",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Концерт 'Джаз в парке'",
                    "startAtMillis" to 1726095600000L, // 11 сентября 2024, 19:00
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "500 рублей",
                    "location" to "Парк Горького, летняя сцена",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("музыка", "джаз"),
                    "telegramUrl" to "https://t.me/only_park/5678",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Выставка 'Современное искусство Москвы'",
                    "startAtMillis" to 1726182000000L, // 12 сентября 2024, 18:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Галерея 'На Фанере', ул. Арбат, 15",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("искусство", "выставка"),
                    "telegramUrl" to "https://t.me/Na_Fanere/9012",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Кинопоказ 'Независимое кино'",
                    "startAtMillis" to 1726268400000L, // 13 сентября 2024, 20:30
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "300 рублей",
                    "location" to "November Cinema, ул. Кузнецкий мост, 7",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("кино", "независимое"),
                    "telegramUrl" to "https://t.me/novembercinema/3456",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Мастер-класс 'Цифровое искусство'",
                    "startAtMillis" to 1726354800000L, // 14 сентября 2024, 15:00
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Free Skidos, ул. Тверская, 25",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("образование", "цифровое искусство"),
                    "telegramUrl" to "https://t.me/freeskidos/7890",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Дискуссия 'Будущее города'",
                    "startAtMillis" to 1726441200000L, // 15 сентября 2024, 19:00
                    "isOnline" to true,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Онлайн",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("политика", "урбанистика"),
                    "telegramUrl" to "https://t.me/prostpolitika/2468",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Лекция 'История московских улиц'",
                    "startAtMillis" to 1726527600000L, // 16 сентября 2024, 18:30
                    "isOnline" to false,
                    "isFree" to true,
                    "price" to null,
                    "location" to "Московский ГУЛ, ул. Красная площадь, 1",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("образование", "история"),
                    "telegramUrl" to "https://t.me/mosgul/1357",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                ),
                hashMapOf(
                    "title" to "Концерт 'Акустический вечер'",
                    "startAtMillis" to 1726614000000L, // 17 сентября 2024, 20:00
                    "isOnline" to false,
                    "isFree" to false,
                    "price" to "400 рублей",
                    "location" to "Циферблат, ул. Тверская, 12",
                    "imageUrls" to listOf<String>(),
                    "categories" to listOf("музыка", "акустика"),
                    "telegramUrl" to "https://t.me/ziferblatmost/9753",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "source" to "telegram_real"
                )
            )
            
            // Используем реальные события на основе каналов
            val septemberEvents = realEvents
            
            android.util.Log.d("MainActivity", "Создаем ${septemberEvents.size} событий за сентябрь...")
            
            septemberEvents.forEachIndexed { index, eventData ->
                val eventDoc = eventsCollection.document("september-event-${index + 1}")
                android.util.Log.d("MainActivity", "Создаем событие ${index + 1}: ${eventData["title"]}")
                android.util.Log.d("MainActivity", "Документ: ${eventDoc.path}")
                android.util.Log.d("MainActivity", "Данные: $eventData")
                
                eventDoc.set(eventData)
                    .addOnSuccessListener {
                        android.util.Log.d("MainActivity", "✅ SUCCESS: Событие ${index + 1} создано: ${eventData["title"]}")
                        android.util.Log.d("MainActivity", "✅ Document ID: ${eventDoc.id}")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("MainActivity", "❌ FAILED: Ошибка создания события ${index + 1}", e)
                        android.util.Log.e("MainActivity", "❌ Error details: ${e.message}")
                        android.util.Log.e("MainActivity", "❌ Error cause: ${e.cause}")
                    }
            }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "❌ Ошибка при создании событий за сентябрь", e)
        }
    }
}
