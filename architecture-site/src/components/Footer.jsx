import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">ARCH BUREAU</h3>
            <p className="footer-description">
              Архитектурное бюро, создающее пространства будущего.
              Брутализм. Функциональность. Вневременность.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">НАВИГАЦИЯ</h4>
            <nav className="footer-nav">
              <Link to="/" className="footer-link">ГЛАВНАЯ</Link>
              <Link to="/blog" className="footer-link">БЛОГ</Link>
              <Link to="/contact" className="footer-link">КОНТАКТЫ</Link>
            </nav>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">КОНТАКТЫ</h4>
            <div className="footer-contact">
              <a href="mailto:info@archbureau.ru" className="footer-link">
                INFO@ARCHBUREAU.RU
              </a>
              <a href="tel:+74951234567" className="footer-link">
                +7 (495) 123-45-67
              </a>
              <p className="footer-address">
                МОСКВА, УЛ. АРХИТЕКТОРОВ, 15
              </p>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">СОЦИАЛЬНЫЕ СЕТИ</h4>
            <div className="footer-social">
              <a href="#" className="footer-social-link">INSTAGRAM</a>
              <a href="#" className="footer-social-link">FACEBOOK</a>
              <a href="#" className="footer-social-link">LINKEDIN</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} ARCH BUREAU. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
          </p>
          <p className="footer-design">
            ДИЗАЙН В СТИЛЕ БРУТАЛИЗМ
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

