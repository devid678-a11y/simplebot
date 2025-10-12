const https = require('https');

const projectId = 'dvizh-eacfa';
const functionName = 'checkChannels';
const region = 'us-central1';

const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = https.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Статус:', res.statusCode);
        console.log('Ответ:', data);
    });
});

req.on('error', (error) => {
    console.error('Ошибка:', error);
});

req.write(JSON.stringify({ data: {} }));
req.end();
