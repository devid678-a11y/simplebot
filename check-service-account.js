const axios = require('axios');

async function checkServiceAccount() {
    console.log('🔍 Проверяем информацию о сервисном аккаунте...');
    
    const apiKey = 'AQVNw_xujlX2tui5in5a-nZ2sTq3wAF_s8xZuEww';
    
    try {
        // Попробуем получить информацию о сервисном аккаунте
        const response = await axios.get(
            'https://iam.api.cloud.yandex.net/iam/v1/serviceAccounts/ajek6rkacvdac745groh',
            {
                headers: {
                    'Authorization': `Api-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Информация о сервисном аккаунте:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Ошибка при получении информации о сервисном аккаунте:');
        console.error(error.response?.data || error.message);
        
        // Попробуем другой подход - получить список каталогов
        try {
            console.log('\n🔍 Пробуем получить список каталогов...');
            const foldersResponse = await axios.get(
                'https://resource-manager.api.cloud.yandex.net/resource-manager/v1/folders',
                {
                    headers: {
                        'Authorization': `Api-Key ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Доступные каталоги:');
            console.log(JSON.stringify(foldersResponse.data, null, 2));
            
        } catch (foldersError) {
            console.error('❌ Ошибка при получении списка каталогов:');
            console.error(foldersError.response?.data || foldersError.message);
        }
    }
}

checkServiceAccount();
