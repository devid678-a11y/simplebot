// Конфигурация для YandexGPT и Telegram
module.exports = {
    yandex: {
        api_key: process.env.YANDEX_API_KEY || '',
        folder_id: process.env.YANDEX_FOLDER_ID || '',
        model: process.env.YANDEX_MODEL || 'yandexgpt'
    },
    telegram: {
        bot_token: process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || ''
    },
    firebase: {
        project_id: process.env.FIREBASE_PROJECT_ID || 'dvizheon'
    }
};
