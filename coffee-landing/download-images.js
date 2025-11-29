const https = require('https');
const fs = require('fs');
const path = require('path');

// Список изображений для скачивания
const images = [
    {
        url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1920&h=1080&fit=crop',
        filename: 'hero.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
        filename: 'coffee-machine.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop',
        filename: 'team-workshop.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
        filename: 'tea.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
        filename: 'coffee-barista.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
        filename: 'ice-drink.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop',
        filename: 'coffee-beans.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=400&fit=crop',
        filename: 'juices.jpg'
    },
    {
        url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
        filename: 'certificate.jpg'
    }
];

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(__dirname, 'images', filename));
        
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, filename).then(resolve).catch(reject);
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {});
            reject(err);
        });
    });
}

function imageToBase64(filepath) {
    const imageBuffer = fs.readFileSync(filepath);
    return imageBuffer.toString('base64');
}

async function main() {
    // Создаем папку images если её нет
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    console.log('Downloading images...');
    
    for (const image of images) {
        try {
            await downloadImage(image.url, image.filename);
        } catch (error) {
            console.error(`Error downloading ${image.filename}:`, error.message);
        }
    }

    console.log('\nConverting to base64...');
    
    const base64Images = {};
    for (const image of images) {
        const filepath = path.join(imagesDir, image.filename);
        if (fs.existsSync(filepath)) {
            const ext = path.extname(image.filename).slice(1);
            const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            const base64 = imageToBase64(filepath);
            base64Images[image.filename] = `data:${mimeType};base64,${base64}`;
            console.log(`Converted: ${image.filename}`);
        }
    }

    // Сохраняем base64 в JSON файл
    fs.writeFileSync(
        path.join(__dirname, 'images-base64.json'),
        JSON.stringify(base64Images, null, 2)
    );

    console.log('\nDone! Base64 images saved to images-base64.json');
}

main().catch(console.error);

