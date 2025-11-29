import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">👨‍🍳</span>
            <span className="logo-text">StarCook School</span>
          </Link>
          
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link">Курсы</Link>
            <Link to="/" className="nav-link">О нас</Link>
            <Link to="/" className="nav-link">Отзывы</Link>
            <Link to="/" className="nav-link">Контакты</Link>
            <Link to="/" className="btn btn-primary">Начать обучение</Link>
          </nav>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Меню"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header



