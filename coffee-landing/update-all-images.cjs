const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Исправляем неправильные ссылки на Unsplash страницы
html = html.replace(
    /src="https:\/\/unsplash\.com\/photos\/[^"]*"/g,
    'src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1920&h=1080&fit=crop"'
);

// Обновляем все изображения мастер-классов на разные
const masterclassImages = [
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop', // Плечом к плечу - команда
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop', // Чай
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop', // Кофе
    'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop', // Лёд
    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop' // Кофейное производство
];

// Заменяем изображения мастер-классов по порядку
let masterclassIndex = 0;
html = html.replace(
    /<img src="https:\/\/images\.unsplash\.com\/photo-1509042239860-f550ce710b93[^"]*" alt="Masterclass"[^>]*>/g,
    (match) => {
        const img = masterclassImages[masterclassIndex % masterclassImages.length];
        masterclassIndex++;
        return match.replace(/src="[^"]*"/, `src="${img}"`);
    }
);

// Обновляем изображения дегустаций
const tastingImages = [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop', // Кофе
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop', // Чай
    'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop', // Коктейли
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=400&fit=crop', // Соки
    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=600&h=400&fit=crop' // Дегустационный сет
];

let tastingIndex = 0;
html = html.replace(
    /<img src="https:\/\/images\.unsplash\.com\/photo-1509042239860-f550ce710b93[^"]*" alt="Tasting"[^>]*>/g,
    (match) => {
        const img = tastingImages[tastingIndex % tastingImages.length];
        tastingIndex++;
        return match.replace(/src="[^"]*"/, `src="${img}"`);
    }
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('All images updated!');




