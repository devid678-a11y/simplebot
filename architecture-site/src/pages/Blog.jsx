import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories } from '../services/wordpress'
import { blogPostsData } from '../data/blogPosts'
import './Blog.css'

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [filteredPosts, setFilteredPosts] = useState([])
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState(['ALL'])
  const [loading, setLoading] = useState(true)
  const postsRef = useRef(null)

  // Загружаем посты из WordPress
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        
        // Проверяем, есть ли URL WordPress API
        const wpApiUrl = import.meta.env.VITE_WORDPRESS_API_URL
        if (!wpApiUrl || wpApiUrl.includes('your-wordpress-site')) {
          // WordPress не настроен, используем fallback
          console.log('WordPress API не настроен, используем fallback данные')
          setPosts(fallbackPosts)
          setCategories(['ALL', 'ПРОЕКТЫ', 'ИДЕИ', 'НОВОСТИ', 'ИНТЕРВЬЮ'])
          setLoading(false)
          return
        }
        
        const [wpPosts, wpCategories] = await Promise.all([
          getPosts(),
          getCategories()
        ])
        
        if (Array.isArray(wpPosts)) {
          setPosts(wpPosts)
        } else {
          throw new Error('Invalid posts data')
        }
        
        // Формируем список категорий
        if (Array.isArray(wpCategories) && wpCategories.length > 0) {
          const cats = ['ALL', ...wpCategories.map(cat => cat.name?.toUpperCase() || 'БЕЗ КАТЕГОРИИ')]
          setCategories(cats)
        } else {
          setCategories(['ALL'])
        }
      } catch (error) {
        console.error('Error loading posts:', error)
        // Fallback на статические данные при ошибке
        setPosts(fallbackPosts)
        setCategories(['ALL', 'ПРОЕКТЫ', 'ИДЕИ', 'НОВОСТИ', 'ИНТЕРВЬЮ'])
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [])
  
  // Статические посты для fallback (если WordPress недоступен)
  const fallbackPosts = blogPostsData

  // Используем WordPress посты или fallback
  const displayPosts = posts.length > 0 ? posts : fallbackPosts

  // Фильтрация постов по категории
  useEffect(() => {
    if (!displayPosts || displayPosts.length === 0) {
      setFilteredPosts([])
      return
    }
    
    // Проверяем, это WordPress посты или fallback
    const isWordPressPost = displayPosts[0]?.title?.rendered !== undefined
    
    if (selectedCategory === 'ALL') {
      setFilteredPosts(displayPosts)
    } else if (isWordPressPost) {
      // Фильтруем по категориям WordPress
      setFilteredPosts(
        displayPosts.filter(post => 
          post._embedded?.['wp:term']?.[0]?.some(term => 
            term.name?.toUpperCase() === selectedCategory
          )
        )
      )
    } else {
      // Фильтруем fallback посты
      setFilteredPosts(
        displayPosts.filter(post => post.category === selectedCategory)
      )
    }
  }, [selectedCategory, displayPosts, categories])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    if (postsRef.current) {
      const items = postsRef.current.querySelectorAll('.blog-post')
      items.forEach((item) => observer.observe(item))
    }

    return () => observer.disconnect()
  }, [filteredPosts])

  return (
    <div className="blog-page">
      <div className="blog-hero">
        <div className="container">
          <h1 className="blog-hero-title">БЛОГ</h1>
          <p className="blog-hero-subtitle">Мысли, проекты, идеи</p>
        </div>
      </div>

      <div className="blog-content section">
        <div className="container">
          <div className="blog-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p>Загрузка...</p>
            </div>
          ) : (
            <div className="blog-posts" ref={postsRef}>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => {
                  // Проверяем, это WordPress пост или fallback
                  const isWordPressPost = post.title?.rendered !== undefined
                  
                  // Получаем изображение
                  const featuredImage = isWordPressPost
                    ? (post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                       'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop')
                    : post.image
                  
                  // Форматируем дату
                  const postDate = isWordPressPost
                    ? new Date(post.date).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).toUpperCase()
                    : post.date
                  
                  // Получаем категорию
                  const postCategory = isWordPressPost
                    ? (post._embedded?.['wp:term']?.[0]?.[0]?.name?.toUpperCase() || 'НОВОСТИ')
                    : post.category
                  
                  // Получаем slug для ссылки
                  const postSlug = isWordPressPost 
                    ? (post.slug || `post-${post.id}`)
                    : (post.slug || `post-${post.id}`)
                  
                  return (
                    <Link
                      key={post.id}
                      to={`/blog/${postSlug}`}
                      className="blog-post"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="post-image-wrapper">
                        <div
                          className="post-image"
                          style={{ backgroundImage: `url(${featuredImage})` }}
                        ></div>
                        <div className="post-category-badge">{postCategory}</div>
                      </div>
                      <div className="post-content">
                        <div className="post-meta">
                          <span className="post-date">{postDate}</span>
                        </div>
                        <h2 className="post-title">
                          {isWordPressPost ? (
                            <span dangerouslySetInnerHTML={{ __html: post.title?.rendered || '' }}></span>
                          ) : (
                            post.title
                          )}
                        </h2>
                        <div className="post-excerpt">
                          {isWordPressPost ? (
                            <span dangerouslySetInnerHTML={{ 
                              __html: post.excerpt?.rendered || post.content?.rendered?.substring(0, 150) + '...' || ''
                            }}></span>
                          ) : (
                            post.excerpt
                          )}
                        </div>
                        <span className="post-read-more">
                          ЧИТАТЬ →
                        </span>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p>Постов не найдено</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Blog

