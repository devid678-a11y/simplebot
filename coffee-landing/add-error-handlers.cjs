const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Добавляем onerror обработчики ко всем изображениям Unsplash
html = html.replace(
    /<img src="https:\/\/images\.unsplash\.com[^"]*"([^>]*)>/g,
    (match, attrs) => {
        if (attrs && attrs.includes('onerror')) {
            return match;
        }
        return match.replace(/>$/, ' onerror="this.onerror=null; this.style.display=\'none\'; if(this.parentElement) { this.parentElement.style.background=\'#f5f5f5\'; this.parentElement.style.minHeight=\'200px\'; }" />');
    }
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Error handlers added to all images!');

