const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

async function getSession() {
    const apiId = 28308739;
    const apiHash = 'f8d19b54f08096e93eee7611e5582537';
    
    const client = new TelegramClient(
        new StringSession(''),
        apiId,
        apiHash
    );
    
    try {
        await client.start({
            phoneNumber: async () => {
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                return new Promise((resolve) => {
                    rl.question('Введите номер телефона (с +7): ', (phone) => {
                        rl.close();
                        resolve(phone);
                    });
                });
            },
            phoneCode: async () => {
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                return new Promise((resolve) => {
                    rl.question('Введите код из SMS: ', (code) => {
                        rl.close();
                        resolve(code);
                    });
                });
            },
            password: async () => {
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                return new Promise((resolve) => {
                    rl.question('Введите пароль от Telegram: ', (password) => {
                        rl.close();
                        resolve(password);
                    });
                });
            },
            onError: (err) => console.log('Error:', err)
        });
        
        console.log('Session string:', client.session.save());
        console.log('Теперь используй этот session string в Firebase config');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.disconnect();
    }
}

getSession();
