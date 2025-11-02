# Инструменты для UX/UI дизайна

Этот проект включает инструменты для автоматического подбора изображений и иконок.

## Установленные библиотеки

- **react-icons** - огромная коллекция иконок (Font Awesome, Material Design и др.)
- **lucide-react** - современные минималистичные иконки

## Компоненты

### SmartImage - Умный компонент изображения

Автоматически подбирает изображения из Unsplash по ключевым словам.

```tsx
import SmartImage from '../components/SmartImage'

// Использование с ключевым словом
<SmartImage 
  keyword="corporate business" 
  alt="Бизнес" 
  width={800} 
  height={600} 
/>

// Использование с типом продукта (автоматический подбор)
<SmartImage 
  productType="ручки" 
  alt="Ручки" 
  width={400} 
  height={400} 
/>

// Использование с категорией
<SmartImage 
  category="business" 
  alt="Бизнес" 
  width={800} 
  height={600} 
/>
```

### Icon - Умный компонент иконки

Автоматически подбирает подходящую иконку из библиотек.

```tsx
import Icon from '../components/Icon'

// Использование
<Icon name="lightning" size={48} color="#667eea" />
<Icon name="palette" size={32} />
<Icon name="dollar" size={24} color="white" />
```

#### Доступные иконки:

**Действия:**
- `lightning`, `zap` - молния/энергия
- `palette`, `paint` - палитра/дизайн
- `dollar`, `money` - деньги
- `box`, `package` - коробка/упаковка
- `check`, `success` - галочка/успех
- `star` - звезда
- `question`, `help` - вопрос/помощь

**Контакты:**
- `email`, `mail` - почта
- `phone`, `call` - телефон
- `location`, `map` - местоположение
- `clock`, `time` - время

**Бизнес:**
- `handshake` - рукопожатие
- `rocket` - ракета/рост
- `award` - награда
- `users`, `team` - команда
- `shopping`, `cart` - покупки
- `gift`, `present` - подарок

**Продукты:**
- `pen`, `writing` - ручка
- `usb`, `flash` - флешка
- `shirt`, `tshirt` - футболка
- `leaf`, `eco` - экология
- `folder`, `notebook` - блокнот

**Навигация:**
- `home` - домой
- `search`, `find` - поиск
- `user`, `profile` - профиль
- `plus`, `add` - добавить
- `edit`, `change` - редактировать
- `trash`, `delete` - удалить
- `save`, `store` - сохранить
- `close`, `cancel` - закрыть
- `next`, `right` - вправо
- `prev`, `left` - влево
- `up`, `collapse` - вверх
- `down`, `expand` - вниз

**Медиа:**
- `share` - поделиться
- `link`, `url` - ссылка
- `download` - скачать
- `upload` - загрузить
- `image`, `picture` - изображение
- `video`, `movie` - видео
- `music`, `audio` - музыка
- `file`, `document` - файл
- `code`, `programming` - код

## Утилиты

### imageUtils.ts

Функции для работы с изображениями:

```tsx
import { 
  getUnsplashImage, 
  getProductImage, 
  getRandomUnsplashImage,
  getPlaceholderImage 
} from '../utils/imageUtils'

// Получить изображение по ключевому слову
const img = getUnsplashImage('business office', 800, 600)

// Получить изображение продукта
const productImg = getProductImage('ручки', 400, 400)

// Получить случайное изображение категории
const categoryImg = getRandomUnsplashImage('business', 800, 600)

// Получить плейсхолдер
const placeholder = getPlaceholderImage(800, 600, 'Текст')
```

## Примеры использования в SouvenirsLanding

Смотрите `web/src/views/SouvenirsLanding.tsx` для примеров интеграции.

## Примечания

- Unsplash Source API работает без ключа для простых запросов
- Изображения кешируются браузером
- При ошибке загрузки автоматически используется fallback
- Иконки поддерживают все стандартные props React

