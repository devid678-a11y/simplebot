# Настройка Google Maps API

## 1. Получение API ключа

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите следующие API:
   - **Maps SDK for Android**
   - **Geocoding API**
   - **Places API** (опционально)

## 2. Создание API ключа

1. Перейдите в "Credentials" → "Create Credentials" → "API Key"
2. Скопируйте созданный ключ
3. Ограничьте ключ для безопасности:
   - Application restrictions: Android apps
   - Package name: `com.company.dvizhtrue`
   - SHA-1 certificate fingerprint: (получить командой ниже)

## 3. Получение SHA-1 отпечатка

```bash
# Для debug версии
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Для release версии
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## 4. Настройка в приложении

1. Откройте `app/src/main/AndroidManifest.xml`
2. Замените `YOUR_GOOGLE_MAPS_API_KEY` на ваш реальный ключ:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyBvOkBwvBwvBwvBwvBwvBwvBwvBwvBwvBw" />
```

## 5. Проверка

После настройки API ключа:
- Карты будут загружаться нормально
- Геокодирование будет работать
- Приложение не будет крашиться

## Важно!

- Никогда не коммитьте API ключ в публичные репозитории
- Используйте переменные окружения для production
- Ограничьте ключ только вашими приложениями