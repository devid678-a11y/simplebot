# 🌟 Портфолио IT-специалиста

Современный, стильный и полностью адаптивный сайт-портфолио в стиле Awwwards с темной темой.

![Portfolio Preview](https://img.shields.io/badge/Status-Ready-success)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ Особенности

### Дизайн
- 🎨 Современный темный дизайн в стиле Awwwards
- 🌈 Градиентные акценты и анимированные фоны
- 📱 Полностью адаптивный дизайн (Desktop, Tablet, Mobile)
- 🎭 Кастомный курсор с плавными эффектами
- ✨ Плавные анимации и переходы

### Интерактивность
- ⌨️ Эффект печатающегося текста в hero-секции
- 📊 Анимированные счетчики статистики
- 🎯 Параллакс-эффекты для элементов фона
- 🔄 Scroll reveal анимации
- 🧲 Магнитные кнопки с 3D эффектом
- 🎴 3D tilt эффект для карточек проектов
- 🎪 Smooth scroll навигация

### Секции
1. **Hero** - Впечатляющая главная секция с анимациями
2. **About** - О специалисте
3. **Skills** - Технический стек с красивыми карточками
4. **Projects** - Портфолио проектов
5. **Contact** - Форма обратной связи и контакты

## 🚀 Быстрый старт

### Требования
- Любой современный веб-браузер
- Нет необходимости в серверной части

### Установка

1. Клонируйте или скачайте репозиторий
2. Откройте `index.html` в браузере

```bash
# Клонирование репозитория
git clone [URL репозитория]

# Переход в директорию
cd portfolio

# Открытие в браузере
# Windows
start index.html

# MacOS
open index.html

# Linux
xdg-open index.html
```

### Локальный сервер (опционально)

Для лучшей работы можно запустить локальный сервер:

```bash
# Python 3
python -m http.server 8000

# Node.js (если установлен live-server)
npx live-server

# VS Code - расширение Live Server
# Правый клик на index.html -> Open with Live Server
```

Затем откройте `http://localhost:8000` в браузере.

## 🎨 Кастомизация

### Изменение цветовой схемы

Откройте `style.css` и измените CSS переменные в `:root`:

```css
:root {
    --bg-primary: #0a0a0a;        /* Основной фон */
    --bg-secondary: #121212;      /* Вторичный фон */
    --text-primary: #ffffff;      /* Основной текст */
    --text-secondary: #a0a0a0;    /* Вторичный текст */
    --accent-primary: #667eea;    /* Акцентный цвет */
    --accent-secondary: #764ba2;  /* Вторичный акцент */
}
```

### Изменение контента

1. **Личная информация** - Откройте `index.html` и найдите секцию `hero`:
   - Измените имя в `.hero-title`
   - Обновите описание в `.hero-description`

2. **Навыки** - В секции `skills` обновите содержимое `.skill-card`

3. **Проекты** - В секции `projects` добавьте/измените карточки `.project-card`

4. **Контакты** - В секции `contact` обновите контактную информацию

### Изменение шрифтов

В `index.html` измените Google Fonts импорт:

```html
<link href="https://fonts.googleapis.com/css2?family=YOUR-FONT&display=swap" rel="stylesheet">
```

Затем обновите в `style.css`:

```css
body {
    font-family: 'YOUR-FONT', sans-serif;
}
```

### Добавление изображений

1. Создайте папку `images/` в корне проекта
2. Добавьте ваши изображения
3. Обновите `.project-image` в CSS или добавьте `<img>` теги в HTML

```css
.project-image {
    background-image: url('images/project1.jpg');
    background-size: cover;
    background-position: center;
}
```

## 📁 Структура файлов

```
portfolio/
│
├── index.html          # Главный HTML файл
├── style.css           # Все стили
├── script.js           # JavaScript функциональность
└── README.md           # Документация
```

## 🛠️ Технологии

- **HTML5** - Семантическая разметка
- **CSS3** - Современные стили, Grid, Flexbox, Animations
- **JavaScript (Vanilla)** - Интерактивность без фреймворков
- **Google Fonts** - Inter & Space Grotesk

## 🎯 Функции

### JavaScript Features

- **Custom Cursor** - Кастомный курсор с плавным следованием
- **Typing Animation** - Эффект печатающегося текста
- **Counter Animation** - Анимированные счетчики при скролле
- **Smooth Scroll** - Плавная прокрутка по якорям
- **Intersection Observer** - Оптимизированные scroll анимации
- **Parallax Effects** - Параллакс для фоновых элементов
- **Form Handling** - Обработка отправки формы
- **Mobile Menu** - Адаптивное мобильное меню

### CSS Features

- **CSS Variables** - Легкая кастомизация цветов
- **CSS Grid & Flexbox** - Современная раскладка
- **Gradient Animations** - Анимированные градиенты
- **Custom Animations** - Кастомные @keyframes анимации
- **Responsive Design** - Медиа-запросы для всех устройств
- **Backdrop Filter** - Эффект размытия для навигации

## 📱 Адаптивность

Сайт полностью адаптирован для всех устройств:

- **Desktop** (1920px+) - Полная версия с эффектами
- **Laptop** (1024px-1919px) - Оптимизированная версия
- **Tablet** (768px-1023px) - Адаптированная раскладка
- **Mobile** (320px-767px) - Мобильная версия с бургер-меню

## 🔧 Настройка формы обратной связи

По умолчанию форма только логирует данные в консоль. Для реальной отправки:

### Вариант 1: Formspree
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### Вариант 2: EmailJS
```javascript
emailjs.send("service_id", "template_id", formData)
    .then(() => console.log('Success'));
```

### Вариант 3: Собственный бэкенд
Настройте свой API endpoint и измените обработчик формы в `script.js`.

## 🚀 Деплой

### GitHub Pages
1. Создайте репозиторий на GitHub
2. Загрузите файлы
3. Settings → Pages → Source: main branch
4. Ваш сайт будет доступен по адресу: `https://username.github.io/repository-name/`

### Netlify
1. Перетащите папку проекта на netlify.com/drop
2. Или подключите GitHub репозиторий
3. Автоматический деплой при каждом коммите

### Vercel
```bash
npm i -g vercel
vercel
```

## 🎨 Примеры использования

### Добавление нового проекта

```html
<div class="project-card" data-aos="fade-up">
    <div class="project-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="project-overlay">
            <a href="#" class="project-link">Посмотреть проект →</a>
        </div>
    </div>
    <div class="project-info">
        <div class="project-tags">
            <span class="tag">React</span>
            <span class="tag">Node.js</span>
        </div>
        <h3 class="project-title">Название проекта</h3>
        <p class="project-description">Описание проекта</p>
        <div class="project-footer">
            <a href="#" class="project-demo">Demo</a>
            <a href="#" class="project-github">GitHub</a>
        </div>
    </div>
</div>
```

### Добавление новой skill карточки

```html
<div class="skill-card" data-aos="fade-up">
    <div class="skill-icon">
        <!-- SVG иконка -->
    </div>
    <h3>Категория</h3>
    <ul class="skill-list">
        <li>Навык 1</li>
        <li>Навык 2</li>
        <li>Навык 3</li>
    </ul>
</div>
```

## 📊 Производительность

- ✅ Легковесный (без зависимостей)
- ✅ Быстрая загрузка
- ✅ Оптимизированные анимации (60 FPS)
- ✅ Ленивая загрузка изображений (добавьте по необходимости)
- ✅ CSS/JS минификация для продакшена (рекомендуется)

## 🐛 Известные проблемы

- Кастомный курсор не отображается на мобильных устройствах (это нормально)
- В некоторых браузерах backdrop-filter может не поддерживаться (добавлен fallback)

## 🤝 Вклад в проект

Не стесняйтесь форкать проект и вносить свои улучшения!

## 📄 Лицензия

MIT License - свободно используйте для личных и коммерческих проектов.

## 📞 Контакты

- Email: dev@example.com
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourname)
- Telegram: @yourusername

## 🌟 Благодарности

- Дизайн вдохновлен лучшими работами с [Awwwards](https://www.awwwards.com/)
- Иконки от SVG
- Шрифты от Google Fonts

---

**Создано с ❤️ и большим количеством кофе ☕**

**Если вам понравился проект - поставьте ⭐ на GitHub!**
