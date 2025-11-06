import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">👨‍🍳</span>
              <span className="logo-text">Кулинарная Школа</span>
            </div>
            <p className="footer-description">
              Онлайн курсы по кулинарии от профессиональных шеф-поваров. 
              Учитесь готовить дома в удобное время.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Instagram">📷</a>
              <a href="#" className="social-link" aria-label="YouTube">▶️</a>
              <a href="#" className="social-link" aria-label="Telegram">✈️</a>
              <a href="#" className="social-link" aria-label="VK">🔵</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Курсы</h3>
            <ul className="footer-links">
              <li><Link to="/">Итальянская кухня</Link></li>
              <li><Link to="/">Азиатская кухня</Link></li>
              <li><Link to="/">Выпечка и десерты</Link></li>
              <li><Link to="/">Здоровое питание</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Информация</h3>
            <ul className="footer-links">
              <li><Link to="/">О нас</Link></li>
              <li><Link to="/">Отзывы</Link></li>
              <li><Link to="/">FAQ</Link></li>
              <li><Link to="/">Контакты</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Контакты</h3>
            <ul className="footer-contacts">
              <li>📧 info@cooking-school.ru</li>
              <li>📱 +7 (999) 123-45-67</li>
              <li>📍 Москва, ул. Кулинарная, 1</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} Кулинарная Школа. Все права защищены.</p>
          <div className="footer-legal">
            <Link to="/">Политика конфиденциальности</Link>
            <Link to="/">Условия использования</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer



