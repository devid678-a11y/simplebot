import { useState, useEffect, useRef } from 'react'
import { getPosts, getCategories } from '../services/wordpress'
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
        const [wpPosts, wpCategories] = await Promise.all([
          getPosts(),
          getCategories()
        ])
        
        setPosts(wpPosts)
        
        // Формируем список категорий
        const cats = ['ALL', ...wpCategories.map(cat => cat.name.toUpperCase())]
        setCategories(cats)
      } catch (error) {
        console.error('Error loading posts:', error)
        // Fallback на статические данные при ошибке
        setPosts([
    {
      id: 1,
      title: 'БУДУЩЕЕ ГОРОДСКОЙ АРХИТЕКТУРЫ',
      category: 'ИДЕИ',
      date: '15 ЯНВАРЯ 2024',
      excerpt: 'Размышления о том, как брутализм может решить проблемы современного города. Функциональность и эстетика в балансе.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
      readTime: '5 МИН'
    },
    {
      id: 2,
      title: 'ПРОЕКТ ЖИЛОГО КОМПЛЕКСА "ПАРК"',
      category: 'ПРОЕКТЫ',
      date: '10 ЯНВАРЯ 2024',
      excerpt: 'Детальный разбор проекта жилого комплекса в центре Москвы. От концепции до реализации. Материалы, технологии, решения.',
      image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop',
      readTime: '8 МИН'
    },
    {
      id: 3,
      title: 'ИНТЕРВЬЮ С ГЛАВНЫМ АРХИТЕКТОРОМ',
      category: 'ИНТЕРВЬЮ',
      date: '5 ЯНВАРЯ 2024',
      excerpt: 'Разговор о философии проектирования, влиянии материалов на восприятие пространства и будущем архитектуры.',
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
      readTime: '12 МИН'
    },
    {
      id: 4,
      title: 'НОВЫЕ ТЕХНОЛОГИИ В СТРОИТЕЛЬСТВЕ',
      category: 'НОВОСТИ',
      date: '28 ДЕКАБРЯ 2023',
      excerpt: 'Обзор инновационных материалов и технологий, которые меняют подход к строительству. Экологичность и долговечность.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      readTime: '6 МИН'
    },
    {
      id: 5,
      title: 'МИНИМАЛИЗМ КАК ОСНОВА ДИЗАЙНА',
      category: 'ИДЕИ',
      date: '20 ДЕКАБРЯ 2023',
      excerpt: 'Почему меньше значит больше. Как принципы минимализма помогают создавать более функциональные пространства.',
      image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop',
      readTime: '7 МИН'
    },
    {
      id: 6,
      title: 'КУЛЬТУРНЫЙ ЦЕНТР В ЕКАТЕРИНБУРГЕ',
      category: 'ПРОЕКТЫ',
      date: '15 ДЕКАБРЯ 2023',
      excerpt: 'Проект культурного центра, объединяющего библиотеку, выставочные залы и общественные пространства. Архитектура как социальный инструмент.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      readTime: '10 МИН'
    }
  ]

  // Фильтрация постов по категории
  useEffect(() => {
    if (!posts.length) return
    
    if (selectedCategory === 'ALL') {
      setFilteredPosts(posts)
    } else {
      // Фильтруем по категориям WordPress
      setFilteredPosts(
        posts.filter(post => 
          post.categories?.some(catId => {
            const category = categories.find(c => c !== 'ALL' && 
              post._embedded?.['wp:term']?.[0]?.find(t => t.id === catId)?.name?.toUpperCase() === c
            )
            return category
          })
        )
      )
    }
  }, [selectedCategory, posts, categories])

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
                  // Получаем изображение из WordPress
                  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                                       'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop'
                  
                  // Форматируем дату
                  const postDate = new Date(post.date).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }).toUpperCase()
                  
                  // Получаем категорию
                  const postCategory = post._embedded?.['wp:term']?.[0]?.[0]?.name?.toUpperCase() || 'НОВОСТИ'
                  
                  return (
                    <article
                      key={post.id}
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
                        <h2 className="post-title" dangerouslySetInnerHTML={{ __html: post.title.rendered }}></h2>
                        <div 
                          className="post-excerpt" 
                          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered || post.content.rendered.substring(0, 150) + '...' }}
                        ></div>
                        <button className="post-read-more">
                          ЧИТАТЬ →
                        </button>
                      </div>
                    </article>
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

