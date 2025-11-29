const fs = require('fs');
const path = require('path');

const heroBase64 = fs.readFileSync(path.join(__dirname, 'hero-base64.txt'), 'utf8');
const htmlPath = path.join(__dirname, 'index.html');

let html = fs.readFileSync(htmlPath, 'utf8');

// Заменяем hero изображение
html = html.replace(
    /<img src="data:image\/svg\+xml;base64,[^"]*" alt="Coffee" class="hero-image">/,
    `<img src="${heroBase64}" alt="Coffee" class="hero-image">`
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Hero image updated in index.html!');

