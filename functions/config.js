// Конфигурация для YandexGPT и Telegram
module.exports = {
    yandex: {
        api_key: process.env.YANDEX_API_KEY || 'AQVNxiHkCODl9-BAnpVhQRW61w5b8APj3bDVE-82',
        folder_id: process.env.YANDEX_FOLDER_ID || 'b1g58p4ng2h1gu8lehpp',
        model: process.env.YANDEX_MODEL || 'yandexgpt'
    },
    telegram: {
        bot_token: process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || '8283285764:AAF4Mj81dCRFWpjT4Laio2p5J0zrLgXzTlM'
    },
    firebase: {
        project_id: process.env.FIREBASE_PROJECT_ID || 'dvizheon'
    }
};
