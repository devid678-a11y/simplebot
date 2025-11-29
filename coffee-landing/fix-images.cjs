const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Заменяем все base64 изображения на прямые ссылки
const imageReplacements = {
    // Hero - используем указанную пользователем ссылку
    'hero': 'https://i2-prod.hulldailymail.co.uk/news/uk-world-news/article8941815.ece/ALTERNATES/s1200/0_GettyImages-1467739359.jpg',
    
    // Остальные - используем надежные источники
    'coffee-machine': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
    'masterclass': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop',
    'tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
    'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
    'ice': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
    'beans': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop',
    'juices': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=400&fit=crop',
    'certificate': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
    'tasting': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=600&h=400&fit=crop'
};

// Заменяем hero изображение
html = html.replace(
    /<img[^>]*class="hero-image"[^>]*>/,
    `<img src="${imageReplacements.hero}" alt="Coffee" class="hero-image">`
);

// Заменяем все data:image на прямые ссылки
html = html.replace(
    /src="data:image[^"]*"/g,
    (match) => {
        if (match.includes('Coffee Machine') || match.includes('coffee-machine')) {
            return `src="${imageReplacements['coffee-machine']}"`;
        } else if (match.includes('Tea') || match.includes('tea')) {
            return `src="${imageReplacements.tea}"`;
        } else if (match.includes('Coffee') || match.includes('coffee')) {
            return `src="${imageReplacements.coffee}"`;
        } else if (match.includes('Ice') || match.includes('ice')) {
            return `src="${imageReplacements.ice}"`;
        } else if (match.includes('Certificate') || match.includes('certificate')) {
            return `src="${imageReplacements.certificate}"`;
        } else if (match.includes('Tasting') || match.includes('tasting')) {
            return `src="${imageReplacements.tasting}"`;
        } else if (match.includes('Masterclass') || match.includes('masterclass')) {
            return `src="${imageReplacements.masterclass}"`;
        } else {
            return `src="${imageReplacements.coffee}"`;
        }
    }
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('All images replaced with direct links!');

