import { useState, useEffect } from 'react'
import { getPlaceholderImage, getProductImage, getRandomUnsplashImage, createGradientImage } from '../utils/imageUtils'

interface SmartImageProps {
  src?: string
  alt: string
  keyword?: string
  productType?: string
  category?: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  fallback?: string
  loading?: 'lazy' | 'eager'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

/**
 * Умный компонент изображения с автоматическим подбором
 * Автоматически подбирает изображение из Unsplash если src не указан
 */
export default function SmartImage({
  src,
  alt,
  keyword,
  productType,
  category,
  width = 800,
  height = 600,
  className = '',
  style = {},
  fallback,
  loading = 'lazy',
  objectFit = 'cover'
}: SmartImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (src) {
      setImgSrc(src)
    } else if (productType) {
      setImgSrc(getProductImage(productType, width, height))
    } else if (keyword) {
      setImgSrc(getRandomUnsplashImage(keyword, width, height))
    } else if (category) {
      setImgSrc(getRandomUnsplashImage(category, width, height))
    } else {
      setImgSrc(fallback || getPlaceholderImage(width, height, alt))
    }
  }, [src, productType, keyword, category, width, height, fallback, alt])

  const handleError = () => {
    if (!error) {
      setError(true)
      // Пробуем fallback, затем placeholder, затем градиент
      if (fallback) {
        setImgSrc(fallback)
      } else {
        try {
          setImgSrc(getPlaceholderImage(width, height, alt))
        } catch {
          // Если и placeholder не работает, используем градиент
          setImgSrc(createGradientImage(width, height))
        }
      }
    }
  }

  if (!imgSrc) {
    return (
      <div 
        style={{
          width,
          height,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '0.875rem',
          ...style
        }}
      >
        Загрузка...
      </div>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        objectFit,
        backgroundColor: '#f5f5f5',
        ...style
      }}
      loading={loading}
      onError={handleError}
    />
  )
}

