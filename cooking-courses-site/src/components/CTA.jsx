import { useState } from 'react'
import './CTA.css'

const CTA = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      alert(`Спасибо! Мы отправили приглашение на ${email}`)
      setEmail('')
    }
  }

  return (
    <section className="cta-section section">
      <div className="container">
        <div className="cta-content">
          <div className="cta-badge">🎁 Специальное предложение</div>
          <h2 className="cta-title">
            Начните готовить
            <br />
            <span className="gradient-text">уже сегодня</span>
          </h2>
          <p className="cta-description">
            Получите первый урок бесплатно и 10 рецептов в подарок. 
            Начните свой путь к мастерству в кулинарии прямо сейчас.
          </p>
          
          <form className="cta-form" onSubmit={handleSubmit}>
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
                Получить бесплатно
              </button>
            </div>
            <p className="form-note">
              ✅ Никакого спама. Отписаться можно в любой момент.
            </p>
          </form>
          
          <div className="cta-trust">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>Безопасная регистрация</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span>Мгновенный доступ</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🎁</span>
              <span>Бесплатные материалы</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA



