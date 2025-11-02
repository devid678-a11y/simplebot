/**
 * Утилиты для работы с изображениями
 * Используем надежные источники изображений
 */

/**
 * Создать SVG градиентное изображение как data URI
 */
function createGradientSVG(width: number, height: number, colors: string[] = ['#008080', '#B8860B']): string {
  const gradientId = `grad-${Math.random().toString(36).substr(2, 9)}`
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[1] || colors[0]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${gradientId})" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.3">ELEVATE</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Получить изображение из DummyImage (надежный сервис)
 */
export function getDummyImage(width: number = 800, height: number = 600, text: string = '', bgColor: string = '008080', textColor: string = 'ffffff'): string {
  const textEncoded = text ? encodeURIComponent(text) : ''
  return `https://dummyimage.com/${width}x${height}/${bgColor}/${textColor}.png${textEncoded ? '&text=' + textEncoded : ''}`
}

/**
 * Получить изображение товара/продукта
 */
export function getProductImage(productType: string, width: number = 400, height: number = 400): string {
  const productConfigs: Record<string, { bg: string, text: string, seed?: number }> = {
    'ручки': { bg: '667eea', text: 'Pens' },
    'ручки и письменные принадлежности': { bg: '667eea', text: 'Pens' },
    'usb': { bg: '2563eb', text: 'USB' },
    'usb-накопители и аксессуары': { bg: '2563eb', text: 'USB' },
    'текстиль': { bg: 'db2777', text: 'Textile' },
    'текстиль и одежда': { bg: 'db2777', text: 'Textile' },
    'эко': { bg: '16a34a', text: 'Eco' },
    'эко-friendly': { bg: '16a34a', text: 'Eco' },
    'эко-сувениры': { bg: '16a34a', text: 'Eco' },
    'канцелярия': { bg: '9333ea', text: 'Office' },
    'office essentials': { bg: '9333ea', text: 'Office' },
    'подарочные наборы': { bg: 'B8860B', text: 'Gifts' },
    'premium collection': { bg: 'B8860B', text: 'Premium' },
    'textile': { bg: 'db2777', text: 'Textile' },
    'food & drink': { bg: 'ea580c', text: 'Food' },
    'блокноты': { bg: '9333ea', text: 'Notebooks' },
    'футболки': { bg: 'db2777', text: 'T-Shirts' },
    'чашки': { bg: 'ea580c', text: 'Cups' },
    'сумки': { bg: '16a34a', text: 'Bags' },
    'corporate-pens-business-writing': { bg: '667eea', text: 'Pens' },
    'premium-notebooks-leather-luxury': { bg: 'B8860B', text: 'Premium' },
    'eco-bags-sustainable-tote': { bg: '16a34a', text: 'Eco Bags' },
    'usb-flash-drives-technology': { bg: '2563eb', text: 'USB' },
    't-shirts-logo-corporate': { bg: 'db2777', text: 'T-Shirts' },
    'gift-sets-premium-box': { bg: 'B8860B', text: 'Gifts' },
    'eco-natural-sustainable': { bg: '16a34a', text: 'Eco' },
    'technology-gadgets-electronics': { bg: '2563eb', text: 'Tech' },
    'office-stationery-notebooks': { bg: '9333ea', text: 'Office' },
    'premium-luxury-gifts': { bg: 'B8860B', text: 'Premium' },
    'textile-clothing-apparel': { bg: 'db2777', text: 'Textile' },
    'food-drink-thermos': { bg: 'ea580c', text: 'Food' },
    'premium corporate gifts wooden background minimalist': { bg: 'B8860B', text: 'Premium Gifts' },
    'corporate team business professionals': { bg: '008080', text: 'Team' }
  }
  
  const config = productConfigs[productType.toLowerCase()] || { bg: '008080', text: 'Product' }
  return getDummyImage(width, height, config.text, config.bg, 'ffffff')
}

/**
 * Получить изображение по ключевому слову
 */
export function getRandomUnsplashImage(keyword: string, width: number = 800, height: number = 600): string {
  // Используем хеш ключевого слова для стабильного цвета
  const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = ['008080', '667eea', '2563eb', '16a34a', 'B8860B', 'db2777', '9333ea', 'ea580c']
  const bgColor = colors[hash % colors.length]
  const text = keyword.split(' ')[0].substring(0, 10)
  return getDummyImage(width, height, text, bgColor, 'ffffff')
}

/**
 * Плейсхолдер изображения
 */
export function getPlaceholderImage(width: number = 800, height: number = 600, text?: string): string {
  const placeholderText = text ? text.substring(0, 15) : `${width}x${height}`
  return getDummyImage(width, height, placeholderText, '008080', 'ffffff')
}

/**
 * Генерация градиентного фона как альтернатива изображению
 */
export function generateGradient(colors: string[] = ['#008080', '#B8860B']): string {
  return `linear-gradient(135deg, ${colors.join(', ')})`
}

/**
 * Создать градиентное изображение (SVG)
 */
export function createGradientImage(width: number, height: number, colors: string[] = ['#008080', '#B8860B']): string {
  return createGradientSVG(width, height, colors)
}
