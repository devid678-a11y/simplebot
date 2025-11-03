import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPostBySlug, getPosts } from '../services/wordpress'
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
        const postData = await getPostBySlug(slug)
        
        if (!postData) {
          navigate('/blog')
          return
        }
        
        setPost(postData)
        
        // Загружаем похожие посты
        const posts = await getPosts({ per_page: 3, exclude: postData.id })
        setRelatedPosts(posts)
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

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const postDate = new Date(post.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase()

  const postCategory = post._embedded?.['wp:term']?.[0]?.[0]?.name?.toUpperCase() || 'НОВОСТИ'
  const author = post._embedded?.author?.[0]?.name || 'АРХИТЕКТУРНОЕ БЮРО'

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
                    const relatedImage = relatedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url
                    const relatedDate = new Date(relatedPost.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }).toUpperCase()
                    
                    return (
                      <Link 
                        key={relatedPost.id}
                        to={`/blog/${relatedPost.slug}`}
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
                            dangerouslySetInnerHTML={{ __html: relatedPost.title.rendered }}
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

