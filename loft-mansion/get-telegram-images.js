// Скрипт для получения изображений из Telegram канала OsobnyakKosti
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHANNEL_USERNAME = 'OsobnyakKosti';
const IMAGES_DIR = path.join(__dirname, 'images');

// Создаем папку для изображений, если её нет
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function fetchChannelPage(username, before = null) {
    return new Promise((resolve, reject) => {
        const url = `https://t.me/s/${username}${before ? `?before=${before}` : ''}`;
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractImages(html) {
    const images = [];
    // Ищем все изображения в формате Telegram
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const tgImageRegex = /https:\/\/cdn\d+\.telegram-cdn\.org\/[^"]+/gi;
    
    let match;
    const foundUrls = new Set();
    
    // Ищем через regex
    while ((match = tgImageRegex.exec(html)) !== null) {
        foundUrls.add(match[0]);
    }
    
    // Также ищем через img теги
    while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        if (src.includes('telegram-cdn.org') || src.includes('telegram.org')) {
            foundUrls.add(src);
        }
    }
    
    return Array.from(foundUrls);
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(IMAGES_DIR, filename);
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Редирект
                return downloadImage(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Скачано: ${filename}`);
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function getChannelImages(username, limit = 20) {
    console.log(`📥 Начинаю получение изображений из канала @${username}...`);
    
    const allImages = new Set();
    let before = null;
    let page = 0;
    
    while (page < 5 && allImages.size < limit) {
        console.log(`📄 Загружаю страницу ${page + 1}...`);
        
        try {
            const html = await fetchChannelPage(username, before);
            const images = extractImages(html);
            
            images.forEach(img => allImages.add(img));
            
            // Ищем следующий before параметр
            const beforeMatch = html.match(/before=(\d+)/);
            if (beforeMatch && beforeMatch[1] !== before) {
                before = beforeMatch[1];
            } else {
                break;
            }
            
            page++;
            
            // Небольшая задержка между запросами
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Ошибка при загрузке страницы:`, error.message);
            break;
        }
    }
    
    console.log(`\n📸 Найдено ${allImages.size} изображений\n`);
    
    // Скачиваем изображения
    const imageArray = Array.from(allImages).slice(0, limit);
    let downloaded = 0;
    
    for (let i = 0; i < imageArray.length; i++) {
        const url = imageArray[i];
        const ext = url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
        const filename = `loft-${i + 1}.${ext}`;
        
        try {
            await downloadImage(url, filename);
            downloaded++;
        } catch (error) {
            console.error(`❌ Ошибка при скачивании ${filename}:`, error.message);
        }
        
        // Задержка между скачиваниями
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Скачано ${downloaded} из ${imageArray.length} изображений`);
    console.log(`📁 Изображения сохранены в: ${IMAGES_DIR}`);
    
    return imageArray;
}

// Запуск
if (require.main === module) {
    getChannelImages(CHANNEL_USERNAME, 10)
        .then(() => {
            console.log('\n✨ Готово! Теперь обновите пути к изображениям в HTML/CSS файлах.');
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { getChannelImages };

