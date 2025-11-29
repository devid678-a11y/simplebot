const https = require('https');
const fs = require('fs');
const path = require('path');

const imageUrl = 'https://i2-prod.hulldailymail.co.uk/news/uk-world-news/article8941815.ece/ALTERNATES/s1200/0_GettyImages-1467739359.jpg';
const outputFile = path.join(__dirname, 'hero-base64.txt');

function downloadAndConvert() {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                const imageBuffer = Buffer.concat(chunks);
                const base64 = imageBuffer.toString('base64');
                const mimeType = 'image/jpeg';
                const dataUri = `data:${mimeType};base64,${base64}`;
                
                fs.writeFileSync(outputFile, dataUri);
                console.log('Image downloaded and converted to base64!');
                console.log(`Base64 length: ${base64.length} characters`);
                resolve(dataUri);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

downloadAndConvert().catch(console.error);

