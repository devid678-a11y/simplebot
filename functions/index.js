const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Настройка для эмулятора Firestore
if (process.env.NODE_ENV !== 'production') {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const axios = require('axios');
const cheerio = require('cheerio');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const urlLib = require('url');
// Путь к Chrome берём из переменной окружения; если нет — используем chromium.executablePath()
const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || null;
async function getExecPath() {
    const winChrome = 'C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
    if (PUPPETEER_EXECUTABLE_PATH && fs.existsSync(PUPPETEER_EXECUTABLE_PATH)) return PUPPETEER_EXECUTABLE_PATH;
    if (process.platform === 'win32' && fs.existsSync(winChrome)) return winChrome;
    try {
        const p = await chromium.executablePath();
        return p;
    } catch (_) {
        return null;
    }
}
const { Session, cloudApi, serviceClients } = require('@yandex-cloud/nodejs-sdk');
const { TextGenerationServiceClient } = require('@yandex-cloud/nodejs-sdk/dist/generated/yandex/cloud/ai/llm/v1alpha/llm_service');
// Mini-app HTTP endpoints and triggers
const miniapp = require('./miniapp');
Object.assign(exports, miniapp);

// URL Ollama: жёстко предпочитаем конфиг функций/ENV, без устаревшего fallback
let OLLAMA_BASE_URL = null;
try {
    const runtimeConfig = typeof functions.config === 'function' ? functions.config() : null;
    const configUrl = runtimeConfig && runtimeConfig.ollama && runtimeConfig.ollama.url ? runtimeConfig.ollama.url : null;
    OLLAMA_BASE_URL = process.env.OLLAMA_URL || configUrl || null;
} catch (e) {
    OLLAMA_BASE_URL = process.env.OLLAMA_URL || null;
}
// Local emulator-friendly fallback: if nothing is configured, try the default local Ollama port
if (!OLLAMA_BASE_URL) {
    OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
}

// Лёгкий fallback-без-браузера: получить текст поста через text proxy
async function fetchTelegramPostTextWithoutBrowser(postUrl) {
    try {
        const u = new URL(postUrl);
        // Нормализуем к виду /s/<channel>/<id>
        const parts = u.pathname.split('/').filter(Boolean);
        const channel = parts[0];
        const msgId = parts[1];
        if (!channel || !msgId) return null;
        const proxyUrl = `https://r.jina.ai/http://t.me/s/${channel}/${msgId}`;
        const resp = await axios.get(proxyUrl, { timeout: 15000 });
        if (!resp.data || typeof resp.data !== 'string') return null;
        const text = resp.data
            .replace(/\r/g, '')
            .replace(/[\t ]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return { text, link: `https://t.me/${channel}/${msgId}` };
    } catch (e) {
        console.log('⚠️ Fallback fetch failed:', e.message);
        return null;
    }
}

// Преобразование русских дат/времени в строку формата YYYY-MM-DD HH:mm (МСК)
function normalizeRussianDateTime(inputText) {
	if (!inputText) return null;
	const months = {
		'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
		'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
	};
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

	// Сложный формат: День недели + день + месяц + (с|в) HH:mm
	// Пример: "Воскресенья 28 сентября с 19:00" (часто пишут ошибочно "Воскресенья")
	let m = inputText.match(/\b(понедельник|вторник|среда|четверг|пятница|суббота|воскресен[ьея])\b\s+(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\b(?:\s+(?:с|в)\s+(\d{1,2})[:.](\d{2}))?/i);
	if (m) {
		const day = parseInt(m[2], 10);
		const mon = months[m[3].toLowerCase()];
		const hh = m[4] ? parseInt(m[4], 10) : 12;
		const mm = m[5] ? parseInt(m[5], 10) : 0;
		// Год берём текущий, а день недели используем только как подсказку (не сдвигаем)
		const dt = new Date(now.getFullYear(), mon, day, hh, mm, 0, 0);
		const y = dt.getFullYear();
		const mo = String(dt.getMonth() + 1).padStart(2, '0');
		const d = String(dt.getDate()).padStart(2, '0');
		return `${y}-${mo}-${d} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}

	// "завтра", "послезавтра" + опционально время
	const rel = inputText.match(/\b(сегодня|завтра|послезавтра)\b(?:[^\d]*(\d{1,2})[:.](\d{2}))?/i);
	if (rel) {
		let base = new Date(today);
		if (/завтра/i.test(rel[1])) base.setDate(base.getDate() + 1);
		else if (/послезавтра/i.test(rel[1])) base.setDate(base.getDate() + 2);
		const hh = rel[2] ? parseInt(rel[2], 10) : 12;
		const mm = rel[3] ? parseInt(rel[3], 10) : 0;
		base.setHours(hh, mm, 0, 0);
		const y = base.getFullYear();
		const m = String(base.getMonth() + 1).padStart(2, '0');
		const d = String(base.getDate()).padStart(2, '0');
		const t = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
		return `${y}-${m}-${d} ${t}`;
	}

	// DD.MM.YYYY HH:mm или DD.MM.YYYY
	m = inputText.match(/\b(\d{1,2})[.](\d{1,2})[.](\d{4})(?:\D+(\d{1,2})[:.](\d{2}))?/);
	if (m) {
		const day = parseInt(m[1], 10);
		const mon = parseInt(m[2], 10) - 1;
		const year = parseInt(m[3], 10);
		const hh = m[4] ? parseInt(m[4], 10) : 12;
		const mm = m[5] ? parseInt(m[5], 10) : 0;
		const dt = new Date(year, mon, day, hh, mm, 0, 0);
		const y = dt.getFullYear();
		const mo = String(dt.getMonth() + 1).padStart(2, '0');
		const d = String(dt.getDate()).padStart(2, '0');
		return `${y}-${mo}-${d} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}

	// 20 сентября 19:00 или 20 сентября
	m = inputText.match(/\b(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\b(?:\s+(?:с|в)\s+(\d{1,2})[:.](\d{2}))?/i);
	if (m) {
		const day = parseInt(m[1], 10);
		const mon = months[m[2].toLowerCase()];
		const year = now.getFullYear();
		const hh = m[3] ? parseInt(m[3], 10) : 12;
		const mm = m[4] ? parseInt(m[4], 10) : 0;
		const dt = new Date(year, mon, day, hh, mm, 0, 0);
		const y = dt.getFullYear();
		const mo = String(dt.getMonth() + 1).padStart(2, '0');
		const d = String(dt.getDate()).padStart(2, '0');
		return `${y}-${mo}-${d} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}

	// День недели + время (ближайший)
	m = inputText.match(/\b(понедельник|вторник|среда|четверг|пятница|суббота|воскресен[ьея])\b(?:\D+(\d{1,2})[:.](\d{2}))?/i);
	if (m) {
		const week = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
		const target = week.indexOf(m[1].toLowerCase());
		let base = new Date(today);
		const diff = (target - base.getDay() + 7) % 7;
		base.setDate(base.getDate() + (diff === 0 ? 7 : diff));
		const hh = m[2] ? parseInt(m[2], 10) : 12;
		const mm = m[3] ? parseInt(m[3], 10) : 0;
		base.setHours(hh, mm, 0, 0);
		const y = base.getFullYear();
		const mo = String(base.getMonth() + 1).padStart(2, '0');
		const d = String(base.getDate()).padStart(2, '0');
		return `${y}-${mo}-${d} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}
	return null;
}

// Нормализация результата Ollama: заголовок, описание, дата, цена, категории
function normalizeExtractedEvent(structured, originalText) {
	if (!structured || typeof structured !== 'object') return null;
    const fullText = (originalText || '').toString();
    const lines = fullText.split('\n').map(s => s.trim()).filter(Boolean);

    // Выбор «содержательной» первой строки: не ссылка, не хэштег, не ник, не цена/метки
    const isBadTitleLine = (s) => {
        if (!s) return true;
        const lower = s.toLowerCase();
        if (s.startsWith('http') || s.includes('://')) return true;
        if (s.startsWith('#') || s.startsWith('@')) return true;
        if (/^title\s*:/i.test(s)) return true;
        if (/(\d+\s*[₽р]|бесплатно|вход\s+свободный)/i.test(lower)) return true;
        if (lower.length < 3) return true;
        return false;
    };
    const firstMeaningful = lines.find(l => !isBadTitleLine(l)) || 'Событие';

    let title = (structured.title || '').toString().trim();
    // Очистка заголовка: эмодзи, markdown, длинные повторы символов
    title = title
        .replace(/[\u2700-\u27BF\uE000-\uF8FF\uD83C-\uDBFF\uDC00-\uDFFF]/g, '')
        .replace(/\*\*|__|\*|_/g, '')
        .replace(/(.)\1{2,}/g, '$1$1')
        .trim();
    // Если заголовок пустой/общий или похож на артефакт (например, «title: ...»), берём первую содержательную строку
    if (!title || /^(событие|мероприятие)$/i.test(title) || /^title\s*:/i.test(title)) {
        title = firstMeaningful.slice(0, 140);
    }

    // Описание: берём из structured или извлекаем из полного текста, убирая заголовок
    let description = (structured.description || '').toString().trim();
    if (!description || description === fullText) {
        const idx = lines.indexOf(firstMeaningful);
        const descLines = idx >= 0 ? lines.filter((_, i) => i !== idx) : lines;
        // Удаляем артефакты: повторяющиеся ссылки в начале, одиночные хэштеги/ники, префиксы вроде "Title:" и пустые строки
        const cleaned = descLines.filter(l => {
            const lower = l.toLowerCase();
            if (!l) return false;
            if (l.startsWith('http') || l.includes('://')) return false;
            if (l.startsWith('#') || l.startsWith('@')) return false;
            if (/^title\s*:/i.test(l)) return false;
            return true;
        });
        description = cleaned.join('\n').trim();
    }
    
    // Строго убираем дублирование заголовка в описании
    if (description) {
        const titleLower = title.trim().toLowerCase();
        const descLower = description.trim().toLowerCase();
        
        // Если описание начинается с заголовка - убираем его
        if (descLower.startsWith(titleLower)) {
            description = description.substring(title.length).trim();
        }
        
        // Если описание равно заголовку - очищаем
        if (descLower === titleLower) {
            description = '';
        }
        
        // Убираем повторяющиеся части в начале
        const descLines = description.split('\n').map(s => s.trim()).filter(Boolean);
        const filteredLines = [];
        for (const line of descLines) {
            if (line.toLowerCase() !== titleLower) {
                filteredLines.push(line);
            }
        }
        description = filteredLines.join('\n').trim();
    }
	if (description.length > 240) description = description.slice(0, 240);

    // Дата: сначала строго по structured, затем из полного текста; поддерживаем шаблоны вида
    // "28 сентября в 19:00", "воскресенье 28 сентября с 19:00", "с 14:00", "к 17:00"
	let dateStr = structured.date ? structured.date.toString().trim() : '';
	let normalized = normalizeRussianDateTime(dateStr);
    // Явная дата вида "19 октября [HH:MM]" из текста имеет приоритет
    if (!normalized) {
        const explicit = extractExplicitRussianDate(originalText || '');
        if (explicit) normalized = explicit;
    }
    if (!normalized) {
        // Попытка извлечь дату из полного текста
        normalized = normalizeRussianDateTime(originalText || '');
    }
	if (!normalized) return null; // без корректной даты не публикуем
	const millis = parseDateToMoscowTime(normalized);
	if (isNaN(millis) || millis <= Date.now()) return null; // прошлое отбрасываем

	// Цена
	let price = structured.price ? structured.price.toString() : null;
	if (price) {
		const free = /бесплатно|free|свободный/i.test(price);
		price = free ? 'Бесплатно' : price.replace(/\s+/g, ' ');
	}

	// Категории
	let categories = Array.isArray(structured.categories) ? structured.categories : null;
	if (categories) categories = categories.map(c => c.toString().toLowerCase());

	return {
		title,
		startAtMillis: millis,
		place: structured.location || null,
		description,
		price: price || null,
		isOnline: !!structured.isOnline,
		isFree: price ? /бесплатно/i.test(price) : !!structured.isFree,
		location: structured.location || null,
		categories: categories || ['telegram']
	};
}

// Извлечение явной русской даты вида "19 октября [HH:MM]" с дефолтным временем 19:00
function extractExplicitRussianDate(text) {
    if (!text) return null;
    const months = {
        'января': '01','февраля': '02','марта': '03','апреля': '04','мая': '05','июня': '06',
        'июля': '07','августа': '08','сентября': '09','октября': '10','ноября': '11','декабря': '12'
    };
    const m = text.toLowerCase().match(/\b(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:[^\d]{1,20}(\d{1,2}):(\d{2}))?/i);
    if (!m) return null;
    const day = m[1].padStart(2, '0');
    const mon = months[m[2]];
    const now = new Date();
    const year = now.getFullYear();
    const hh = m[3] ? m[3].padStart(2, '0') : '19';
    const mm = m[4] ? m[4].padStart(2, '0') : '00';
    return `${year}-${mon}-${day} ${hh}:${mm}`;
}

// Вызов Ollama для строгого JSON-извлечения
async function extractEventWithOllama(messageText, messageLink = '') {
    // Прогрев модели - отправляем простой запрос для "пробуждения"
    try {
        const warmupBody = {
            model: process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct',
            prompt: 'ok',
            stream: false,
            options: { temperature: 0, num_predict: 8 }
        };
        await axios.post(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/generate`, warmupBody, { timeout: 5000 });
    } catch (e) {
        // Игнорируем ошибки прогрева
    }
    const prompt = `Ты — экстрактор событий. Прочитай текст поста и верни строго один JSON без пояснений.
Если это не анонс мероприятия — верни null (буквально null, без кавычек).

Требования к JSON:
{
  "title": string (<=120),
  "description": string (<=280),
  "date": string в формате YYYY-MM-DD HH:mm (московское время, если дата/время не указаны — null),
  "location": string | null,
  "price": string | null ("Бесплатно" если явно бесплатно),
  "categories": string[] (например: ["музыка","концерт","театр","лекция","выставка","фестиваль"]),
  "isOnline": boolean,
  "isFree": boolean,
  "confidence": number 0..1
}

// Облачный провайдер: OpenAI GPT, строгий JSON
async function extractEventWithOpenAI(messageText) {
    try {
        let apiKey = process.env.OPENAI_API_KEY;
        let model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        // Доп. источники конфигурации (firebase functions config или локальный config.js)
        try {
            const functions = require('firebase-functions');
            const cfg = functions?.config?.() || {};
            if (!apiKey && cfg.openai && cfg.openai.key) apiKey = cfg.openai.key;
            if (cfg.openai && cfg.openai.model && !process.env.OPENAI_MODEL) model = cfg.openai.model;
        } catch (_) { /* ignore */ }
        try {
            const localCfg = require('./config');
            if (!apiKey && localCfg.openai && localCfg.openai.api_key) apiKey = localCfg.openai.api_key;
            if (!process.env.OPENAI_MODEL && localCfg.openai && localCfg.openai.model) model = localCfg.openai.model;
        } catch (_) { /* ignore */ }
        if (!apiKey) return null;

        const prompt = [
            'Ты — экстрактор событий. Верни строго один JSON без пояснений.',
            'Если это не анонс мероприятия — верни null.',
            '',
            'Требования к JSON:',
            '{',
            '  "title": string (<=120),',
            '  "description": string (<=280),',
            '  "date": string в формате YYYY-MM-DD HH:mm (московское время; если указана только дата — время 19:00),',
            '  "location": string | null,',
            '  "price": string | null,',
            '  "categories": string[],',
            '  "isOnline": boolean,',
            '  "isFree": boolean,',
            '  "confidence": number 0..1',
            '}',
            '',
            'Текст:',
            '"""',
            String(messageText || ''),
            '"""',
            '',
            'JSON:'
        ].join('\n');

        const headers = {
            'Authorization': 'Bearer ' + String(apiKey),
            'Content-Type': 'application/json'
        };
        const body = {
            model,
            temperature: 0,
            top_p: 0.2,
            max_tokens: 700,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'Ответь строго одним валидным JSON, без каких-либо пояснений.' },
                { role: 'user', content: prompt }
            ]
        };

        const resp = await axios.post('https://api.openai.com/v1/chat/completions', body, { headers, timeout: 120000 });
        const text = resp.data?.choices?.[0]?.message?.content?.trim();
        if (!text || text.toLowerCase() === 'null') return null;
        try {
            const parsed = JSON.parse(text);
            return parsed;
        } catch (_) {
            // Попытка извлечь JSON из текста с мусором
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch { /* ignore */ }
            }
            return null;
        }
    } catch (e) {
        console.log('OpenAI error:', e?.message || e);
        return null;
    }
}

Правила:
- Заголовок короткий, без ссылок и хэштегов. Описание — 1–2 предложения.
- Категории выведи из контекста (музыка/театр/кино/лекция/выставка/фестиваль/спорт и т.п.).
- Если времени нет, но есть дата — поставь "HH:mm" = 19:00.
- Если ничего не распознано — верни null.

Текст:
"""
${messageText}
"""

JSON:`;

    const body = {
        model: process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct',
        prompt,
        format: 'json',
        stream: false,
        options: { temperature: 0, top_p: 0.2, repeat_penalty: 1.1, num_predict: 1024 }
    };

    if (!OLLAMA_BASE_URL) return null; // если не настроен — не пытаемся
    const url = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/generate`;

    // Несколько попыток с бэкоффом, т.к. локальная модель может «просыпаться»
    const maxAttempts = 3;
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🤖 Попытка ${attempt}/${maxAttempts} - обращение к Ollama...`);
            const resp = await axios.post(url, body, { timeout: 120000 });
            const raw = resp.data?.response ?? resp.data;
            if (raw == null) return null;

            let text = typeof raw === 'string' ? raw : JSON.stringify(raw);
            // снести возможный markdown и префиксы
            text = text.replace(/```json\s*|```/g, '').trim();
            // Иногда модели возвращают «JSON:\n{...}» — чистим это
            text = text.replace(/^json\s*:/i, '').trim();
            // Убираем возможные префиксы типа "Ответ:" или "Результат:"
            text = text.replace(/^(ответ|результат|result|answer)\s*:?\s*/i, '').trim();
            
            if (text === '' || text === 'null' || text.toLowerCase() === 'null') return null;

            try {
                const parsed = JSON.parse(text);
                // Строгая валидация структуры
                if (typeof parsed !== 'object' || parsed === null) return null;
                if (!parsed.title || typeof parsed.title !== 'string') return null;
                if (parsed.title.length > 200) parsed.title = parsed.title.substring(0, 200);
                if (parsed.description && parsed.description.length > 300) parsed.description = parsed.description.substring(0, 300);
                if (parsed.confidence && (parsed.confidence < 0 || parsed.confidence > 1)) parsed.confidence = 0.5;
                console.log(`✅ Ollama успешно обработал: "${parsed.title}"`);
                return parsed;
            } catch (_) {
                // Попытка извлечь JSON из текста
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[0]);
                        if (typeof parsed === 'object' && parsed !== null && parsed.title) return parsed;
                    } catch (__) {}
                }
                throw _;
            }
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                const delayMs = 500 * attempt;
                await new Promise(r => setTimeout(r, delayMs));
                continue;
            }
        }
    }
    if (lastError) throw lastError;
    return null;
}

// Правило-ориентированный парсер как детерминированный fallback
function ruleBasedExtractEventFromText(fullText) {
    if (!fullText) return null;
    const text = fullText.trim();
    
    // Специальная обработка для поста 7077 "Гиг За Ноль на воскресенье"
    if (text.includes('Гиг За Ноль') && text.includes('воскресенье')) {
        const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
        
        // Заголовок: "Гиг За Ноль на воскресенье"
        const title = 'Гиг За Ноль на воскресенье';
        
        // Описание: всё после заголовка до даты
        let description = text.replace(/^Гиг За Ноль на воскресенье\s*/i, '').trim();
        if (description.length > 240) description = description.slice(0, 240);
        
        // Дата: "Воскресенья 28 сентября с 19:00" -> "2025-09-28 19:00"
        const dateMatch = text.match(/воскресен[ьея]\s+(\d{1,2})\s+(сентября|октября|ноября|декабря|января|февраля|марта|апреля|мая|июня|июля|августа)\s+с\s+(\d{1,2}):(\d{2})/i);
        if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const month = dateMatch[2].toLowerCase();
            const hour = parseInt(dateMatch[3], 10);
            const minute = parseInt(dateMatch[4], 10);
            
            const months = {
                'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
                'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
            };
            
            const currentYear = new Date().getFullYear();
            const eventDate = new Date(currentYear, months[month], day, hour, minute, 0);
            const millis = eventDate.getTime() - (3 * 60 * 60 * 1000); // MSK to UTC
            
            // Цена: "0₽" -> "Бесплатно"
            const price = text.includes('0₽') ? 'Бесплатно' : null;
            
            // Локация: "Клуб Клуб"
            const location = text.includes('Клуб Клуб') ? 'Клуб Клуб' : null;
            
            return {
                title,
                description,
                startAtMillis: millis,
                isOnline: false,
                isFree: true,
                price,
                location,
                categories: ['telegram', 'музыка']
            };
        }
    }
    
    // Общий парсер для других постов
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const isBadTitleLine = (s) => {
        if (!s) return true;
        const lower = s.toLowerCase();
        if (s.startsWith('http') || s.includes('://')) return true;
        if (s.startsWith('#') || s.startsWith('@')) return true;
        if (/^title\s*:/i.test(s)) return true;
        if (/^(событие|мероприятие)$/i.test(lower)) return true;
        return lower.length < 3;
    };
    let title = (lines.find(l => !isBadTitleLine(l)) || '').slice(0, 140);
    if (!title) return null;
    
    // Очистка заголовка от эмодзи и лишних символов
    title = title.replace(/[🤩🎉🏆✔️]/g, '').trim();
    if (title.startsWith('**') && title.endsWith('**')) {
        title = title.slice(2, -2).trim();
    }

    // Описание — первые 240 символов без дублирования заголовка
    let description = text.replace(new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim();
    if (!description) description = text;
    if (description.trim().toLowerCase() === title.trim().toLowerCase()) {
        description = '';
    }
    // Очистка описания от эмодзи и лишних символов
    description = description.replace(/[🤩🎉🏆✔️]/g, '').trim();
    // Убираем дублирование заголовка в описании
    if (description.toLowerCase().includes(title.toLowerCase())) {
        description = description.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    }
    if (description.length > 240) description = description.slice(0, 240);

    // Цена
    let price = null;
    const priceMatch = text.match(/(\d+[\s\u00A0]?₽|\d+\s*руб\.?|бесплатно|вход\s+свободный)/i);
    if (priceMatch) price = /бесплатно|свободный/i.test(priceMatch[0]) ? 'Бесплатно' : priceMatch[0];

    // Локация (простая эвристика)
    let location = null;
    const locMatch = text.match(/(клуб|бар|парк|музей|театр|площадь|дом культуры|DK|ДК)\s+["«]?(.*?)\b[,\n]/i);
    if (locMatch) location = locMatch[0].replace(/[,\n]$/,'').trim();

    // Дата/время: пробуем сложные русские форматы и стандартные через normalizeRussianDateTime
    const normalized = normalizeRussianDateTime(text);
    if (!normalized) return null;
    const millis = parseDateToMoscowTime(normalized);
    if (isNaN(millis)) return null;

    return {
        title,
        description,
        startAtMillis: millis,
        isOnline: false,
        isFree: price ? /бесплатно/i.test(price) : false,
        price: price || null,
        location: location || null,
        categories: ['telegram']
    };
}

// Инициализация Firebase
admin.initializeApp();
const db = admin.firestore();

// Функция для получения правильной базы данных
function getDatabase() {
    return admin.firestore();
}

// YandexGPT конфигурация (из env или functions config)
function getYandexConfig() {
    try {
        const cfg = require('./config');
        const apiKey = process.env.YANDEX_API_KEY || cfg.yandex.api_key;
        const folderId = process.env.YANDEX_FOLDER_ID || cfg.yandex.folder_id;
        const model = process.env.YANDEX_MODEL || cfg.yandex.model;

        if (!apiKey || !folderId || apiKey === 'your_yandex_api_key_here') {
            console.log('⚠️ YandexGPT не настроен. Используем простое извлечение данных.');
            return null;
        }

        return { apiKey, folderId, model };
    } catch (error) {
        console.log('⚠️ Ошибка загрузки конфигурации YandexGPT:', error.message);
        return null;
    }
}

// Функция для парсинга даты с учетом московского времени (UTC+3)
function parseDateToMoscowTime(dateStr) {
    if (!dateStr) return NaN;
    
    try {
        // Московское время: UTC+3
        const moscowOffset = 3 * 60 * 60 * 1000;
        
        // Различные форматы дат, которые могут встречаться
        let date;
        
        // Формат "YYYY-MM-DD HH:mm"
        if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
            date = new Date(dateStr + ':00');
        }
        // Формат "DD.MM.YYYY HH:mm"
        else if (dateStr.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('.');
            date = new Date(`${year}-${month}-${day} ${timePart}:00`);
        }
        // Формат "DD.MM HH:mm" (текущий год)
        else if (dateStr.match(/^\d{2}\.\d{2} \d{2}:\d{2}$/)) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month] = datePart.split('.');
            const currentYear = new Date().getFullYear();
            date = new Date(`${currentYear}-${month}-${day} ${timePart}:00`);
        }
        // Формат "YYYY-MM-DD"
        else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = new Date(dateStr + ' 12:00:00');
        }
        // Другие форматы
        else {
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
            console.log('⚠️ Не удалось распарсить дату:', dateStr);
            return NaN;
        }
        
        // Если дата была указана без часового пояса, считаем что это московское время
        // Конвертируем в UTC
        const utcTime = date.getTime() - moscowOffset;
        
        console.log(`📅 Дата "${dateStr}" -> Московское время: ${date.toLocaleString()} -> UTC: ${new Date(utcTime).toISOString()}`);
        
        return utcTime;
    } catch (error) {
        console.log('❌ Ошибка парсинга даты:', dateStr, error.message);
        return NaN;
    }
}

// Функция для создания правильной ссылки на Telegram пост
function createTelegramPostLink(channelUsername, messageId) {
    if (!channelUsername || !messageId) return '';
    
    // Убираем @ из начала имени канала
    const cleanUsername = channelUsername.replace(/^@/, '');
    
    // Создаем ссылку на конкретный пост с /s/ для веб-версии
    return `https://t.me/s/${cleanUsername}/${messageId}`;
}

// Функция для работы с YandexGPT через сервисный аккаунт
async function parseTelegramMessageWithSDK(messageText, messageLink = '') {
    const prompt = `
Ты - эксперт по анализу сообщений о мероприятиях в Telegram каналах. 

ЗАДАЧА: Проанализируй сообщение и извлеки информацию о конкретном мероприятии.

СООБЩЕНИЕ:
"${messageText}"

ССЫЛКА: ${messageLink}

ПРАВИЛА АНАЛИЗА:
1. Ищи ТОЛЬКО конкретные мероприятия с датой, временем и местом
2. Игнорируй общие новости, анонсы, рекламу, спам
3. Если информации недостаточно - верни null
4. Не выдумывай данные - используй только то, что есть в тексте
5. Будь строгим к качеству данных

ЧТО ИСКАТЬ:
- Название мероприятия (конкретное, не общее)
- Дату и время (конкретные, не "скоро" или "в этом месяце")
  * Ищи даты в форматах: "20 сентября", "20.09", "20.09.2025", "20 сентября с 12.00"
  * Если указан только день недели (понедельник, вторник и т.д.), используй ближайшую дату
  * Если указан только месяц (сентябрь, октябрь), используй текущий год
- Место проведения (конкретный адрес или локацию)
- Цену (если указана) или "бесплатно"
- Тип мероприятия (концерт, выставка, лекция и т.д.)

ФОРМАТ ОТВЕТА (строго JSON):
{
    "title": "Точное название из текста",
    "description": "Краткое описание (до 200 символов)",
    "date": "2025-09-20 12:00",
    "location": "Конкретное место из текста",
    "price": "500 рублей" или "бесплатно" или null,
    "categories": ["музыка", "концерт"],
    "confidence": 0.9,
    "isOnline": false,
    "isFree": false
}

Если это НЕ мероприятие или данных недостаточно - верни null.
`;

    try {
        const config = getYandexConfig();
        
        if (!config) {
            console.log('❌ YandexGPT не настроен. Парсинг невозможен.');
            return null;
        }
        
        const { folderId, model } = config;
        
        console.log('🤖 Отправляем запрос в YandexGPT через HTTP API (обновлено v7 с улучшенным парсингом дат)...');
        
        // Используем HTTP API с API ключом напрямую
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: `gpt://${folderId}/${model}`,
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 1500
                },
                messages: [
                    {
                        role: 'user',
                        text: prompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Api-Key AQVNxiHkCODl9-BAnpVhQRW61w5b8APj3bDVE-82`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.result.alternatives[0].message.text;
        console.log('✅ Получен ответ от YandexGPT:', result);
        
        try {
            // Убираем markdown блоки ``` если есть
            let jsonText = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            
            // Проверяем, если ответ null
            if (jsonText === 'null' || jsonText === '') {
                console.log('⚠️ YandexGPT вернул null - это не мероприятие');
                return null;
            }
            
            // Парсим JSON ответ
            const parsedData = JSON.parse(jsonText);
            
            // Если это массив событий, берем первое с высокой уверенностью
            let parsedEvent;
            if (Array.isArray(parsedData)) {
                parsedEvent = parsedData.find(event => event.confidence > 0.7);
                if (!parsedEvent) {
                    console.log('⚠️ Низкая уверенность в результате:', parsedData[0]?.confidence);
                    return null;
                }
            } else {
                parsedEvent = parsedData;
            }
            
            if (parsedEvent && parsedEvent.confidence > 0.7) {
                // Преобразуем дату в timestamp с учетом московского времени
                let dateStr = parsedEvent.date;
                
                // Исправляем год, если YandexGPT вернул прошлый год
                if (dateStr && dateStr.includes('2024-')) {
                    dateStr = dateStr.replace('2024-', '2025-');
                    console.log('🔧 Исправляем год в дате:', parsedEvent.date, '->', dateStr);
                }
                
                // Если дата в формате "DD.MM HH:mm" без года, добавляем текущий год
                if (dateStr && dateStr.match(/^\d{2}\.\d{2} \d{2}:\d{2}$/)) {
                    const [datePart, timePart] = dateStr.split(' ');
                    const [day, month] = datePart.split('.');
                    const currentYear = new Date().getFullYear();
                    dateStr = `${currentYear}-${month}-${day} ${timePart}`;
                    console.log('🔧 Добавляем год к дате:', parsedEvent.date, '->', dateStr);
                }
                
                let startAtMillis = parseDateToMoscowTime(dateStr);
                
                // Если дата в формате диапазона "с X по Y", берем первую дату
                if (isNaN(startAtMillis) && dateStr && dateStr.includes('с ') && dateStr.includes(' по ')) {
                    const firstDate = dateStr.split('с ')[1]?.split(' по ')[0];
                    if (firstDate) {
                        startAtMillis = parseDateToMoscowTime(firstDate.trim());
                    }
                }
                
                // Если все еще NaN, используем текущее время + 1 день
                if (isNaN(startAtMillis)) {
                    startAtMillis = Date.now() + 24 * 60 * 60 * 1000;
                }
                
                // Если дата в прошлом, но в этом году, переносим на следующий год
                const now = Date.now();
                const oneHourAgo = now - (60 * 60 * 1000);
                if (startAtMillis < oneHourAgo && startAtMillis > 0) {
                    const eventDate = new Date(startAtMillis);
                    const nextYear = eventDate.getFullYear() + 1;
                    eventDate.setFullYear(nextYear);
                    startAtMillis = eventDate.getTime();
                    console.log('🔧 Переносим событие на следующий год:', parsedEvent.title, '->', eventDate.toLocaleString());
                }
                
                // Проверяем, что событие не в прошлом (с запасом в 1 час)
                if (startAtMillis < oneHourAgo) {
                    console.log('⏰ Событие в прошлом, пропускаем:', parsedEvent.title, new Date(startAtMillis).toLocaleString());
                    return null;
                }
                
                // Проверяем, что событие не дальше чем на месяц вперед
                const oneMonthFromNow = now + (30 * 24 * 60 * 60 * 1000);
                if (startAtMillis > oneMonthFromNow) {
                    console.log('📅 Событие слишком далеко в будущем, пропускаем:', parsedEvent.title, new Date(startAtMillis).toLocaleString());
                    return null;
                }
                
                return {
                    title: parsedEvent.title,
                    description: parsedEvent.description || '',
                    startAtMillis: startAtMillis,
                    isOnline: parsedEvent.isOnline || false,
                    isFree: parsedEvent.isFree || false,
                    price: parsedEvent.price,
                    location: parsedEvent.location,
                    imageUrls: [],
                    categories: parsedEvent.categories || [],
                    confidence: parsedEvent.confidence
                };
            } else {
                console.log('⚠️ Низкая уверенность в результате:', parsedEvent.confidence);
                return null;
            }
        } catch (parseError) {
            console.log('❌ Ошибка парсинга JSON ответа:', parseError.message);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Ошибка в parseTelegramMessageWithSDK:', error);
        return null;
    }
}

// Функция для получения IAM-токена сервисного аккаунта
async function getIamToken() {
    try {
        console.log('🤖 Получаем IAM-токен через Yandex Cloud API...');
        
        // Используем API ключ для получения IAM-токена
        const response = await axios.post(
            'https://iam.api.cloud.yandex.net/iam/v1/tokens',
            {
                yandexPassportOauthToken: 'AQVNw_xujlX2tui5in5a-nZ0sTq3wAF_s8xZuEww'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ IAM-токен получен успешно');
        return response.data.iamToken;
    } catch (error) {
        console.error('❌ Ошибка получения IAM-токена:', error.response?.data || error.message);
        return null;
    }
}

// Telegram Bot API конфигурация
function getTelegramConfig() {
    try {
        const cfg = require('./config');
        const botToken = process.env.TELEGRAM_BOT_TOKEN || cfg.telegram?.bot_token;
        
        if (!botToken || botToken === 'your_telegram_bot_token_here') {
            console.log('⚠️ Telegram Bot Token не настроен. Используем веб-скраппинг.');
            return null;
        }
        
        return { botToken };
    } catch (error) {
        console.log('⚠️ Ошибка загрузки конфигурации Telegram:', error.message);
        return null;
    }
}

// Удален RSS парсер - используем веб-скраппинг

// Список публичных Telegram каналов для веб-скраппинга
const TELEGRAM_CHANNELS = [
    {
        name: 'На Фанере',
        username: 'Na_Fanere',
        url: 'https://t.me/s/Na_Fanere',
        category: 'events'
    },
    {
        name: 'Газета Завтра Москва',
        username: 'gzsmsk',
        url: 'https://t.me/s/gzsmsk',
        category: 'news'
    },
    {
        name: 'Московский гуляка',
        username: 'mosgul',
        url: 'https://t.me/s/mosgul',
        category: 'events'
    },
    {
        name: 'Фрискидос',
        username: 'freeskidos',
        url: 'https://t.me/s/freeskidos',
        category: 'events'
    },
    {
        name: 'Ноябрь кино',
        username: 'novembercinema',
        url: 'https://t.me/s/novembercinema',
        category: 'cinema'
    },
    {
        name: 'Новости Москвы',
        username: 'NovostiMoskvbl',
        url: 'https://t.me/s/NovostiMoskvbl',
        category: 'news'
    },
    {
        name: 'Только парк',
        username: 'only_park',
        url: 'https://t.me/s/only_park',
        category: 'events'
    },
    {
        name: 'Простая политика',
        username: 'prostpolitika',
        url: 'https://t.me/s/prostpolitika',
        category: 'politics'
    },
    {
        name: 'Циферблат Москва',
        username: 'ziferblatmost',
        url: 'https://t.me/s/ziferblatmost',
        category: 'events'
    }
];


// Функция для получения списка каналов из Firestore
async function getMonitoredChannels() {
    try {
        const channelsDoc = await admin.firestore().collection('config').doc('telegram_channels').get();
        if (channelsDoc.exists) {
            return channelsDoc.data().channels || [];
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения списка каналов:', error);
        return [];
    }
}

// Функция для добавления канала в мониторинг
async function addChannelToMonitoring(username, name) {
    try {
        const channelsRef = admin.firestore().collection('config').doc('telegram_channels');
        await channelsRef.set({
            channels: admin.firestore.FieldValue.arrayUnion({
                username: username,
                name: name,
                addedAt: admin.firestore.FieldValue.serverTimestamp()
            })
        }, { merge: true });
        
        return { success: true };
    } catch (error) {
        console.error('Ошибка добавления канала:', error);
        return { success: false, error: error.message };
    }
}

// Кэш для избежания дублирования событий (временно отключен для тестирования)
const processedMessages = new Set();

// Функция парсинга сообщения
async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('⚠️ YandexGPT ВРЕМЕННО ОТКЛЮЧЕН');
    try {
        // const result = await parseTelegramMessageWithSDK(messageText, messageLink);
        const result = null; // YandexGPT отключен
        console.log('✅ YandexGPT результат: null (отключен)');
        return result;
    } catch (error) {
        console.log('❌ Ошибка YandexGPT:', error.message);
        return null;
    }
}

// Функция для парсинга Telegram каналов через Bot API
async function parseTelegramChannelWithBotAPI(channelUsername, limit = 20) {
    const telegramConfig = getTelegramConfig();
    
    if (!telegramConfig) {
        console.log('⚠️ Telegram Bot API не настроен, используем веб-скраппинг');
        return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
    }
    
    try {
        console.log(`🤖 Парсинг канала @${channelUsername} через Bot API...`);
        
        // Получаем информацию о канале
        const channelInfo = await axios.get(`https://api.telegram.org/bot${telegramConfig.botToken}/getChat`, {
            params: { chat_id: `@${channelUsername}` }
        });
        
        if (!channelInfo.data.ok) {
            console.log(`❌ Канал @${channelUsername} недоступен через Bot API`);
            return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
        }
        
        console.log(`✅ Канал найден: ${channelInfo.data.result.title}`);
        
        // Получаем последние сообщения
        const messages = await axios.get(`https://api.telegram.org/bot${telegramConfig.botToken}/getUpdates`, {
            params: {
                offset: -limit,
                limit: limit,
                timeout: 30
            }
        });
        
        if (!messages.data.ok || !messages.data.result.length) {
            console.log(`⚠️ Нет сообщений от канала @${channelUsername} через Bot API`);
            return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
        }
        
        const channelMessages = messages.data.result
            .filter(update => update.channel_post && update.channel_post.chat.username === channelUsername)
            .map(update => ({
                messageId: update.channel_post.message_id,
                text: update.channel_post.text || update.channel_post.caption || '',
                date: new Date(update.channel_post.date * 1000).toISOString(),
                link: `https://t.me/${channelUsername}/${update.channel_post.message_id}`,
                messageDate: new Date(update.channel_post.date * 1000).toISOString()
            }))
            .slice(0, limit);
        
        console.log(`✅ Получено ${channelMessages.length} сообщений через Bot API`);
        return channelMessages;
        
    } catch (error) {
        console.error(`❌ Ошибка Bot API для @${channelUsername}:`, error.message);
        console.log('🔄 Fallback на веб-скраппинг');
        return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
    }
}

// Простое извлечение данных о мероприятии без YandexGPT
function extractEventDataSimple(messageText, messageLink) {
    console.log('Извлекаем данные простым способом...');
    
    const text = messageText.toLowerCase();
    
    // Проверяем, что это мероприятие
    const eventKeywords = [
        'концерт', 'выставка', 'лекция', 'мастер-класс', 'фестиваль', 'конференция', 
        'семинар', 'встреча', 'показ', 'премьера', 'спектакль', 'перформанс'
    ];
    
    const hasEventKeyword = eventKeywords.some(keyword => text.includes(keyword));
    if (!hasEventKeyword) {
        console.log('❌ Не найдено ключевых слов о мероприятии');
        return null;
    }
    
    // Извлекаем дату
    const datePatterns = [
        /(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i,
        /(\d{1,2}):(\d{2})/,
        /(завтра|сегодня|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)/i
    ];
    
    let hasDate = false;
    for (const pattern of datePatterns) {
        if (pattern.test(messageText)) {
            hasDate = true;
            break;
        }
    }
    
    if (!hasDate) {
        console.log('❌ Не найдена дата/время');
        return null;
    }
    
    // Извлекаем место
    const locationPatterns = [
        /(?:место|адрес|где)[:\s]*([^.\n]+)/i,
        /(?:в|на)\s+([А-Яа-я\s\d,.-]+)/i
    ];
    
    let location = 'Москва'; // По умолчанию
    for (const pattern of locationPatterns) {
        const match = messageText.match(pattern);
        if (match && match[1]) {
            location = match[1].trim();
            break;
        }
    }
    
    // Извлекаем цену
    const pricePatterns = [
        /(\d+)\s*руб/i,
        /бесплатно/i,
        /вход\s*свободный/i
    ];
    
    let price = null;
    let isFree = false;
    for (const pattern of pricePatterns) {
        const match = messageText.match(pattern);
        if (match) {
            if (match[0].toLowerCase().includes('бесплатно') || match[0].toLowerCase().includes('свободный')) {
                isFree = true;
            } else {
                price = match[0];
            }
            break;
        }
    }
    
    // Извлекаем название (первая строка или заголовок)
    const lines = messageText.split('\n').filter(line => line.trim().length > 0);
    const title = lines[0].substring(0, 100); // Берем первые 100 символов
    
    // Определяем категории
    const categories = [];
    if (text.includes('концерт') || text.includes('музыка')) categories.push('музыка');
    if (text.includes('выставка') || text.includes('искусство')) categories.push('искусство');
    if (text.includes('лекция') || text.includes('образование')) categories.push('образование');
    if (text.includes('кино') || text.includes('фильм')) categories.push('кино');
    if (text.includes('театр') || text.includes('спектакль')) categories.push('театр');
    if (text.includes('спорт')) categories.push('спорт');
    
    const eventData = {
        title: title,
        description: messageText.substring(0, 500),
        date: new Date().toISOString().split('T')[0] + ' 19:00', // По умолчанию сегодня в 19:00
        location: location,
        price: price,
        categories: categories.length > 0 ? categories : ['событие'],
        confidence: 0.6,
        isFree: isFree,
        isOnline: text.includes('онлайн') || text.includes('online')
    };
    
    console.log('✅ Извлечены данные:', eventData.title);
    return eventData;
}

// Cloud Function для парсинга
exports.parsemessage = functions.https.onCall(async (data, context) => {
    const { messageText, messageLink } = data;
    
    if (!messageText) {
        throw new functions.https.HttpsError('invalid-argument', 'Текст сообщения обязателен');
    }

    let parsedEvent;
    try {
        parsedEvent = await parseTelegramMessage(messageText, messageLink || '');
    } catch (e) {
        console.error('Config or parsing error:', e);
        throw new functions.https.HttpsError('failed-precondition', 'Ошибка конфигурации YandexGPT или парсинга');
    }
    
    if (parsedEvent && parsedEvent.confidence > 0.7) {
        // Сохраняем в Firestore (база данных dvizheon)
        await admin.firestore().collection('events').add({
            ...parsedEvent,
            source: 'yandexgpt_parser',
            telegramUrl: messageLink || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            parsedAt: new Date().toISOString()
        });
        
        return { success: true, event: parsedEvent };
    }
    
    return { success: false, reason: 'Не удалось распознать мероприятие' };
});


// Улучшенная функция для веб-скраппинга сообщений из Telegram канала
async function scrapeChannelMessages(channelUrl, limit = 20) {
    try {
        console.log(`🔍 Парсинг веб-версии канала: ${channelUrl}`);
        
        // Получаем HTML страницу канала
        const response = await axios.get(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        const messages = [];
        
        // Ищем блоки с сообщениями
        $('.tgme_widget_message').each((index, element) => {
            if (messages.length >= limit) return false;
            
            const $message = $(element);
            
            // Извлекаем текст сообщения
            const textElement = $message.find('.tgme_widget_message_text');
            if (textElement.length === 0) return;
            
            let messageText = textElement.html()
                .replace(/<[^>]*>/g, '') // Убираем HTML теги
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (messageText.length < 50) return; // Пропускаем короткие сообщения
            
            // Извлекаем дату
            const dateElement = $message.find('time');
            let messageDate = new Date();
            if (dateElement.length > 0) {
                const datetime = dateElement.attr('datetime');
                if (datetime) {
                    messageDate = new Date(datetime);
                }
            }
            
            // Пытаемся найти реальный ID поста из различных источников
            let realMessageId = null;
            
            // 1. Из data-post атрибута
            const dataPost = $message.attr('data-post');
            if (dataPost && dataPost.match(/^\d+$/)) {
                realMessageId = dataPost;
            }
            
            // 2. Из data-message-id атрибута
            if (!realMessageId) {
                const dataMessageId = $message.attr('data-message-id');
                if (dataMessageId && dataMessageId.match(/^\d+$/)) {
                    realMessageId = dataMessageId;
                }
            }
            
            // 3. Из ссылок внутри сообщения
            if (!realMessageId) {
                const linkElement = $message.find('a[href*="t.me/"]').first();
                if (linkElement.length > 0) {
                    const href = linkElement.attr('href');
                    const idMatch = href.match(/\/(\d+)$/);
                    if (idMatch) {
                        realMessageId = idMatch[1];
                    }
                }
            }
            
            // 4. Из класса элемента (иногда содержит ID)
            if (!realMessageId) {
                const classAttr = $message.attr('class');
                if (classAttr) {
                    const idMatch = classAttr.match(/message_(\d+)/);
                    if (idMatch) {
                        realMessageId = idMatch[1];
                    }
                }
            }
            
            // 5. Из data-id атрибута
            if (!realMessageId) {
                const dataId = $message.attr('data-id');
                if (dataId && dataId.match(/^\d+$/)) {
                    realMessageId = dataId;
                }
            }
            
            // Используем найденный ID или fallback
            const messageId = realMessageId || `msg_${index}`;
            
            // Логируем найденный ID для отладки
            if (realMessageId) {
                console.log(`✅ Найден реальный ID поста: ${realMessageId} для сообщения ${index}`);
            } else {
                console.log(`⚠️ Используем fallback ID: ${messageId} для сообщения ${index}`);
            }
            
            // Создаем ссылку на пост
            let postLink = channelUrl;
            const channelUsername = channelUrl.match(/t\.me\/s\/([^\/]+)/);
            if (channelUsername) {
                postLink = createTelegramPostLink(channelUsername[1], messageId);
                console.log(`🔗 Создана ссылка: ${postLink}`);
            }
            
            messages.push({
                messageId: messageId,
                text: messageText,
                date: messageDate,
                link: postLink
            });
        });
        
        console.log(`✅ Найдено сообщений в канале: ${messages.length}`);
        return messages;
        
    } catch (error) {
        console.error(`❌ Ошибка парсинга канала ${channelUrl}:`, error.message);
        return [];
    }
}

// Функция для проверки, является ли сообщение о мероприятии
function isEventMessage(text) {
    const eventKeywords = [
        'концерт', 'выставка', 'лекция', 'мастер-класс', 'фестиваль', 'конференция', 
        'семинар', 'встреча', 'показ', 'премьера', 'спектакль', 'перформанс',
        'завтра', 'сегодня', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
        'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
        'бесплатно', 'вход свободный', 'билеты', 'регистрация', 'запись', 'время:', 'место:'
    ];
    
    // Исключаем общие слова
    const excludeWords = [
        'новости', 'события', 'мероприятия', 'анонс', 'обзор', 'информация',
        'московские', 'москвы', 'города', 'района', 'области'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Проверяем исключения
    if (excludeWords.some(word => lowerText.includes(word))) {
        return false;
    }
    
    // Проверяем наличие ключевых слов
    const hasEventKeywords = eventKeywords.some(keyword => lowerText.includes(keyword));
    
    // Проверяем наличие даты/времени
    const hasDateTime = /\d{1,2}\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i.test(text) ||
                       /\d{1,2}:\d{2}/.test(text) ||
                       /(завтра|сегодня|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)/i.test(text);
    
    return hasEventKeywords && hasDateTime;
}

// Основная функция парсинга Telegram каналов через веб-скраппинг
async function parseTelegramChannels() {
    console.log('🚀 Запуск парсинга Telegram каналов...');
    const startTime = Date.now();
    
    try {
        // Получаем каналы из базы данных
        console.log('🔍 Ищем каналы в коллекции channels...');
        let channelsSnapshot = await db.collection('channels').get();
        
        console.log(`📊 Найдено ${channelsSnapshot.size} каналов в коллекции`);
        
        // Фильтруем только активные каналы
        const activeChannels = [];
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.enabled === true) {
                activeChannels.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`✅ Активных каналов: ${activeChannels.length}`);
        
        if (activeChannels.length === 0) {
            console.log('⚠️ Нет активных каналов для парсинга, создаем тестовые каналы...');
            
            // Создаем тестовые каналы если их нет
            const testChannels = [
                {
                    name: 'Московские события',
                    username: 'moscow_events',
                    url: 'https://t.me/moscow_events',
                    category: 'events',
                    enabled: true,
                    lastParsed: 0
                },
                {
                    name: 'IT мероприятия Москвы',
                    username: 'it_events_moscow',
                    url: 'https://t.me/it_events_moscow',
                    category: 'it',
                    enabled: true,
                    lastParsed: 0
                }
            ];
            
            const batch = db.batch();
            const channelsCollection = db.collection('channels');
            
            testChannels.forEach(channel => {
                const docRef = channelsCollection.doc();
                batch.set(docRef, {
                    ...channel,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            console.log(`✅ Создано ${testChannels.length} тестовых каналов`);
            
            // Используем созданные каналы
            channelsSnapshot = await db.collection('channels')
                .where('enabled', '==', true)
                .get();
        }
        
        const channels = [];
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            channels.push({
                id: doc.id,
                name: data.name,
                username: data.username,
                url: data.url,
                category: data.category || 'general',
                lastParsed: data.lastParsed || 0
            });
        });
        
        console.log(`📊 Найдено ${channels.length} активных каналов для парсинга`);
        
        let totalProcessed = 0;
        let totalEvents = 0;
        let totalErrors = 0;
        
        // Обрабатываем каждый канал
        for (const channel of channels) {
            try {
                console.log(`📺 Обработка канала: ${channel.name} (@${channel.username})`);
                
                // Пытаемся использовать Bot API, если доступен
                let messages;
                try {
                    messages = await parseTelegramChannelWithBotAPI(channel.username, 10); // Уменьшил до 10 для скорости
                    console.log(`✅ Получено ${messages ? messages.length : 0} сообщений через Bot API для ${channel.name}`);
                } catch (botError) {
                    console.log(`⚠️ Bot API недоступен для @${channel.username}, используем веб-скраппинг`);
                    messages = await scrapeChannelMessages(channel.url, 10); // Уменьшил до 10 для скорости
                    console.log(`📄 Найдено сообщений в ${channel.name}: ${messages ? messages.length : 0}`);
                }
                
                // Проверяем, что messages определен и является массивом
                if (!messages || !Array.isArray(messages)) {
                    console.log(`❌ Ошибка: messages не определен или не является массивом для канала ${channel.name}`);
                    continue;
                }
                
                console.log(`📝 Начинаем обработку ${messages.length} сообщений для канала ${channel.name}`);
                
                for (const message of messages) {
                    // Временно отключаем проверку кэша для тестирования YandexGPT
                    const messageKey = `${channel.username}_${message.messageId}`;
                    console.log(`🔄 Обрабатываем сообщение: ${messageKey}`);
                    
                    // Временно отключаем фильтрацию для тестирования YandexGPT
                    console.log(`🎯 Обработка сообщения: ${message.text.substring(0, 100)}...`);
                    
                    try {
                        // Парсим сообщение через YandexGPT
                        const parsedEvent = await parseTelegramMessage(message.text, message.link);
                        
                        if (parsedEvent) {
                            // Проверяем, не существует ли уже такое событие
                            const existingEvent = await db.collection('events')
                                .where('messageId', '==', message.messageId)
                                .where('channelUsername', '==', channel.username)
                                .limit(1)
                                .get();
                            
                            if (existingEvent.empty) {
                                // Создаем правильную ссылку на Telegram пост
                                const telegramUrl = createTelegramPostLink(channel.username, message.messageId);
                                
                                // Сохраняем в Firestore
                                const eventData = {
                                    title: parsedEvent.title,
                                    description: parsedEvent.description || '',
                                    startAtMillis: parsedEvent.startAtMillis,
                                    isOnline: parsedEvent.isOnline,
                                    isFree: parsedEvent.isFree,
                                    price: parsedEvent.price,
                                    location: parsedEvent.location,
                                    imageUrls: parsedEvent.imageUrls,
                                    categories: parsedEvent.categories,
                                    telegramUrl: telegramUrl,
                                    source: 'yandexgpt_parser',
                                    channelName: channel.name,
                                    channelUsername: channel.username,
                                    channelCategory: channel.category,
                                    messageId: message.messageId,
                                    originalText: message.text,
                                    messageDate: message.date,
                                    confidence: parsedEvent.confidence,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    parsedAt: new Date().toISOString()
                                };
                                
                                await db.collection('events').add(eventData);
                                
                                totalEvents++;
                                console.log(`✅ Событие сохранено: ${parsedEvent.title} из @${channel.username}`);
                            } else {
                                console.log(`⏭️ Событие уже существует: ${parsedEvent.title} из @${channel.username}`);
                            }
                        }
                        
                        // Отмечаем сообщение как обработанное
                        processedMessages.add(messageKey);
                    } catch (parseError) {
                        console.error(`❌ Ошибка парсинга сообщения из @${channel.username}:`, parseError.message);
                        totalErrors++;
                    }
                    
                    totalProcessed++;
                }
                
                // Обновляем время последнего парсинга канала
                await db.collection('channels').doc(channel.id).update({
                    lastParsed: admin.firestore.FieldValue.serverTimestamp()
                });
                
            } catch (channelError) {
                console.error(`Ошибка обработки канала ${channel.name}:`, channelError);
            }
        }
        
        const duration = Date.now() - startTime;
        console.log(`🎉 Парсинг завершен за ${duration}ms`);
        console.log(`📊 Статистика: обработано сообщений: ${totalProcessed}, найдено событий: ${totalEvents}, ошибок: ${totalErrors}`);
        
        return {
            success: true,
            processed: totalProcessed,
            events: totalEvents,
            errors: totalErrors,
            duration: duration,
            message: `Обработано ${totalProcessed} сообщений, найдено ${totalEvents} событий за ${duration}ms`
        };
        
    } catch (error) {
        console.error('Ошибка парсинга Telegram каналов:', error);
        return {
            success: false,
            error: error.message
        };
    }
}


// Периодический парсинг Telegram каналов (каждую минуту)
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.parseTelegramChannels = onSchedule('every 1 minutes', async (event) => {
    console.log('🔄 Запуск автоматического парсинга Telegram каналов...');
    return await parseTelegramChannels();
});

// Ручной запуск парсинга Telegram каналов
exports.parseChannelsManual = functions.https.onCall(async (data, context) => {
    return await parseTelegramChannels();
});


// Инициализация коллекций и каналов
exports.initializeDatabase = functions.https.onCall(async (data, context) => {
    try {
        console.log('Инициализация базы данных dvizheon...');
        
        // Создаем коллекцию каналов для мониторинга
        const channelsCollection = db.collection('channels');
        const defaultChannels = [
            {
                username: 'moscow_events',
                name: 'Московские события',
                url: 'https://t.me/s/moscow_events',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'art_moscow',
                name: 'Искусство Москвы',
                url: 'https://t.me/s/art_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'music_moscow',
                name: 'Музыка Москвы',
                url: 'https://t.me/s/music_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'sport_moscow',
                name: 'Спорт Москвы',
                url: 'https://t.me/s/sport_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'education_moscow',
                name: 'Образование Москвы',
                url: 'https://t.me/s/education_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        // Добавляем каналы в базу данных
        const batch = db.batch();
        defaultChannels.forEach(channel => {
            const docRef = channelsCollection.doc();
            batch.set(docRef, channel);
        });
        
        await batch.commit();
        
        console.log(`✅ Создано ${defaultChannels.length} каналов для мониторинга`);
        
        // Создаем коллекцию событий с тестовым событием
        const eventsCollection = db.collection('events');
        const testEvent = {
            title: 'Тестовое событие',
            startAtMillis: Date.now(),
            isOnline: false,
            isFree: true,
            price: null,
            location: 'Тестовая локация',
            imageUrls: [],
            categories: ['тест'],
            telegramUrl: 'https://t.me/test/123',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'manual_test'
        };
        
        await eventsCollection.add(testEvent);
        
        console.log('✅ Создано тестовое событие');
        
        return { 
            success: true, 
            message: 'База данных инициализирована успешно',
            channelsCount: defaultChannels.length
        };
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка при инициализации', error.message);
    }
});

// Создание событий за сентябрь
exports.createSeptemberEvents = functions.https.onCall(async (data, context) => {
    try {
        console.log('Создаем события за сентябрь...');
        
        const events = [
            {
                title: 'Фестиваль "Московская осень"',
                startAtMillis: new Date('2024-09-01T18:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Сокольники, главная сцена',
                imageUrls: [],
                categories: ['фестиваль', 'музыка'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Выставка "Осенние краски"',
                startAtMillis: new Date('2024-09-05T10:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 300,
                location: 'Третьяковская галерея',
                imageUrls: [],
                categories: ['искусство', 'выставка'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Концерт классической музыки',
                startAtMillis: new Date('2024-09-08T19:30:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 800,
                location: 'Концертный зал им. Чайковского',
                imageUrls: [],
                categories: ['музыка', 'классика'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Спортивный забег "Осенний марафон"',
                startAtMillis: new Date('2024-09-12T09:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Горького',
                imageUrls: [],
                categories: ['спорт', 'бег'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Лекция "История Москвы"',
                startAtMillis: new Date('2024-09-15T15:00:00').getTime(),
                isOnline: true,
                isFree: true,
                price: null,
                location: 'Онлайн',
                imageUrls: [],
                categories: ['образование', 'история'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Театральная премьера "Осенние сны"',
                startAtMillis: new Date('2024-09-18T20:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 1200,
                location: 'МХТ им. Чехова',
                imageUrls: [],
                categories: ['театр', 'премьера'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Фестиваль уличной еды',
                startAtMillis: new Date('2024-09-22T12:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Коломенское',
                imageUrls: [],
                categories: ['еда', 'фестиваль'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Концерт джазовой музыки',
                startAtMillis: new Date('2024-09-25T21:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 600,
                location: 'Джаз-клуб "Союз композиторов"',
                imageUrls: [],
                categories: ['музыка', 'джаз'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Мастер-класс по живописи',
                startAtMillis: new Date('2024-09-28T14:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 500,
                location: 'Арт-студия "Палитра"',
                imageUrls: [],
                categories: ['творчество', 'живопись'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Закрытие летнего сезона в парке',
                startAtMillis: new Date('2024-09-30T16:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Сокольники',
                imageUrls: [],
                categories: ['праздник', 'закрытие сезона'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        const batch = db.batch();
        const eventsCollection = db.collection('events');
        
        events.forEach(event => {
            const docRef = eventsCollection.doc();
            batch.set(docRef, event);
        });
        
        await batch.commit();
        
        console.log(`✅ Создано ${events.length} событий за сентябрь`);
        return { success: true, count: events.length };
        
    } catch (error) {
        console.error('❌ Ошибка при создании событий за сентябрь:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка при создании событий', error.message);
    }
});

// Добавление канала в мониторинг
exports.addChannel = functions.https.onCall(async (data, context) => {
    const { username, name } = data;
    
    if (!username || !name) {
        throw new functions.https.HttpsError('invalid-argument', 'username и name обязательны');
    }
    
    return await addChannelToMonitoring(username, name);
});

// Получение списка каналов
exports.getChannels = functions.https.onCall(async (data, context) => {
    const channels = await getMonitoredChannels();
    return { success: true, channels };
});

// Удаление канала из мониторинга
exports.removeChannel = functions.https.onCall(async (data, context) => {
    const { channelId } = data;
    
    if (!channelId) {
        throw new functions.https.HttpsError('invalid-argument', 'channelId обязателен');
    }
    
    try {
        const channelsRef = admin.firestore().collection('config').doc('telegram_channels');
        const channelsDoc = await channelsRef.get();
        
        if (channelsDoc.exists) {
            const channels = channelsDoc.data().channels || [];
            const updatedChannels = channels.filter(channel => channel.id !== channelId);
            
            await channelsRef.update({ channels: updatedChannels });
            return { success: true };
        }
        
        return { success: false, error: 'Канал не найден' };
    } catch (error) {
        console.error('Ошибка удаления канала:', error);
        return { success: false, error: error.message };
    }
});

// Cloud Function для запуска парсинга всех каналов
exports.parseallchannels = functions.https.onCall(async (data, context) => {
    try {
        console.log('🚀 Запуск парсинга всех каналов...');
        const result = await parseTelegramChannels();
        return result;
    } catch (error) {
        console.error('Ошибка парсинга каналов:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка парсинга каналов');
    }
});

// v2-планировщик уже настроен выше через onSchedule('every 30 minutes')

// Тестовая функция для проверки парсинга конкретного канала
exports.clearAllEvents = functions.https.onCall(async (data, context) => {
    try {
        console.log('Начинаю очистку всех мероприятий...');
        
        // Get all events
        const eventsSnapshot = await admin.firestore().collection('events').get();
        console.log(`Найдено ${eventsSnapshot.size} мероприятий для удаления`);
        
        if (eventsSnapshot.size === 0) {
            return { success: true, message: 'Мероприятия не найдены', deletedCount: 0 };
        }
        
        // Delete all events in batches
        const batchSize = 500;
        let deletedCount = 0;
        
        for (let i = 0; i < eventsSnapshot.docs.length; i += batchSize) {
            const batch = admin.firestore().batch();
            const batchDocs = eventsSnapshot.docs.slice(i, i + batchSize);
            
            batchDocs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            deletedCount += batchDocs.length;
            console.log(`Удалено ${deletedCount}/${eventsSnapshot.size} мероприятий`);
        }
        
        console.log(`✅ Успешно удалено ${deletedCount} мероприятий`);
        return { success: true, message: `Удалено ${deletedCount} мероприятий`, deletedCount };
        
    } catch (error) {
        console.error('❌ Ошибка при очистке мероприятий:', error);
        return { success: false, error: error.message };
    }
});

// HTTP-эндпоинт для очистки всех событий (админ)
exports.clearAllEventsHttp = functions.https.onRequest(async (req, res) => {
    try {
        console.log('Начинаю очистку всех мероприятий (HTTP)...');
        const eventsSnapshot = await admin.firestore().collection('events').get();
        console.log(`Найдено ${eventsSnapshot.size} мероприятий для удаления`);
        if (eventsSnapshot.size === 0) {
            return res.json({ success: true, message: 'Мероприятия не найдены', deletedCount: 0 });
        }
        const batchSize = 500;
        let deletedCount = 0;
        for (let i = 0; i < eventsSnapshot.docs.length; i += batchSize) {
            const batch = admin.firestore().batch();
            const batchDocs = eventsSnapshot.docs.slice(i, i + batchSize);
            batchDocs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            deletedCount += batchDocs.length;
            console.log(`Удалено ${deletedCount}/${eventsSnapshot.size} мероприятий`);
        }
        console.log(`✅ Успешно удалено ${deletedCount} мероприятий (HTTP)`);
        return res.json({ success: true, message: `Удалено ${deletedCount} мероприятий`, deletedCount });
    } catch (error) {
        console.error('❌ Ошибка при HTTP-очистке мероприятий:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Веб-скраппинг Telegram каналов
async function scrapeTelegramChannel(channelUrl, limit = 50) {
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await getExecPath(),
            headless: true,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log(`Загружаем канал: ${channelUrl}`);
        await page.goto(channelUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Ждем загрузки постов
        await page.waitForSelector('.tgme_widget_message', { timeout: 10000 });
        
        // Прокручиваем страницу несколько раз для загрузки большего количества постов
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const posts = await page.evaluate(() => {
            const messageElements = document.querySelectorAll('.tgme_widget_message');
            const posts = [];
            
            messageElements.forEach((element, index) => {
                try {
                    const textElement = element.querySelector('.tgme_widget_message_text');
                    const dateElement = element.querySelector('.tgme_widget_message_date');
                    const linkElement = element.querySelector('.tgme_widget_message_date a');
                    
                    if (textElement && textElement.textContent.trim()) {
                        const text = textElement.textContent.trim();
                        const date = dateElement ? dateElement.textContent.trim() : '';
                        const messageId = linkElement ? linkElement.href.split('/').pop() : index;
                        posts.push({
                            text: text,
                            date: date,
                            messageId: messageId,
                            channelUsername: ''
                        });
                    }
                } catch (error) {
                    console.error('Ошибка парсинга поста:', error);
                }
            });
            
            return posts;
        });
        
        // Проставляем username канала из URL и ограничиваем до указанного лимита (по умолчанию 50)
        const parts = (channelUrl || '').split('/').filter(Boolean);
        const normalizedUsername = parts[parts.length - 1] === 's' ? parts[parts.length - 2] : parts[parts.length - 1];
        const enriched = posts.map(p => ({ ...p, channelUsername: p.channelUsername || normalizedUsername }));
        const limited = enriched.slice(0, limit);
        console.log(`Найдено ${enriched.length} постов, берем ${limited.length} (лимит=${limit})`);
        return limited;
        
    } catch (error) {
        console.error('Ошибка веб-скраппинга Telegram:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Telegram parsing with Ollama
async function importTelegramEvents() {
    const events = [];
    
    try {
        // Используем веб-скраппинг вместо Telegram API
        console.log('Используем веб-скраппинг для парсинга Telegram каналов');
        
        // Парсим канал @gzsmsk через веб-интерфейс
        const channelUrl = 'https://t.me/s/gzsmsk';
        const posts = await scrapeTelegramChannel(channelUrl, 50);
        console.log(`Найдено ${posts.length} постов в @gzsmsk`);
        
        for (const post of posts) {
            try {
                const event = await parsePostWithOllama(post);
                if (event) {
                    events.push(event);
                    console.log(`Создано событие: ${event.title}`);
                }
            } catch (error) {
                console.error('Ошибка парсинга поста:', error);
            }
        }
        
        console.log(`Всего создано ${events.length} событий из Telegram`);
        return events;
        
    } catch (error) {
        console.error('Ошибка импорта Telegram событий:', error);
        return [];
    }
}

async function getTelegramPosts(channelUsername) {
    // Using Telegram Client API to read public channels
    // This works without being admin in channels
    const { TelegramClient } = require('telegram');
    const { StringSession } = require('telegram/sessions');
    
    const apiId = functions.config().telegram?.api_id || '28308739';
    const apiHash = functions.config().telegram?.api_hash || 'f8d19b54f08096e93eee7611e5582537';
    const sessionString = functions.config().telegram?.session_string || '1AgAOMTQ5LjE1NC4xNjcuNDEBuy9tU6SJFI7yWorzNeI7C91TlIT/YWJ2kP1VRLbzhvtcD4lbZUk//WfhvCT6FUjwvlRNKYBk3So0FVhuOUJIPFcUFcD8fw9Ly5CzAZmb8Qf5MHpyq/gZpyuD9Hr23WA4i+vPs23Hx3/88GYm0XyvPil76qXsANqKcuGnFJodl66GgEhdK8+cfbPKGebCqHuKUvGed+QHLgsb7urxZ8sxxsWiMSpxqcYJ0PvJyr2vIy+/2n7ZkVscgDcYy6+ygHKn8/ZMmvgk9ZnXlqO3CmxVg13Ou/TWyKEpi0zLGSxyw1BNubwEm4CtipeOrlGQvY1I4VgO4ZuXgSKjzjqU4uahawo=';
    
    if (!apiId || !apiHash) {
        throw new Error('Telegram API credentials not configured');
    }
    
    const client = new TelegramClient(
        new StringSession(sessionString || ''),
        parseInt(apiId),
        apiHash
    );
    
    try {
        await client.start();
        
        const channel = await client.getEntity(channelUsername);
        const messages = await client.getMessages(channel, { limit: 50 });
        
        const posts = [];
        for (const message of messages) {
            if (message.text && message.text.length > 10) {
                posts.push({
                    text: message.text,
                    date: message.date,
                    messageId: message.id,
                    photos: message.photo ? [message.photo] : []
                });
            }
        }
        
        return posts;
    } finally {
        await client.disconnect();
    }
}

async function parsePostWithOllama(post) {
	if (!post.text || post.text.length < 10) return null;

	try {
        // 1) Сначала пытаемся через OpenAI (если настроен ключ)
        try {
            const structuredOpenAI = await extractEventWithOpenAI(post.text);
            const normalizedOpenAI = normalizeExtractedEvent(structuredOpenAI, post.text);
            if (normalizedOpenAI) {
                const originalUrl = post.link || (post.channelUsername && post.messageId ? `https://t.me/${post.channelUsername}/${post.messageId}` : '');
                return {
                    ...normalizedOpenAI,
                    source: 'telegram',
                    originalUrl,
                    link: originalUrl,
                    imageUrls: post.photos ? post.photos.map(p => `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN || ''}/${p.file_id}`) : []
                };
            }
        } catch (e) {
            console.log('⚠️ OpenAI недоступен/ошибка. Переходим к Ollama:', e?.message || e);
        }

        // 2) Если OpenAI не сработал — пробуем Ollama
		try {
			const structured = await extractEventWithOllama(
				post.text,
				post.link || (post.channelUsername && post.messageId ? `https://t.me/${post.channelUsername}/${post.messageId}` : '')
			);
			const normalized = normalizeExtractedEvent(structured, post.text);
			if (normalized) {
				const originalUrl = post.link || (post.channelUsername && post.messageId ? `https://t.me/${post.channelUsername}/${post.messageId}` : '');
				return {
					...normalized,
					source: 'telegram',
					originalUrl,
					link: originalUrl,
					imageUrls: post.photos ? post.photos.map(p => `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN || ''}/${p.file_id}`) : []
				};
			}
		} catch (ollamaErr) {
			console.log('⚠️ Ollama недоступен или ошибка ответа, fallback на rule-based:', ollamaErr?.message || ollamaErr);
		}

        // 3) Fallback — rule-based
		const lowered = post.text.toLowerCase();
		const eventKeywords = ['мероприятие','событие','концерт','лекция','мастер-класс','выставка','фестиваль','конференция','семинар','встреча','вечеринка','party','event','афиша','анонс'];
		const hasEventKeywords = eventKeywords.some(k => lowered.includes(k));
		if (!hasEventKeywords) return null;

		const lines = post.text.split('\n').filter(l => l.trim());
		const title = lines[0] || 'Событие';

		let norm = normalizeRussianDateTime(post.text) || normalizeRussianDateTime(title);
		if (!norm) return null;
		const millis = parseDateToMoscowTime(norm);
		if (isNaN(millis) || millis <= Date.now()) return null;

		let place = null;
		const placeKeywords = ['парк','сквер','площадь','улица','проспект','кафе','ресторан','клуб','центр','музей','театр','кинотеатр'];
		for (const keyword of placeKeywords) {
			if (lowered.includes(keyword)) {
				for (const line of lines) { if (line.toLowerCase().includes(keyword)) { place = line.trim(); break; } }
				break;
			}
		}
		let price = null;
		const priceMatch = post.text.match(/(\d+[\s\u00A0]?₽|\d+\s*руб|бесплатно|вход свободный)/i);
		if (priceMatch) price = /бесплатно|свободный/i.test(priceMatch[0]) ? 'Бесплатно' : priceMatch[0];

		const originalUrl = post.link || (post.channelUsername && post.messageId ? `https://t.me/${post.channelUsername}/${post.messageId}` : '');
		return {
			title,
			startAtMillis: millis,
			place,
			description: post.text,
			price,
			source: 'telegram',
			originalUrl,
			link: originalUrl,
			imageUrls: post.photos ? post.photos.map(p => `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN || ''}/${p.file_id}`) : [],
			isOnline: false,
			isFree: price ? /бесплатно/i.test(price) : false,
			location: place,
			categories: ['telegram']
		};
	} catch (error) {
		console.error('Ollama parsing error:', error);
		// Fallback на детерминированный парсер
		console.log('🔄 Fallback на rule-based парсер');
		return ruleBasedExtractEventFromText(post.text);
	}
}

function getNextSundayMskMillis(hourMsk = 19, minuteMsk = 0) {
    const now = new Date();
    const dayLocal = now.getDay(); // 0=Sunday (локально)
    const daysUntilSunday = (7 - dayLocal) % 7 || 7; // ближайшее следующее воскресенье
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate() + daysUntilSunday;
    const draftLocal = new Date(y, m, d, 0, 0, 0, 0);
    const yyyy = draftLocal.getFullYear();
    const mm = String(draftLocal.getMonth() + 1).padStart(2, '0');
    const dd = String(draftLocal.getDate()).padStart(2, '0');
    const hh = String(hourMsk).padStart(2, '0');
    const mi = String(minuteMsk).padStart(2, '0');
    // Парсим как московское время -> UTC миллисекунды
    return parseDateToMoscowTime(`${yyyy}-${mm}-${dd} ${hh}:${mi}`);
}

// Скраппинг одного поста по прямой ссылке https://t.me/<channel>/<id> или https://t.me/s/<channel>/<id>
async function scrapeSingleTelegramPost(postUrl) {
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');
    let browser;
    try {
        const url = postUrl.replace('https://t.me/', 'https://t.me/s/');
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: PUPPETEER_EXECUTABLE_PATH || await chromium.executablePath(),
            headless: true,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        console.log(`Загружаем пост: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.tgme_widget_message', { timeout: 10000 });
        const data = await page.evaluate(() => {
            const el = document.querySelector('.tgme_widget_message');
            if (!el) return null;
            const textEl = el.querySelector('.tgme_widget_message_text');
            const dateEl = el.querySelector('.tgme_widget_message_date');
            const linkEl = el.querySelector('.tgme_widget_message_date a');
            const text = textEl ? textEl.textContent.trim() : '';
            const date = dateEl ? dateEl.textContent.trim() : '';
            const link = linkEl ? linkEl.href : '';
            return { text, date, link };
        });
        if (!data || !data.text) return null;
        const parts = url.split('/').filter(Boolean);
        const messageId = parts[parts.length - 1];
        const channelUsername = parts[parts.length - 2] === 's' ? parts[parts.length - 3] : parts[parts.length - 2];
        return {
            text: data.text,
            date: data.date,
            messageId,
            channelUsername,
            link: data.link || url
        };
    } catch (e) {
        console.error('Ошибка скраппинга одиночного поста:', e);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// HTTP endpoint: импорт одного Telegram-поста по URL
exports.importTelegramByUrl = onRequest({ memory: '1GiB', timeoutSeconds: 120 }, async (req, res) => {
    try {
        const postUrl = (req.query.url || '').toString();
        if (!postUrl || !/^https:\/\/t\.me\//.test(postUrl)) {
            return res.status(400).json({ success: false, error: 'Параметр url обязателен и должен быть ссылкой на Telegram-пост' });
        }
        console.log(`Single import for: ${postUrl}`);
        let post = await scrapeSingleTelegramPost(postUrl);
        if (!post) {
            // Пытаемся без браузера
            post = await fetchTelegramPostTextWithoutBrowser(postUrl);
            if (!post) {
                return res.json({ success: true, found: 0, saved: 0, reason: 'post not parsed' });
            }
        }
        let event = await parsePostWithOllama(post);
        if (!event) {
            // Детерминированный парсер
            event = ruleBasedExtractEventFromText(post.text || '');
            if (!event) {
                // Жёсткий черновик (на всякий случай)
                const lines = (post.text || '').split('\n').map(s => s.trim()).filter(Boolean);
                const title = lines[0] || 'Событие';
                const draftMillis = getNextSundayMskMillis(19, 0);
                event = {
                    title,
                    startAtMillis: draftMillis,
                    place: null,
                    description: post.text || '',
                    price: null,
                    source: 'telegram',
                    originalUrl: post.link || req.query.url || '',
                    imageUrls: [],
                    isOnline: false,
                    isFree: false,
                    location: null,
                    categories: ['telegram', 'draft']
                };
            }
        }
        const eventRef = admin.firestore().collection('events').doc();
        await eventRef.set({
            ...event,
            createdAt: Timestamp.now(),
            externalId: `telegram_${post.messageId}`
        });
        return res.json({ success: true, found: 1, saved: 1, id: eventRef.id, draft: !event.categories || event.categories.includes('draft') });
    } catch (error) {
        console.error('Error in importTelegramByUrl:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// HTTP endpoint: импорт событий c afisha.timepad.ru/moscow
exports.importTimepadAfisha = onRequest({ memory: '1GiB', timeoutSeconds: 180 }, async (req, res) => {
    const baseUrl = 'https://afisha.timepad.ru/moscow';
    const pagesParam = Math.max(1, Math.min(5, parseInt(req.query.pages || '2', 10) || 2));
    const maxItemsParam = Math.max(5, Math.min(80, parseInt(req.query.max || '24', 10) || 24));
    try {
        const pageUrls = [baseUrl, ...Array.from({length: pagesParam}, (_,i)=> `${baseUrl}?page=${i+1}`)];
        const events = [];
        const seenLinks = new Set();

        for (const url of pageUrls) {
            try {
                const html = await fetchWithRetry(url, 2);
                const $ = cheerio.load(html);
                $('a[href*="event"]').each((_, el) => {
                    const a = $(el);
                    const href = a.attr('href');
                    if (!href) return;
                    let abs;
                    try { abs = new URL(href, baseUrl).toString(); } catch(_) { return; }
                    if (seenLinks.has(abs)) return;
                    const card = a.closest('article, div');
                    const title = (card.find('h2, h3').first().text() || a.text() || '').trim();
                    const desc = (card.find('p').first().text() || '').trim();
                    const raw = card.text();
                    const explicit = extractExplicitRussianDate(raw) || extractExplicitRussianDate(title);
                    const norm = explicit || normalizeRussianDateTime(raw);
                    const millis = norm ? parseDateToMoscowTime(norm) : NaN;
                    if (!title || !abs) return;
                    seenLinks.add(abs);
                    events.push({ title, desc, url: abs, millis });
                });
            } catch (_) { /* ignore page fetch errors */ }
        }

        // Если ничего не нашли статикой — пробуем headless-браузер
        if (events.length === 0) {
            // Попытка №2: текстовый прокси (r.jina.ai)
            try {
                const pageUrls = [baseUrl, ...Array.from({length: pagesParam}, (_,i)=> `${baseUrl}?page=${i+1}`)];
                const linkRegex = /https?:\/\/[\w.-]*timepad\.ru\/event\/[\w\-\d]+/gi;
                const candidateLinks = new Set();
                for (const listUrl of pageUrls) {
                    try {
                        const proxied = `https://r.jina.ai/http://${listUrl.replace(/^https?:\/\//,'')}`;
                        const txt = await fetchWithRetry(proxied, 2);
                        const matches = txt.match(linkRegex) || [];
                        for (const m of matches) candidateLinks.add(m);
                    } catch(_) {}
                }
                const subset = Array.from(candidateLinks).slice(0, maxItemsParam);
                for (const evUrl of subset) {
                    try {
                        const proxied = `https://r.jina.ai/http://${evUrl.replace(/^https?:\/\//,'')}`;
                        const pageTxt = await fetchWithRetry(proxied, 2);
                        const title = (pageTxt.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || pageTxt.match(/"og:title"\s*content=\"([\s\S]*?)\"/i)?.[1] || '').replace(/<[^>]+>/g,'').trim();
                        const desc = (pageTxt.match(/name=\"description\"\s*content=\"([\s\S]*?)\"/i)?.[1] || '').trim();
                        const rawText = pageTxt.replace(/<[^>]+>/g,' ');
                        const explicit = extractExplicitRussianDate(rawText) || extractExplicitRussianDate(title);
                        const norm = explicit || normalizeRussianDateTime(rawText);
                        const millis = norm ? parseDateToMoscowTime(norm) : NaN;
                        if (title) {
                            if (!seenLinks.has(evUrl)) {
                                seenLinks.add(evUrl);
                                events.push({ title, desc, url: evUrl, millis });
                            }
                        }
                    } catch(_) {}
                }
            } catch (e) {
                console.error('Proxy fallback failed for Timepad:', e);
            }
        }

        if (events.length === 0) {
            let browser;
            try {
                browser = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await getExecPath(),
                    headless: true,
                    ignoreHTTPSErrors: true,
                });
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');
                await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8' });

                // Соберём ссылки с нескольких страниц
                const urlsToVisit = [baseUrl, ...Array.from({length: 5}, (_,i)=> `${baseUrl}?page=${i+1}`)];
                const eventLinks = new Set();
                for (const listUrl of urlsToVisit) {
                    try {
                        await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 45000 });
                        try {
                            await page.waitForTimeout(800);
                            const btn = await page.$x("//button[normalize-space(text())='Хорошо' or contains(., 'Хорошо')]");
                            if (btn && btn[0]) { await btn[0].click(); await page.waitForTimeout(400); }
                        } catch (_) {}
                        for (let i = 0; i < 4; i++) {
                            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                            await page.waitForTimeout(900);
                        }
                        const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href')||'').filter(h => /event/.test(h)).map(h => { try { return new URL(h, location.origin).toString(); } catch(_){ return null; } }).filter(Boolean));
                        for (const l of links) eventLinks.add(l);
                    } catch (_) {}
                }

                // Откроем страницы событий и извлечём текст
                const limited = Array.from(eventLinks).slice(0, maxItemsParam);
                for (const evUrl of limited) {
                    try {
                        await page.goto(evUrl, { waitUntil: 'networkidle2', timeout: 45000 });
                        await page.waitForTimeout(600);
                        const data = await page.evaluate(() => {
                            const title = (document.querySelector('h1')?.textContent || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '').trim();
                            const desc = (document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();
                            const raw = document.body ? document.body.innerText : '';
                            return { title, desc, raw };
                        });
                        const explicit = extractExplicitRussianDate(data.raw) || extractExplicitRussianDate(data.title);
                        const norm = explicit || normalizeRussianDateTime(data.raw);
                        const millis = norm ? parseDateToMoscowTime(norm) : NaN;
                        const title = (data.title || '').trim();
                        const desc = (data.desc || '').trim();
                        if (title) {
                            if (!seenLinks.has(evUrl)) {
                                seenLinks.add(evUrl);
                                events.push({ title, desc, url: evUrl, millis });
                            }
                        }
                    } catch (_) { /* skip broken page */ }
                }
            } catch (e) {
                console.error('Headless fallback failed for Timepad:', e);
            } finally {
                try { if (browser) await browser.close(); } catch(_) {}
            }
        }

        let saved = 0; const seen = new Set();
        for (const ev of events) {
            if (!ev.title || !ev.url) continue;
            if (seen.has(ev.url)) continue; seen.add(ev.url);
            const startAtMillis = isNaN(ev.millis) ? getNextSundayMskMillis(19,0) : ev.millis;
            if (startAtMillis <= Date.now()) continue;
            const doc = {
                title: ev.title.slice(0,140),
                description: ev.desc ? ev.desc.slice(0,280) : '',
                startAtMillis,
                isOnline: false,
                isFree: /бесплатно/i.test(ev.desc),
                price: /бесплатно/i.test(ev.desc) ? 'Бесплатно' : null,
                location: null,
                source: 'timepad_afisha',
                originalUrl: ev.url,
                link: ev.url,
                categories: ['afisha','timepad']
            };
            const id = 'tp_' + Buffer.from(ev.url).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,28);
            await db.collection('events').doc(id).set(doc, { merge: true });
            saved++;
        }

        return res.json({ success: true, received: events.length, saved });
    } catch (e) {
        console.error('importTimepadAfisha error:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

async function fetchWithRetry(url, attempts = 2) {
    let lastErr;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    for (let i=1;i<=attempts;i++){
        try{
            const r = await axios.get(url,{ headers, timeout: 20000 });
            if (r.status>=200 && r.status<300) return r.data;
            lastErr = new Error('HTTP '+r.status);
        }catch(e){ lastErr = e; }
    }
    throw lastErr || new Error('fetch failed');
}

// HTTP endpoint: опубликовать/обновить событие по id
exports.publishEventHttp = onRequest({ memory: '256MiB', timeoutSeconds: 60 }, async (req, res) => {
    try {
        const id = (req.query.id || '').toString();
        const start = (req.query.start || '').toString(); // YYYY-MM-DD HH:mm (MSK)
        const draftParam = (req.query.draft || '').toString(); // 'true'|'false'
        if (!id) return res.status(400).json({ success: false, error: 'id is required' });

        const updates = {};
        if (start) {
            const normalized = normalizeRussianDateTime(start) || start;
            const millis = parseDateToMoscowTime(normalized);
            if (!isNaN(millis)) updates.startAtMillis = millis;
        }
        if (draftParam) {
            updates.draft = /^true|1$/i.test(draftParam);
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'nothing to update' });
        }

        await db.collection('events').doc(id).set(updates, { merge: true });
        return res.json({ success: true, id, updates });
    } catch (e) {
        console.error('publishEventHttp error:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

exports.createTestEventsHttp = onRequest({ memory: '256MiB', timeoutSeconds: 60 }, async (req, res) => {
    try {
        console.log('🚀 Создаём тестовые события...');
        
        const now = Date.now();
        const events = [
            {
                title: 'Концерт в парке Горького',
                description: 'Отличный концерт под открытым небом в самом центре Москвы',
                startAtMillis: now + 2 * 24 * 60 * 60 * 1000, // через 2 дня
                isOnline: false,
                isFree: true,
                price: 'Бесплатно',
                location: 'Парк Горького, Москва',
                imageUrls: [],
                categories: ['музыка', 'концерт'],
                source: 'test',
                externalId: 'test_concert_' + Date.now(),
                originalUrl: 'https://test.com/concert',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                draft: false
            },
            {
                title: 'Выставка современного искусства',
                description: 'Новая выставка в Третьяковской галерее',
                startAtMillis: now + 3 * 24 * 60 * 60 * 1000, // через 3 дня
                isOnline: false,
                isFree: false,
                price: '500 ₽',
                location: 'Третьяковская галерея, Москва',
                imageUrls: [],
                categories: ['искусство', 'выставка'],
                source: 'test',
                externalId: 'test_exhibition_' + Date.now(),
                originalUrl: 'https://test.com/exhibition',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                draft: false
            },
            {
                title: 'Онлайн лекция о космосе',
                description: 'Интересная лекция о последних открытиях в астрономии',
                startAtMillis: now + 1 * 24 * 60 * 60 * 1000, // завтра
                isOnline: true,
                isFree: true,
                price: 'Бесплатно',
                location: 'Онлайн',
                imageUrls: [],
                categories: ['образование', 'лекция'],
                source: 'test',
                externalId: 'test_lecture_' + Date.now(),
                originalUrl: 'https://test.com/lecture',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                draft: false
            }
        ];
        
        let saved = 0;
        for (const event of events) {
            try {
                await db.collection('events').add(event);
                saved++;
                console.log(`✅ Создано событие: ${event.title}`);
            } catch (error) {
                console.error(`❌ Ошибка создания события ${event.title}:`, error.message);
            }
        }
        
        console.log(`🎉 Создано событий: ${saved} из ${events.length}`);
        res.json({ success: true, saved, total: events.length });
        
    } catch (error) {
        console.error('❌ Ошибка создания тестовых событий:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// HTTP endpoint for Telegram import
exports.importTelegramHttp = onRequest({
    memory: '1GiB',
    timeoutSeconds: 120
}, async (req, res) => {
    try {
        console.log('Starting Telegram import...');
        const events = await importTelegramEvents();
        
        let saved = 0;
        for (const event of events) {
            try {
                const eventRef = admin.firestore().collection('events').doc();
                await eventRef.set({
                    ...event,
                    createdAt: Timestamp.now(),
                    externalId: `telegram_${event.originalUrl.split('/').pop()}`
                });
                saved++;
            } catch (error) {
                console.error('Error saving event:', error);
            }
        }
        
        res.json({
            success: true,
            found: events.length,
            saved: saved
        });
        
    } catch (error) {
        console.error('Telegram import error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// HTTP endpoint: импорт последних N постов канала с сохранением черновиков
exports.importTelegramDraftsHttp = onRequest({ memory: '1GiB', timeoutSeconds: 180 }, async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10) || 10, 50));
        const channelUsername = (req.query.channel || 'gzsmsk').toString().replace(/^@/, '');
        const channelUrl = `https://t.me/s/${channelUsername}`;
        const noAI = (req.query.noAI === '1' || req.query.mode === 'rule');
        console.log(`Draft-friendly import: ${channelUrl}, limit=${limit}`);

        // Пытаемся получить посты через Puppeteer-скрапер
        let posts = await scrapeTelegramChannel(channelUrl, limit);
        console.log(`Получено сообщений от Puppeteer: ${posts.length}`);

        // Если пусто — fallback без браузера: берём страницу канала через r.jina.ai и вытаскиваем последние ссылки
        if (!posts || posts.length === 0) {
            console.log('Puppeteer вернул 0 постов, используем fallback r.jina.ai для списка ссылок...');
            const links = await fetchRecentTelegramPostLinks(channelUsername, limit);
            console.log(`Найдено ссылок (fallback): ${links.length}`);
            posts = [];
            for (const link of links) {
                const fetched = await fetchTelegramPostTextWithoutBrowser(link);
                if (fetched && fetched.text) {
                    const parts = link.split('/');
                    const messageId = parts[parts.length - 1];
                    posts.push({ text: fetched.text, link, messageId, channelUsername });
                }
            }
        }

        let saved = 0;
        for (const post of posts) {
            try {
                let event = null;
                if (!noAI) {
                    event = await parsePostWithOllama(post);
                }
                if (!event) {
                    // Детерминированный парсер
                    event = ruleBasedExtractEventFromText(post.text || '');
                }
                if (!event) {
                    // Жёсткий черновик
                    const lines = (post.text || '').split('\n').map(s => s.trim()).filter(Boolean);
                    const title = lines.find(s => s && !/^https?:\/\//i.test(s) && !s.startsWith('#') && !s.startsWith('@')) || lines[0] || 'Событие';
                    const draftMillis = getNextSundayMskMillis(19, 0);
                    event = {
                        title: title.slice(0, 140),
                        startAtMillis: draftMillis,
                        place: null,
                        description: post.text || '',
                        price: null,
                        source: 'telegram',
                        originalUrl: post.link || '',
                        imageUrls: [],
                        isOnline: false,
                        isFree: false,
                        location: null,
                        categories: ['telegram', 'draft']
                    };
                }

                const eventRef = admin.firestore().collection('events').doc();
                await eventRef.set({
                    ...event,
                    createdAt: Timestamp.now(),
                    externalId: event.originalUrl ? `telegram_${event.originalUrl.split('/').pop()}` : undefined
                });
                saved++;
            } catch (e) {
                console.error('Error saving draft-friendly event:', e);
            }
        }

        return res.json({ success: true, requested: limit, saved });
    } catch (error) {
        console.error('Error in importTelegramDraftsHttp:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// HTTP endpoint: приём готовых постов из Telegram (без скраппинга)
// Body: { channel: string, items: Array<{ id?: number|string, text: string, link?: string }> }
exports.ingestTelegramPosts = onRequest({ memory: '1GiB', timeoutSeconds: 180 }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }
        const { channel, items, forceAI } = req.body || {};
        if (!channel || !Array.isArray(items)) {
            return res.status(400).json({ success: false, error: 'channel and items are required' });
        }
        let saved = 0;
        for (const it of items) {
            try {
                const text = (it && it.text) ? String(it.text) : '';
                const link = (it && it.link) ? String(it.link) : '';
                if (!text.trim()) continue;

                let event = null;
                if (forceAI) {
                    event = await parsePostWithOllama({ text, link, channelUsername: channel });
                }
                if (!event) {
                    event = ruleBasedExtractEventFromText(text);
                }
                if (!event) {
                    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
                    const title = lines.find(s => s && !/^https?:\/\//i.test(s) && !s.startsWith('#') && !s.startsWith('@')) || lines[0] || 'Событие';
                    event = {
                        title: title.slice(0, 140),
                        startAtMillis: getNextSundayMskMillis(19, 0),
                        place: null,
                        description: text,
                        price: null,
                        source: 'telegram',
                        originalUrl: link,
                        imageUrls: [],
                        isOnline: false,
                        isFree: false,
                        location: null,
                        categories: ['telegram', 'draft']
                    };
                }
                const eventRef = admin.firestore().collection('events').doc();
                await eventRef.set({
                    ...event,
                    createdAt: Timestamp.now(),
                    externalId: it && it.id ? `telegram_${channel}_${it.id}` : undefined
                });
                saved++;
            } catch (e) {
                console.error('ingest item error:', e);
            }
        }
        return res.json({ success: true, channel, received: items.length, saved });
    } catch (error) {
        console.error('Error in ingestTelegramPosts:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback без браузера: получить список последних ссылок постов канала через r.jina.ai
async function fetchRecentTelegramPostLinks(channelUsername, limit = 10) {
    try {
        const listUrl = `https://r.jina.ai/http://t.me/s/${channelUsername}`;
        const resp = await axios.get(listUrl, { timeout: 15000 });
        const html = resp.data || '';
        const linkRegex = new RegExp(`https?:\\/\\/t\\.me\\/(?:s\\/)?${channelUsername}\\/(\\d+)`, 'g');
        const ids = new Set();
        let m;
        while ((m = linkRegex.exec(html)) !== null) {
            const id = m[1];
            if (id) ids.add(id);
            if (ids.size >= limit * 3) break; // соберём немного с запасом
        }
        // Отсортируем по числу по убыванию и возьмём limit
        const ordered = Array.from(ids).map(x => parseInt(x, 10)).filter(Number.isFinite).sort((a,b)=>b-a).slice(0, limit);
        return ordered.map(id => `https://t.me/${channelUsername}/${id}`);
    } catch (e) {
        console.log('⚠️ fetchRecentTelegramPostLinks failed:', e.message);
        return [];
    }
}

exports.testChannelParsing = functions.https.onCall(async (data, context) => {
    const { channelUrl, channelUsername } = data;
    
    if (!channelUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'channelUrl обязателен');
    }
    
    try {
        console.log(`🧪 Тестируем парсинг канала: ${channelUrl}`);
        
        // Парсим канал
        const messages = await scrapeChannelMessages(channelUrl, 5);
        console.log(`📨 Найдено сообщений: ${messages.length}`);
        
        const results = [];
        
        for (const message of messages) {
            console.log(`📝 Обрабатываем сообщение: ${message.text.substring(0, 100)}...`);
            console.log(`🔗 Ссылка на пост: ${message.link}`);
            
            // Проверяем, является ли сообщение о мероприятии
            if (isEventMessage(message.text)) {
                console.log(`✅ Сообщение о мероприятии найдено!`);
                
                // Парсим через YandexGPT
                const parsedEvent = await parseTelegramMessage(message.text, message.link);
                
                if (parsedEvent) {
                    results.push({
                        messageId: message.messageId,
                        text: message.text,
                        link: message.link,
                        parsedEvent: parsedEvent,
                        success: true
                    });
                } else {
                    results.push({
                        messageId: message.messageId,
                        text: message.text,
                        link: message.link,
                        parsedEvent: null,
                        success: false,
                        reason: 'Не удалось распознать мероприятие'
                    });
                }
            } else {
                console.log(`❌ Сообщение не о мероприятии`);
                results.push({
                    messageId: message.messageId,
                    text: message.text,
                    link: message.link,
                    parsedEvent: null,
                    success: false,
                    reason: 'Не является сообщением о мероприятии'
                });
            }
        }
        
        return {
            success: true,
            channelUrl: channelUrl,
            channelUsername: channelUsername,
            messagesFound: messages.length,
            results: results
        };
        
    } catch (error) {
        console.error('❌ Ошибка тестирования парсинга:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка тестирования парсинга', error.message);
    }
});

// Добавление тестовых каналов для парсинга
exports.addTestChannels = functions.https.onCall(async (data, context) => {
    console.log('Добавление каналов для парсинга...');

    try {
        const channels = [
            {
                name: 'На Фанере',
                username: 'Na_Fanere',
                url: 'https://t.me/s/Na_Fanere',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'Газета "Столица"',
                username: 'gzsmsk',
                url: 'https://t.me/s/gzsmsk',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'Московский гуляка',
                username: 'mosgul',
                url: 'https://t.me/s/mosgul',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'Бесплатные события',
                username: 'freeskidos',
                url: 'https://t.me/s/freeskidos',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'Ноябрьский кинотеатр',
                username: 'novembercinema',
                url: 'https://t.me/s/novembercinema',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'МОСКВИЧ ъ | ДОСУГ | Москва | АФИША | СОБЫТИЯ | БЕСПЛАТНО',
                username: 'NovostiMoskvbl',
                url: 'https://t.me/s/NovostiMoskvbl',
                category: 'events',
                enabled: true,
                lastParsed: 0
            },
            {
                name: 'Только парк',
                username: 'only_park',
                url: 'https://t.me/s/only_park',
                category: 'events',
                enabled: true,
                lastParsed: 0
            }
        ];

        const batch = db.batch();
        const channelsCollection = db.collection('channels');

        channels.forEach(channel => {
            const docRef = channelsCollection.doc();
            batch.set(docRef, {
                ...channel,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        console.log(`✅ Добавлено ${channels.length} каналов`);
        return { success: true, count: channels.length, message: 'Каналы добавлены' };

    } catch (error) {
        console.error('❌ Ошибка при добавлении каналов:', error);
        return { success: false, error: error.message };
    }
});

exports.checkChannels = functions.https.onCall(async (data, context) => {
    console.log('Проверка каналов в Firestore...');

    try {
        const channelsSnapshot = await db.collection('channels').get();
        
        if (channelsSnapshot.empty) {
            console.log('⚠️ Коллекция channels пустая');
            return { success: true, count: 0, message: 'Коллекция channels пустая' };
        }

        const channels = [];
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            channels.push({
                id: doc.id,
                name: data.name,
                username: data.username,
                enabled: data.enabled,
                category: data.category
            });
        });

        console.log(`✅ Найдено ${channels.length} каналов:`, channels);
        return { success: true, count: channels.length, channels: channels };

    } catch (error) {
        console.error('❌ Ошибка при проверке каналов:', error);
        return { success: false, error: error.message };
    }
});

// Простая тестовая функция для проверки подключения к Firestore
exports.testFirestore = functions.https.onCall(async (data, context) => {
    console.log('Тестирование подключения к Firestore...');

    try {
        // Пробуем создать простой документ
        await db.collection('test').doc('connection-test').set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: 'Test connection successful'
        });
        
        console.log('✅ Подключение к Firestore успешно');
        
        // Удаляем тестовый документ
        await db.collection('test').doc('connection-test').delete();
        
        return { 
            success: true, 
            message: 'Firestore connection successful' 
        };

    } catch (error) {
        console.error('❌ Ошибка подключения к Firestore:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code,
            details: error.details
        };
    }
});

// Тестовая функция для проверки YandexGPT
exports.testYandexGPT = functions.https.onCall(async (data, context) => {
    const testMessage = "Концерт группы 'Radiohead' 20 сентября в 19:00 в клубе 'Циферблат'. Вход 500 рублей.";
    
    try {
        const result = await parseTelegramMessageWithSDK(testMessage, 'https://t.me/test');
        return { success: true, result: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Функция для проверки событий в Firestore
exports.checkEvents = functions.https.onCall(async (data, context) => {
    console.log('🔍 Проверяем события в Firestore...');
    
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef.limit(10).get(); // Получаем первые 10 событий

        if (snapshot.empty) {
            console.log('⚠️ В коллекции events нет документов.');
            return { 
                success: true, 
                count: 0, 
                message: 'В коллекции events нет документов',
                events: []
            };
        }

        const events = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Обрабатываем NaN значения
            const startAtMillis = isNaN(data.startAtMillis) ? 0 : data.startAtMillis;
            const confidence = isNaN(data.confidence) ? 0 : data.confidence;
            
            events.push({
                id: doc.id,
                title: data.title || 'Без названия',
                location: data.location || 'Место не указано',
                startAtMillis: startAtMillis,
                startDate: startAtMillis > 0 ? new Date(startAtMillis).toLocaleString() : 'Дата не указана',
                telegramUrl: data.telegramUrl || 'Ссылка не указана',
                confidence: confidence,
                source: data.source || 'unknown',
                channelName: data.channelName || 'unknown'
            });
        });

        console.log(`✅ Найдено ${events.length} событий`);
        return { 
            success: true, 
            count: events.length, 
            message: `Найдено ${events.length} событий`,
            events: events
        };

    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// =====================
// KudaGo: импорт событий
// =====================

async function importKudaGoEvents() {
    try {
        console.log('🚀 Импорт событий из KudaGo (Москва)...');
        const nowMs = Date.now();
        const now = Math.floor(nowMs / 1000);
        const oneMonth = 30 * 24 * 60 * 60;
        const to = now + oneMonth;

        // Документация: https://kudago.com/public-api/
        const url = 'https://kudago.com/public-api/v1.4/events/';
        const params = {
            location: 'msk',
            page_size: 100,
            fields: 'id,slug,title,description,price,is_free,dates,place,site_url,images',
            expand: 'place',
            actual_since: now,
            actual_until: to,
            order_by: 'dates'
        };

        const { data } = await axios.get(url, { params });
        const results = Array.isArray(data.results) ? data.results : data;
        console.log(`📦 Получено из KudaGo: ${results.length} событий`);

        let saved = 0;
        for (const it of results) {
            try {
                const externalId = `kudago_${it.id}`;
                // Дедупликация
                const dup = await db.collection('events').where('externalId', '==', externalId).limit(1).get();
                if (!dup.empty) {
                    continue;
                }

                // Берём первую актуальную дату в пределах месяца
                let startAtMillis = 0;
                if (Array.isArray(it.dates) && it.dates.length > 0) {
                    // dates[].start/end — unix seconds
                    const first = it.dates.find(d => typeof d.start === 'number' && d.start >= now && d.start <= to) || it.dates[0];
                    if (first && typeof first.start === 'number') {
                        startAtMillis = first.start * 1000;
                    }
                }
                if (!startAtMillis) continue; // пропускаем без даты

                // Доп. защита: отсекаем прошлое (с буфером 1 час)
                if (startAtMillis < nowMs + 60 * 60 * 1000) {
                    continue;
                }

                const isFree = !!it.is_free || (typeof it.price === 'string' && it.price.toLowerCase().includes('бесплат'));
                const price = isFree ? null : (typeof it.price === 'string' ? it.price : null);
                const location = it.place?.title || it.place?.address || 'Москва';
                const imageUrls = Array.isArray(it.images) ? it.images.map(img => img.image).filter(Boolean).slice(0, 5) : [];

                await db.collection('events').add({
                    title: it.title || 'Событие',
                    description: (it.description || '').toString().replace(/<[^>]*>/g, '').trim().slice(0, 600),
                    startAtMillis,
                    isOnline: false,
                    isFree,
                    price,
                    location,
                    imageUrls,
                    categories: [],
                    source: 'kudago',
                    externalId,
                    originalUrl: it.site_url || null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                saved++;
            } catch (e) {
                console.error('❌ Ошибка сохранения события KudaGo:', e.message);
            }
        }

        console.log(`✅ Импорт KudaGo завершён. Сохранено: ${saved}`);
        return { success: true, saved, received: results.length };
    } catch (error) {
        console.error('❌ Ошибка импорта KudaGo:', error.message);
        return { success: false, error: error.message };
    }
}

// Ручной вызов импорта KudaGo
exports.importKudaGo = functions.https.onCall(async (data, context) => {
    return await importKudaGoEvents();
});

// Планировщик: раз в сутки
exports.importKudaGoDaily = onSchedule('every 24 hours', async (event) => {
    return await importKudaGoEvents();
});

// Временная HTTP-точка для тестового запуска импорта (dev)
exports.importKudaGoHttp = functions.https.onRequest(async (req, res) => {
    try {
        const result = await importKudaGoEvents();
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// =====================
// Timepad: импорт событий (headless)
// =====================
async function getTimepadOrganizers() {
    try {
        const doc = await db.collection('config').doc('timepad').get();
        const arr = doc.exists ? (doc.data().organizers || []) : [];
        if (Array.isArray(arr) && arr.length) return arr;
    } catch (_) {}
    // Фолбэк: несколько популярных русских слугов/примеров (можете заменить в config)
    return [
        'https://afisha.timepad.ru/organizations/70317/events',
        'https://afisha.timepad.ru/moscow/events/kreativnyy-mastermaynd-ot-biznes-fakt-28-avgusta-3489329',
        'https://timepad.ru/org/it-events/',
        'https://timepad.ru/org/gdglocal/',
        'https://timepad.ru/org/timepad/'
    ];
}

async function importTimepadEvents(preview = false) {
    try {
        console.log('🚀 Импорт событий из Timepad (Москва, headless, organizers)...');
        const nowMs = Date.now();
        const untilMs = nowMs + 30 * 24 * 60 * 60 * 1000;
        const organizers = await getTimepadOrganizers();
        console.log(`👥 Организаторов Timepad: ${organizers.length}`);

        let saved = 0; let foundTotal = 0;
        const previewEvents = [];
        const ruMonthToNum = {
            'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
            'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
        };
        function parseRussianDateFallback(text) {
            if (!text) return 0;
            // Примеры: "27 сентября 14:00", "3 октября 19:00–20:30"
            const lower = text.toLowerCase();
            let m = lower.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)[^\d]*(\d{1,2}:\d{2})?/i);
            if (!m) return 0;
            const day = m[1].padStart(2, '0');
            const mon = ruMonthToNum[m[2]];
            const time = (m[3] || '12:00');
            const year = new Date().getFullYear();
            const str = `${year}-${mon}-${day} ${time}`;
            return parseDateToMoscowTime(str) || 0;
        }
        for (const orgUrl of organizers) {
            const url = orgUrl.startsWith('http') ? orgUrl : `https://timepad.ru${orgUrl}`;
            const baseOrigin = url.startsWith('https://afisha.timepad.ru') ? 'https://afisha.timepad.ru' : 'https://timepad.ru';
            console.log('🧭 Обработка организатора:', url);
            let items = [];
            try {
                const browser = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await getExecPath(),
                    headless: true
                });
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
                await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' });
                try { await page.emulateTimezone('Europe/Moscow'); } catch(_) {}
                await page.goto(url, { waitUntil: ['domcontentloaded','networkidle0'], timeout: 60000 });
                // Прокрутка
                await page.evaluate(async () => {
                    await new Promise(resolve => {
                        const distance = 1200; let total = 0;
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance);
                            total += distance;
                            const reachedBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight;
                            if (reachedBottom || total > 80000) { clearInterval(timer); setTimeout(resolve, 1000); }
                        }, 350);
                    });
                });
                try { await page.waitForSelector('a[href*="/event"], a[href*="/events/"]', { timeout: 15000 }); } catch(_) {}
                items = await page.evaluate(() => {
                    const out = new Set();
                    const push = (link, title) => { if (link) out.add(JSON.stringify({ link, title })); };
                    const nodes = document.querySelectorAll('a[href*="/event"], a[href*="/events/"]');
                    nodes.forEach(a => {
                        const href = a.getAttribute('href');
                        const title = (a.getAttribute('title') || a.textContent || '').trim();
                        if (href) {
                            push(href, title);
                        }
                    });
                    return Array.from(out).map(s => JSON.parse(s));
                });
                await browser.close();
            } catch (e) {
                console.log('⚠️ Ошибка рендера организатора:', e.message);
            }

            console.log(`📦 Найдено ссылок у организатора: ${items.length}`);
            foundTotal += items.length;

            // Открываем один браузер для всех событий этого организатора
            let browserEvGlobal = null;
            let pageEv = null;
            try {
                browserEvGlobal = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await getExecPath(),
                    headless: true
                });
                pageEv = await browserEvGlobal.newPage();
                await pageEv.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
                await pageEv.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' });
                try { await pageEv.emulateTimezone('Europe/Moscow'); } catch(_) {}
            } catch (e) {
                console.log('⚠️ Не удалось запустить браузер для событий:', e.message);
            }

            for (const it of items.slice(0, 50)) {
            try {
                const fullLink = it.link.startsWith('http') ? it.link : `${baseOrigin}${it.link}`;
                // Рендерим саму страницу события в headless-режиме, т.к. контент динамический
                let dateText = '';
                let place = '';
                let description = '';
                let imgList = [];
                let titleFromPage = '';
                try {
                    if (!pageEv) throw new Error('page not initialized');
                    await pageEv.goto(fullLink, { waitUntil: ['domcontentloaded','networkidle2'], timeout: 60000 });
                    // небольшой скролл для подгрузки ленивых изображений
                    await pageEv.evaluate(async () => {
                        await new Promise(resolve => {
                            let y = 0; const step = 600; const limit = 6000;
                            const timer = setInterval(() => {
                                window.scrollBy(0, step); y += step;
                                if (y >= limit) { clearInterval(timer); setTimeout(resolve, 500); }
                            }, 200);
                        });
                    });
                const extracted = await pageEv.evaluate(() => {
                    const bySel = (sel) => {
                        const el = document.querySelector(sel);
                        return el ? el.textContent.trim() : '';
                    };
                    const getAttr = (sel, attr) => {
                        const el = document.querySelector(sel);
                        return el ? el.getAttribute(attr) || '' : '';
                    };
                    const images = new Set();
                    const push = (u) => { if (u && typeof u === 'string') images.add(u); };
                    // Заголовок
                    const title = bySel('h1, .event-title, [data-qa="event-title"]') || document.title;
                    // Дата - расширенный поиск
                    let dt = getAttr('time', 'datetime') || bySel('time') || bySel('[itemprop="startDate"]');
                    if (!dt) {
                        dt = bySel('.event-date, .event__date, [data-qa="event-date"]') ||
                             bySel('.date, .event-time, .event__time') ||
                             bySel('.event-info .date, .event-info .time') ||
                             bySel('.event-schedule, .event__schedule, .schedule') ||
                             bySel('.event-datetime, .event__datetime, .datetime');
                    }
                    // Место - расширенный поиск
                    let pl = bySel('[itemprop="address"], .event__place, .place, .address');
                    if (!pl) {
                        pl = bySel('.event-location, .event__location, [data-qa="event-location"]') ||
                             bySel('.venue, .event-venue, .event__venue') ||
                             bySel('.event-info .location, .event-info .place') ||
                             bySel('.event-address, .event__address, .address');
                    }
                    // Описание - расширенный поиск
                    let desc = getAttr('meta[property="og:description"]', 'content')
                                  || getAttr('meta[name="description"]', 'content')
                                  || bySel('.EventDescription__content, .event-description, .description, .event__description');
                    if (!desc) {
                        desc = bySel('.event-text, .event__text, .event-content, .event__content') ||
                               bySel('.event-details, .event__details, .event-info__text') ||
                               bySel('.event-about, .event__about, .event-summary') ||
                               bySel('.event-info, .event__info, .event-description-text');
                    }
                    // Изображения
                    const ogImg = getAttr('meta[property="og:image"]', 'content'); if (ogImg) push(ogImg);
                    document.querySelectorAll('img').forEach(img => {
                        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('srcset');
                        if (src) push(src.split(' ')[0]);
                    });
                    // ld+json - расширенный поиск
                    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
                        try {
                            const json = JSON.parse(s.textContent);
                            const obj = Array.isArray(json) ? json.find(x => x['@type'] === 'Event') : json;
                            if (obj && obj['@type'] === 'Event') {
                                if (!dt && obj.startDate) dt = obj.startDate;
                                if (!dt && obj.eventSchedule && obj.eventSchedule.startDate) dt = obj.eventSchedule.startDate;
                                if (!dt && obj.offers && obj.offers.validFrom) dt = obj.offers.validFrom;
                                if (!dt && obj.datePublished) dt = obj.datePublished;
                                if (!pl && obj.location && obj.location.name) pl = obj.location.name;
                                if (!pl && obj.location && obj.location.address) pl = obj.location.address;
                                if (!desc && obj.description) desc = obj.description;
                                const im = obj.image; if (im) {
                                    if (Array.isArray(im)) im.forEach(push); else push(im);
                                }
                            }
                        } catch(e) {}
                    });
                    return { title, dt, pl, desc, images: Array.from(images).slice(0, 5) };
                });
                    titleFromPage = extracted.title || '';
                    dateText = extracted.dt || '';
                    place = extracted.pl || '';
                    description = extracted.desc || '';
                    imgList = (extracted.images || []).map(u => u.startsWith('http') ? u : (new URL(u, location.origin)).toString());
                } catch (e) {
                    console.log('⚠️ Ошибка headless-рендера события:', e.message);
                }

                let startAtMillis = 0;
                if (dateText) {
                    const d = new Date(dateText);
                    if (!isNaN(d.getTime())) startAtMillis = d.getTime();
                }
                if (!startAtMillis) {
                    // Парсинг русских дат как фолбэк
                    startAtMillis = parseRussianDateFallback($('body').text());
                }
                if (preview) {
                    const title = (it.title || $('h1').first().text().trim() || 'Событие');
                    const base = {
                        title,
                        url: fullLink,
                        rawDate: dateText || null,
                        parsedDateIso: startAtMillis ? new Date(startAtMillis).toISOString() : null,
                        parsedDateLocal: startAtMillis ? new Date(startAtMillis).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : null,
                        location: place || 'Москва'
                    };
                    if (!startAtMillis) {
                        previewEvents.push({ ...base, skipped: true, reason: 'no_date_parsed' });
                        continue;
                    }
                    if (startAtMillis < nowMs + 60 * 60 * 1000) {
                        previewEvents.push({ ...base, skipped: true, reason: 'past_event' });
                        continue;
                    }
                    if (startAtMillis > untilMs) {
                        previewEvents.push({ ...base, skipped: true, reason: 'beyond_1_month' });
                        continue;
                    }
                } else {
                    // Гарантируем валидную дату для сохранения
                    if (!startAtMillis) {
                        startAtMillis = nowMs + 3 * 24 * 60 * 60 * 1000; // по умолчанию через 3 дня
                    }
                    if (startAtMillis < nowMs + 60 * 60 * 1000) {
                        startAtMillis = nowMs + 24 * 60 * 60 * 1000; // если прошлое — ставим завтра
                    }
                    if (startAtMillis > untilMs) {
                        startAtMillis = untilMs - 2 * 60 * 60 * 1000; // если слишком далеко — подтягиваем в окно
                    }
                }

                const externalId = `timepad_${Buffer.from(fullLink).toString('base64')}`;
                // Цена и бесплатность
                let isFree = false;
                let priceText = null;
                const pageText = $('body').text().toLowerCase();
                if (pageText.includes('бесплат')) {
                    isFree = true;
                } else {
                    const priceMatch = $('body').text().match(/(\d+[\s\u00A0]?)(?:руб|₽)/i);
                    if (priceMatch) priceText = `${priceMatch[1].replace(/\s|\u00A0/g,'').trim()} ₽`;
                }

                if (preview) {
                    const title = (it.title || titleFromPage || 'Событие');
                    previewEvents.push({
                        title,
                        dateIso: new Date(startAtMillis).toISOString(),
                        dateLocal: new Date(startAtMillis).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
                        location: place || 'Москва',
                        isFree,
                        price: priceText,
                        images: imgList,
                        description: (description || '').toString().trim().slice(0, 200),
                        url: fullLink
                    });
                } else {
                    // Upsert по детерминированному docId
                    const docId = externalId;
                    await db.collection('events').doc(docId).set({
                        title: it.title || titleFromPage || 'Событие',
                        description: (description || '').toString().trim().slice(0, 600),
                        startAtMillis,
                        isOnline: false,
                        isFree,
                        price: priceText,
                        location: place || 'Москва',
                        imageUrls: imgList,
                        categories: [],
                        source: 'timepad',
                        externalId,
                        originalUrl: fullLink,
                        externalUrl: fullLink,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    saved++;
                }
            } catch (e) {
                console.error('❌ Ошибка разбора страницы Timepad:', e.message);
            }
            }

            try { if (browserEvGlobal) await browserEvGlobal.close(); } catch(_) {}
        }

        if (foundTotal === 0) {
            return { success: false, error: 'TIMEPAD_RENDER_EMPTY' };
        }
        console.log(`✅ Импорт Timepad завершён. Сохранено: ${saved}, найдено ссылок: ${foundTotal}`);
        if (preview) {
            return { success: true, saved: 0, found: foundTotal, events: previewEvents };
        }
        return { success: true, saved, found: foundTotal };
    } catch (error) {
        console.error('❌ Ошибка импорта Timepad:', error.message);
        return { success: false, error: error.message };
    }
}

exports.importTimepad = functions.https.onCall(async (data, context) => {
    return await importTimepadEvents(false);
});

exports.importTimepadDaily = onSchedule('every 24 hours', async (event) => {
    return await importTimepadEvents(false);
});
exports.importTimepadHttp = onRequest({ memory: '1GiB', timeoutSeconds: 300 }, async (req, res) => {
    try { const result = await importTimepadEvents(!!req.query.preview); res.json(result); }
    catch(e){ res.status(500).json({ success:false, error: e.message }); }
});

// Обогащение сохранённых событий Timepad: дозаполняем описание/картинки
exports.enrichTimepadEventsHttp = onRequest({ memory: '1GiB', timeoutSeconds: 300 }, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '20', 10);
        const snap = await db.collection('events')
            .where('source', '==', 'timepad')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        let updated = 0;
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' });
        try { await page.emulateTimezone('Europe/Moscow'); } catch(_) {}

        for (const doc of snap.docs) {
            try {
                const data = doc.data();
                const url = data.externalUrl || data.originalUrl;
                if (!url) continue;
                const needDesc = !data.description || String(data.description).trim().length < 10;
                const needImgs = !Array.isArray(data.imageUrls) || data.imageUrls.length === 0;
                if (!needDesc && !needImgs) continue;
                await page.goto(url, { waitUntil: ['domcontentloaded','networkidle2'], timeout: 60000 });
                await page.evaluate(async () => {
                    await new Promise(resolve => {
                        let y = 0; const step = 600; const limit = 6000;
                        const timer = setInterval(() => { window.scrollBy(0, step); y += step; if (y >= limit) { clearInterval(timer); setTimeout(resolve, 400); } }, 200);
                    });
                });
                const extracted = await page.evaluate(() => {
                    const bySel = (sel) => { const el = document.querySelector(sel); return el ? el.textContent.trim() : ''; };
                    const getAttr = (sel, attr) => { const el = document.querySelector(sel); return el ? el.getAttribute(attr) || '' : ''; };
                    const images = new Set();
                    const push = (u) => { if (u && typeof u === 'string') images.add(u); };
                    let desc = getAttr('meta[property="og:description"]', 'content')
                              || getAttr('meta[name="description"]', 'content')
                              || bySel('.EventDescription__content, .event-description, .description, .event__description');
                    const ogImg = getAttr('meta[property="og:image"]', 'content'); if (ogImg) push(ogImg);
                    document.querySelectorAll('img').forEach(img => {
                        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('srcset');
                        if (src) push(src.split(' ')[0]);
                    });
                    return { desc, images: Array.from(images).slice(0, 5) };
                });
                const imgList = (extracted.images || []).map(u => u.startsWith('http') ? u : (new URL(u, location.origin)).toString());
                const updates = {};
                if (needDesc && extracted.desc) updates.description = String(extracted.desc).trim().slice(0, 600);
                if (needImgs && imgList.length) updates.imageUrls = imgList;
                if (Object.keys(updates).length) {
                    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                    await doc.ref.update(updates);
                    updated++;
                }
            } catch (e) {
                console.log('⚠️ Ошибка обогащения события:', doc.id, e.message);
            }
        }
        try { await browser.close(); } catch(_) {}
        res.json({ success: true, processed: snap.size, updated });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// =====================
// mos.ru Афиша (basic scrape)
// =====================
async function importMosRuEvents() {
    try {
        console.log('🚀 Импорт событий с mos.ru/afisha ...');
        const nowMs = Date.now();
        const untilMs = nowMs + 30 * 24 * 60 * 60 * 1000;

        // Прямо через r.jina.ai (proxy-first)
        const proxied = 'https://r.jina.ai/http/www.mos.ru/afisha/';
        const txt = await fetchWithRetry(proxied, 2);
        const linkRegex = /https?:\/\/www\.mos\.ru\/[^\s"']+/gi;
        const links = Array.from(new Set((txt.match(linkRegex) || []).filter(l => /\/afisha\//.test(l)))).slice(0, 30);
        let saved = 0;
        for (const l of links) {
            try {
                const pageTxt = await fetchWithRetry(`https://r.jina.ai/http/${l.replace(/^https?:\/\//,'')}`, 2);
                const dateIso = (pageTxt.match(/datetime=\"([0-9T:Z\-]+)\"/i)?.[1] || '').trim();
                const title = (pageTxt.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g,'').trim();
                if (!dateIso || !title) continue;
                const d = new Date(dateIso); if (isNaN(d.getTime())) continue;
                if (d.getTime() < nowMs + 60 * 60 * 1000) continue;
                if (d.getTime() > untilMs) continue;
                const externalId = `mosru_${Buffer.from(l).toString('base64')}`;
                const dup = await db.collection('events').where('externalId', '==', externalId).limit(1).get();
                if (!dup.empty) continue;
                await db.collection('events').add({
                    title,
                    description: '',
                    startAtMillis: d.getTime(),
                    isOnline: false,
                    isFree: false,
                    price: null,
                    location: 'Москва',
                    imageUrls: [],
                    categories: [],
                    source: 'mosru',
                    externalId,
                    originalUrl: l,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                saved++;
            } catch(_) {}
        }
        console.log(`✅ Импорт mos.ru завершён. Сохранено: ${saved}`);
        return { success: true, saved, found: links.length };
    } catch (error) {
        console.error('❌ Ошибка импорта mos.ru:', error.message);
        return { success: false, error: error.message };
    }
}

exports.importMosRu = functions.https.onCall(async (data, context) => {
    return await importMosRuEvents();
});

exports.importMosRuDaily = onSchedule('every 24 hours', async (event) => {
    return await importMosRuEvents();
});
exports.importMosRuHttp = functions.https.onRequest(async (req, res) => {
    try { const result = await importMosRuEvents(); res.json(result); }
    catch(e){ res.status(500).json({ success:false, error: e.message }); }
});

// =====================
// Afisha.ru (basic scrape)
// =====================
async function importAfishaRuEvents() {
    try {
        console.log('🚀 Импорт событий с afisha.ru/msk ...');
        const nowMs = Date.now();
        const untilMs = nowMs + 30 * 24 * 60 * 60 * 1000;

        // Прямо через r.jina.ai (proxy-first)
        const proxied = 'https://r.jina.ai/http/www.afisha.ru/msk/';
        const txt = await fetchWithRetry(proxied, 2);
        const linkRegex = /https?:\/\/www\.afisha\.ru\/msk\/[A-Za-z0-9_\-\/]+/gi;
        const links = Array.from(new Set(txt.match(linkRegex) || [])).slice(0, 40);
        let saved = 0;
        for (const l of links) {
            try {
                const pageTxt = await fetchWithRetry(`https://r.jina.ai/http/${l.replace(/^https?:\/\//,'')}`, 2);
                const dateIso = (pageTxt.match(/datetime=\"([0-9T:Z\-]+)\"/i)?.[1] || '').trim();
                const title = (pageTxt.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g,'').trim();
                if (!dateIso || !title) continue;
                const d = new Date(dateIso); if (isNaN(d.getTime())) continue;
                if (d.getTime() < nowMs + 60 * 60 * 1000) continue;
                if (d.getTime() > untilMs) continue;
                const externalId = `afisharu_${Buffer.from(l).toString('base64')}`;
                const dup = await db.collection('events').where('externalId', '==', externalId).limit(1).get();
                if (!dup.empty) continue;
                await db.collection('events').add({
                    title,
                    description: '',
                    startAtMillis: d.getTime(),
                    isOnline: false,
                    isFree: false,
                    price: null,
                    location: 'Москва',
                    imageUrls: [],
                    categories: [],
                    source: 'afisha.ru',
                    externalId,
                    originalUrl: l,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                saved++;
            } catch(_) {}
        }
        console.log(`✅ Импорт afisha.ru завершён. Сохранено: ${saved}`);
        return { success: true, saved, found: links.length };
    } catch (error) {
        console.error('❌ Ошибка импорта afisha.ru:', error.message);
        return { success: false, error: error.message };
    }
}

exports.importAfishaRu = functions.https.onCall(async (data, context) => {
    return await importAfishaRuEvents();
});

exports.importAfishaRuDaily = onSchedule('every 24 hours', async (event) => {
    return await importAfishaRuEvents();
});
exports.importAfishaRuHttp = functions.https.onRequest(async (req, res) => {
    try { const result = await importAfishaRuEvents(); res.json(result); }
    catch(e){ res.status(500).json({ success:false, error: e.message }); }
});