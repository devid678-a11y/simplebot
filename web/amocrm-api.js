// AmoCRM API Integration
class AmoCRMAPI {
    constructor(config) {
        this.config = config;
        this.baseUrl = `https://${config.domain}.amocrm.ru/api/v4`;
    }
    
    // Получение заголовков для запросов
    async getHeaders() {
        const token = await getAmoCRMToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    // Создание лида
    async createLead(leadData) {
        try {
            const headers = await this.getHeaders();
            
            const leadPayload = {
                name: leadData.name || 'Лид с сайта',
                price: leadData.price || 0,
                responsible_user_id: this.config.settings.responsibleUserId,
                pipeline_id: this.config.settings.pipelineId,
                status_id: this.config.settings.statusId,
                custom_fields_values: [
                    {
                        field_id: this.getFieldId('email'),
                        values: [{ value: leadData.email }]
                    },
                    {
                        field_id: this.getFieldId('phone'),
                        values: [{ value: leadData.phone }]
                    },
                    {
                        field_id: this.getFieldId('message'),
                        values: [{ value: leadData.message }]
                    },
                    {
                        field_id: this.getFieldId('source'),
                        values: [{ value: 'website' }]
                    }
                ]
            };
            
            const response = await fetch(`${this.baseUrl}/leads`, {
                method: 'POST',
                headers,
                body: JSON.stringify([leadPayload])
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result._embedded.leads[0];
            
        } catch (error) {
            console.error('Error creating lead:', error);
            throw error;
        }
    }
    
    // Создание контакта
    async createContact(contactData) {
        try {
            const headers = await this.getHeaders();
            
            const contactPayload = {
                name: contactData.name,
                responsible_user_id: this.config.settings.responsibleUserId,
                custom_fields_values: [
                    {
                        field_id: this.getFieldId('email'),
                        values: [{ value: contactData.email }]
                    },
                    {
                        field_id: this.getFieldId('phone'),
                        values: [{ value: contactData.phone }]
                    }
                ]
            };
            
            const response = await fetch(`${this.baseUrl}/contacts`, {
                method: 'POST',
                headers,
                body: JSON.stringify([contactPayload])
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result._embedded.contacts[0];
            
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }
    
    // Связывание лида с контактом
    async linkLeadToContact(leadId, contactId) {
        try {
            const headers = await this.getHeaders();
            
            const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    _embedded: {
                        contacts: [{ id: contactId }]
                    }
                })
            });
            
            return response.ok;
            
        } catch (error) {
            console.error('Error linking lead to contact:', error);
            throw error;
        }
    }
    
    // Получение информации об аккаунте
    async getAccount() {
        try {
            const headers = await this.getHeaders();
            
            const response = await fetch(`${this.baseUrl}/account`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error getting account info:', error);
            throw error;
        }
    }
    
    // Получение воронок продаж
    async getPipelines() {
        try {
            const headers = await this.getHeaders();
            
            const response = await fetch(`${this.baseUrl}/leads/pipelines`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error getting pipelines:', error);
            throw error;
        }
    }
    
    // Получение пользователей
    async getUsers() {
        try {
            const headers = await this.getHeaders();
            
            const response = await fetch(`${this.baseUrl}/users`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }
    
    // Получение кастомных полей
    async getCustomFields() {
        try {
            const headers = await this.getHeaders();
            
            const response = await fetch(`${this.baseUrl}/leads/custom_fields`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error getting custom fields:', error);
            throw error;
        }
    }
    
    // Вспомогательная функция для получения ID поля
    getFieldId(fieldName) {
        // Здесь нужно будет настроить маппинг полей
        // В зависимости от вашей конфигурации AmoCRM
        const fieldMapping = {
            'email': 123456, // Замените на реальный ID поля email
            'phone': 123457, // Замените на реальный ID поля телефона
            'message': 123458, // Замените на реальный ID поля сообщения
            'source': 123459  // Замените на реальный ID поля источника
        };
        
        return fieldMapping[fieldName] || null;
    }
    
    // Основная функция для обработки заявки с сайта
    async processWebsiteLead(formData) {
        try {
            console.log('Processing lead:', formData);
            
            // Создаем лид
            const lead = await this.createLead(formData);
            console.log('Lead created:', lead);
            
            // Если нужно создать контакт
            if (this.config.settings.autoCreateContact) {
                const contact = await this.createContact(formData);
                console.log('Contact created:', contact);
                
                // Связываем лид с контактом
                await this.linkLeadToContact(lead.id, contact.id);
                console.log('Lead linked to contact');
            }
            
            return {
                success: true,
                leadId: lead.id,
                message: 'Лид успешно создан в AmoCRM'
            };
            
        } catch (error) {
            console.error('Error processing lead:', error);
            return {
                success: false,
                error: error.message,
                message: 'Ошибка при создании лида'
            };
        }
    }
}

// Создаем экземпляр API
const amoCrmAPI = new AmoCRMAPI(AmoCRMConfig);

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AmoCRMAPI, amoCrmAPI };
}
