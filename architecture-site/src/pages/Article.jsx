import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPostBySlug, getPosts } from '../services/wordpress'
import { blogPostsData } from '../data/blogPosts'
import './Article.css'

const Article = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        
        // Проверяем, есть ли URL WordPress API
        const wpApiUrl = import.meta.env.VITE_WORDPRESS_API_URL
        const useWordPress = wpApiUrl && !wpApiUrl.includes('your-wordpress-site')
        
        let postData = null
        
        if (useWordPress) {
          // Пытаемся загрузить из WordPress
          try {
            postData = await getPostBySlug(slug)
          } catch (error) {
            console.log('WordPress API недоступен, используем fallback')
          }
        }
        
        // Если не получилось из WordPress, ищем в fallback данных
        if (!postData) {
          postData = blogPostsData.find(p => p.slug === slug || `post-${p.id}` === slug)
        }
        
        if (!postData) {
          navigate('/blog')
          return
        }
        
        // Форматируем данные для единого формата
        const formattedPost = {
          id: postData.id,
          slug: postData.slug || slug,
          title: { rendered: postData.title },
          content: { rendered: postData.content || '' },
          excerpt: { rendered: postData.excerpt || '' },
          date: postData.date || new Date().toISOString(),
          category: postData.category,
          image: postData.image,
          isFallback: !useWordPress || !postData._embedded
        }
        
        setPost(formattedPost)
        
        // Загружаем похожие посты
        if (useWordPress && !formattedPost.isFallback) {
          try {
            const posts = await getPosts({ per_page: 3, exclude: postData.id })
            setRelatedPosts(posts)
          } catch (error) {
            // Используем fallback посты
            const related = blogPostsData.filter(p => p.id !== postData.id).slice(0, 3)
            setRelatedPosts(related)
          }
        } else {
          // Используем fallback посты
          const related = blogPostsData.filter(p => p.id !== postData.id).slice(0, 3)
          setRelatedPosts(related)
        }
      } catch (error) {
        console.error('Error loading post:', error)
        navigate('/blog')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      loadPost()
    }
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="article-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p>Загрузка статьи...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  const featuredImage = post.isFallback 
    ? post.image 
    : (post._embedded?.['wp:featuredmedia']?.[0]?.source_url)
  
  const postDate = post.isFallback
    ? post.date
    : new Date(post.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).toUpperCase()

  const postCategory = post.isFallback
    ? post.category
    : (post._embedded?.['wp:term']?.[0]?.[0]?.name?.toUpperCase() || 'НОВОСТИ')
  
  const author = post.isFallback
    ? 'АРХИТЕКТУРНОЕ БЮРО'
    : (post._embedded?.author?.[0]?.name || 'АРХИТЕКТУРНОЕ БЮРО')

  return (
    <div className="article-page">
      <article className="article">
        {/* Header */}
        <div className="article-header">
          {featuredImage && (
            <div 
              className="article-featured-image"
              style={{ backgroundImage: `url(${featuredImage})` }}
            ></div>
          )}
          <div className="article-header-content">
            <div className="container">
              <Link to="/blog" className="article-back-link">
                ← НАЗАД К БЛОГУ
              </Link>
              <div className="article-meta-header">
                <span className="article-category-badge">{postCategory}</span>
                <span className="article-date">{postDate}</span>
              </div>
              <h1 
                className="article-title"
                dangerouslySetInnerHTML={{ __html: post.title.rendered }}
              ></h1>
              <div className="article-author">
                <span>АВТОР:</span> {author}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="article-content">
          <div className="container">
            <div className="article-body">
              <div 
                className="article-text"
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
              ></div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="related-posts">
                <h2 className="related-posts-title">ПОХОЖИЕ СТАТЬИ</h2>
                <div className="related-posts-grid">
                  {relatedPosts.map((relatedPost) => {
                    const isRelatedFallback = relatedPost.slug !== undefined && !relatedPost._embedded
                    const relatedImage = isRelatedFallback
                      ? relatedPost.image
                      : (relatedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url)
                    
                    const relatedDate = isRelatedFallback
                      ? relatedPost.date
                      : new Date(relatedPost.date).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }).toUpperCase()
                    
                    const relatedSlug = relatedPost.slug || `post-${relatedPost.id}`
                    const relatedTitle = isRelatedFallback
                      ? relatedPost.title
                      : relatedPost.title.rendered
                    
                    return (
                      <Link 
                        key={relatedPost.id}
                        to={`/blog/${relatedSlug}`}
                        className="related-post-card"
                      >
                        {relatedImage && (
                          <div 
                            className="related-post-image"
                            style={{ backgroundImage: `url(${relatedImage})` }}
                          ></div>
                        )}
                        <div className="related-post-content">
                          <span className="related-post-date">{relatedDate}</span>
                          <h3 
                            className="related-post-title"
                            dangerouslySetInnerHTML={{ __html: relatedTitle }}
                          ></h3>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

export default Article

