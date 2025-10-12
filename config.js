// Конфигурация для YandexGPT и Telegram
module.exports = {
    yandex: {
        api_key: process.env.YANDEX_API_KEY || 'AQVN11cjN62DiB51I6mUAGMPjazp8kPzbDp--vH_',
        folder_id: process.env.YANDEX_FOLDER_ID || 'b1gtv8khmup337o4umc5',
        model: process.env.YANDEX_MODEL || 'yandexgpt'
    },
    telegram: {
        bot_token: process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token_here'
    },
    firebase: {
        project_id: process.env.FIREBASE_PROJECT_ID || 'dvizheon'
    }
};
