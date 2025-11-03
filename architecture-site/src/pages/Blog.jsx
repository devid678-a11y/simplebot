import { useState, useEffect, useRef } from 'react'
import './Blog.css'

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [filteredPosts, setFilteredPosts] = useState([])
  const postsRef = useRef(null)

  const categories = ['ALL', 'ПРОЕКТЫ', 'ИДЕИ', 'НОВОСТИ', 'ИНТЕРВЬЮ']

  const posts = [
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

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredPosts(posts)
    } else {
      setFilteredPosts(posts.filter(post => post.category === selectedCategory))
    }
  }, [selectedCategory])

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

          <div className="blog-posts" ref={postsRef}>
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="blog-post"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="post-image-wrapper">
                  <div
                    className="post-image"
                    style={{ backgroundImage: `url(${post.image})` }}
                  ></div>
                  <div className="post-category-badge">{post.category}</div>
                </div>
                <div className="post-content">
                  <div className="post-meta">
                    <span className="post-date">{post.date}</span>
                    <span className="post-read-time">{post.readTime}</span>
                  </div>
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <button className="post-read-more">
                    ЧИТАТЬ →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blog

