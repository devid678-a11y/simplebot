// WordPress REST API Service
// Замените URL на ваш WordPress сайт после настройки

const WORDPRESS_API_URL = process.env.VITE_WORDPRESS_API_URL || 'https://your-wordpress-site.timeweb.cloud/wp-json/wp/v2'

/**
 * Получить все посты
 */
export const getPosts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      _embed: 'true',
      per_page: '10',
      ...params
    }).toString()

    const response = await fetch(`${WORDPRESS_API_URL}/posts?${queryParams}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

/**
 * Получить один пост по ID
 */
export const getPost = async (id) => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/posts/${id}?_embed=true`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

/**
 * Получить пост по slug
 */
export const getPostBySlug = async (slug) => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/posts?slug=${slug}&_embed=true`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const posts = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

/**
 * Получить все страницы
 */
export const getPages = async () => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/pages?_embed=true`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching pages:', error)
    return []
  }
}

/**
 * Получить категории
 */
export const getCategories = async () => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/categories`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Получить медиа по ID
 */
export const getMedia = async (id) => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/media/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching media:', error)
    return null
  }
}

/**
 * Поиск постов
 */
export const searchPosts = async (query) => {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/posts?search=${encodeURIComponent(query)}&_embed=true`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error searching posts:', error)
    return []
  }
}

