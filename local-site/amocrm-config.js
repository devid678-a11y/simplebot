// AmoCRM Integration Configuration
const AmoCRMConfig = {
    // Замените на ваши данные
    domain: 'your-domain', // ваш домен AmoCRM (без .amocrm.ru)
    clientId: 'YOUR_CLIENT_ID', // ID интеграции
    clientSecret: 'YOUR_CLIENT_SECRET', // Секретный ключ
    redirectUri: 'http://localhost:8000/amocrm-callback', // URL для callback
    
    // API endpoints
    api: {
        baseUrl: 'https://your-domain.amocrm.ru/api/v4',
        authUrl: 'https://your-domain.amocrm.ru/oauth2/authorize',
        tokenUrl: 'https://your-domain.amocrm.ru/oauth2/access_token',
        endpoints: {
            leads: '/leads',
            contacts: '/contacts',
            companies: '/companies',
            users: '/users',
            pipelines: '/leads/pipelines',
            customFields: '/leads/custom_fields'
        }
    },
    
    // Настройки интеграции
    settings: {
        // Автоматически создавать контакт при создании лида
        autoCreateContact: true,
        
        // Автоматически назначать ответственного
        autoAssignResponsible: true,
        
        // ID воронки продаж (получите из AmoCRM)
        pipelineId: null, // Замените на ID вашей воронки
        
        // ID статуса "Новый лид"
        statusId: null, // Замените на ID статуса
        
        // ID ответственного пользователя
        responsibleUserId: null, // Замените на ID пользователя
        
        // Поля для маппинга
        fieldMapping: {
            name: 'name',
            email: 'email',
            phone: 'phone',
            message: 'message',
            source: 'website'
        }
    }
};

// Функция для получения токена доступа
async function getAmoCRMToken() {
    const token = localStorage.getItem('amocrm_access_token');
    const tokenExpiry = localStorage.getItem('amocrm_token_expiry');
    
    // Проверяем, не истек ли токен
    if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        return token;
    }
    
    // Если токен истек или отсутствует, запрашиваем новый
    return await refreshAmoCRMToken();
}

// Функция для обновления токена
async function refreshAmoCRMToken() {
    const refreshToken = localStorage.getItem('amocrm_refresh_token');
    
    if (!refreshToken) {
        throw new Error('No refresh token available. Please re-authorize.');
    }
    
    try {
        const response = await fetch(AmoCRMConfig.api.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: AmoCRMConfig.clientId,
                client_secret: AmoCRMConfig.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                redirect_uri: AmoCRMConfig.redirectUri
            })
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            // Сохраняем новые токены
            localStorage.setItem('amocrm_access_token', data.access_token);
            localStorage.setItem('amocrm_refresh_token', data.refresh_token);
            localStorage.setItem('amocrm_token_expiry', (Date.now() + data.expires_in * 1000).toString());
            
            return data.access_token;
        } else {
            throw new Error('Failed to refresh token');
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
    }
}

// Функция для авторизации в AmoCRM
function authorizeAmoCRM() {
    const authUrl = `${AmoCRMConfig.api.authUrl}?` + new URLSearchParams({
        client_id: AmoCRMConfig.clientId,
        redirect_uri: AmoCRMConfig.redirectUri,
        response_type: 'code',
        state: 'random_state_string' // Для безопасности
    });
    
    window.location.href = authUrl;
}

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AmoCRMConfig, getAmoCRMToken, refreshAmoCRMToken, authorizeAmoCRM };
}
