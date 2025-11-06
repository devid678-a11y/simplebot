import { useState, useEffect } from 'react'
import './Hero.css'

const Hero = () => {
  const [email, setEmail] = useState('')
  const [subscribers, setSubscribers] = useState(12453)

  useEffect(() => {
    // Анимация счетчика
    const interval = setInterval(() => {
      setSubscribers(prev => prev + Math.floor(Math.random() * 3))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      alert(`Спасибо! Мы отправили приглашение на ${email}`)
      setEmail('')
    }
  }

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-image"></div>
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⭐</span>
            <span>Более 50,000 довольных учеников</span>
          </div>
          
          <h1 className="hero-title">
            Научитесь готовить
            <br />
            <span className="gradient-text">как шеф-повар</span>
            <br />
            за 30 дней
          </h1>
          
          <p className="hero-description">
            Онлайн курсы от профессиональных шеф-поваров с мировым именем. 
            Готовьте ресторанные блюда дома, в удобное время.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Рецептов</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Часов видео</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.9</div>
              <div className="stat-label">Рейтинг</div>
            </div>
          </div>
          
          <form className="hero-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Введите ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
              <button type="submit" className="btn btn-primary btn-large">
                Начать бесплатно
              </button>
            </div>
            <p className="form-note">
              🎁 Получите первый урок бесплатно + 10 рецептов в подарок
            </p>
          </form>
          
          <div className="hero-trust">
            <div className="trust-item">
              <span className="trust-icon">👥</span>
              <span className="trust-text">
                <strong>{subscribers.toLocaleString()}</strong> учеников уже готовят
              </span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <span className="trust-text">Гарантия возврата 30 дней</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hero-scroll">
        <span>Прокрутите вниз</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </section>
  )
}

export default Hero



