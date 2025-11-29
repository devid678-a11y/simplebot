// Скрипт для получения фотографий из Telegram канала OsobnyakKosti
// Использует существующий функционал проекта

const fs = require('fs');
const path = require('path');
const https = require('https');

const CHANNEL_USERNAME = 'OsobnyakKosti';
const IMAGES_DIR = path.join(__dirname, 'images');

// Создаем папку для изображений
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('📁 Создана папка images/');
}

async function fetchChannelHTML(username) {
    return new Promise((resolve, reject) => {
        const url = `https://t.me/s/${username}`;
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractImageUrls(html) {
    const images = new Set();
    
    // Паттерны для поиска изображений Telegram
    const patterns = [
        /https:\/\/cdn\d+\.telegram-cdn\.org\/[^"'\s]+/g,
        /https:\/\/telegram\.org\/[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
        /tgme_widget_message_photo[^>]+style="background-image:url\('([^']+)'\)/g
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const url = match[1] || match[0];
            if (url.includes('telegram') && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('cdn'))) {
                // Очищаем URL от параметров для получения оригинала
                const cleanUrl = url.split('?')[0].replace(/\/\d+x\d+/, '');
                images.add(cleanUrl);
            }
        }
    });
    
    return Array.from(images);
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(IMAGES_DIR, filename);
        const file = fs.createWriteStream(filepath);
        
        const protocol = url.startsWith('https') ? https : require('http');
        
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://t.me/'
            }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);
                return downloadImage(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                return reject(new Error(`HTTP ${response.statusCode}`));
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath, () => {});
            }
            reject(err);
        });
    });
}

async function main() {
    console.log('🚀 Начинаю получение фотографий из канала @OsobnyakKosti...\n');
    
    try {
        // Получаем HTML страницы канала
        console.log('📥 Загружаю страницу канала...');
        const html = await fetchChannelHTML(CHANNEL_USERNAME);
        
        // Извлекаем URL изображений
        console.log('🔍 Ищу изображения...');
        const imageUrls = extractImageUrls(html);
        
        console.log(`\n📸 Найдено ${imageUrls.length} изображений\n`);
        
        if (imageUrls.length === 0) {
            console.log('⚠️ Изображения не найдены. Попробуйте:');
            console.log('   1. Открыть канал в браузере: https://t.me/s/OsobnyakKosti');
            console.log('   2. Сохранить фотографии вручную');
            console.log('   3. Поместить их в папку images/');
            return;
        }
        
        // Скачиваем первые 10 изображений
        const limit = Math.min(10, imageUrls.length);
        let downloaded = 0;
        
        for (let i = 0; i < limit; i++) {
            const url = imageUrls[i];
            const ext = url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
            const filename = i === 0 ? 'hero-bg.jpg' : `gallery-${i}.${ext}`;
            
            try {
                console.log(`📥 Скачиваю ${i + 1}/${limit}: ${filename}...`);
                await downloadImage(url, filename);
                downloaded++;
                
                // Задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`   ❌ Ошибка: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Успешно скачано: ${downloaded} из ${limit} изображений`);
        console.log(`📁 Папка: ${IMAGES_DIR}\n`);
        
        // Обновляем CSS с путями к изображениям
        console.log('💡 Теперь обновите пути в styles.css:');
        console.log('   - Фон хедера: images/hero-bg.jpg');
        console.log('   - Галерея: images/gallery-*.jpg');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.log('\n💡 Альтернативный способ:');
        console.log('   1. Откройте https://t.me/s/OsobnyakKosti в браузере');
        console.log('   2. Сохраните фотографии вручную');
        console.log('   3. Поместите их в папку loft-mansion/images/');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fetchChannelHTML, extractImageUrls };

