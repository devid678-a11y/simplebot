import React, { useState } from 'react';
import './Header.css';

const Header: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMouseEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Логотип */}
        <div className="logo">
          <a href="https://demexrus.ru" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://static.tildacdn.com/tild3633-3030-4562-b037-353030613566/_-_1.png" 
              alt="DEMEX" 
              className="logo-image"
            />
          </a>
        </div>

        {/* Мобильная кнопка меню */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Открыть меню"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Навигационное меню */}
        <nav className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <a href="https://demexrus.ru/" className="nav-link">Главная</a>
            </li>
            <li className="nav-item">
              <a href="https://demexrus.ru/about_company" className="nav-link">О компании</a>
            </li>
            <li className="nav-item">
              <a href="https://demexrus.ru/catalog" className="nav-link">Каталог</a>
            </li>
            <li className="nav-item">
              <a href="https://demexrus.ru/articles" className="nav-link">Статьи</a>
            </li>
            <li className="nav-item">
              <a href="https://demexrus.ru/partners" className="nav-link">Партнерам</a>
            </li>
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => handleMouseEnter('where-to-buy')}
              onMouseLeave={handleMouseLeave}
            >
              <a href="https://demexrus.ru/where-to-buy" className="nav-link">
                Где купить
                <span className="dropdown-arrow">▼</span>
              </a>
              <ul className={`dropdown-menu ${activeDropdown === 'where-to-buy' ? 'active' : ''}`}>
                <li><a href="https://demexrus.ru/delivery-info">Доставка и оплата</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a href="https://demexrus.ru/contacts" className="nav-link">Контакты</a>
            </li>
          </ul>
        </nav>

        {/* Контактная информация */}
        <div className="contact-info">
          <div className="phone-section">
            <div className="phone-number">8 800 533 8618</div>
            <div className="social-links">
              <a href="https://api.whatsapp.com/send/?phone=79056756507&text&type=phone_number&app_absent=0" className="social-link whatsapp" title="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
              <a href="https://vk.com/demexrus" className="social-link vk" title="VKontakte" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.785 16.241s.287-.323.439-.49c1.492-1.59 2.104-1.71 2.347-1.801.39-.145.626-.12.626.14 0 .405-.022 1.275-.022 1.97 0 .52.074.69.24.69.68 0 1.19-2.19 1.69-3.01.47-.78.94-.65.94-.65l2.68.01s.39-.025.65-.22c.1-.08.15-.19.15-.19s.02-.09.02-.25c0-.26-.08-.49-.08-.49s-.05-.1-.15-.15c-.12-.05-.25-.03-.25-.03l-3.97.01s-.29.01-.45.15c-.1.09-.08.27-.08.27s.01.47.01.72c0 .11-.01.22-.01.22s-.01.05-.02.08c-.02.05-.06.08-.06.08s-.1.05-.2-.02c-.28-.19-.62-.55-.62-.55s-.1-.12-.27-.12l-.54.01s-.4.01-.6.31c-.15.23-.15.69-.15.69s.08 1.29.19 1.93c.1.47.29.63.29.63s.12.18.12.28c0 .15-.05.25-.05.25s-.08.15-.23.23c-.18.09-.36.12-.36.12s-.54.08-1.03-.15c-.29-.14-.51-.4-.51-.4s-.86-1.15-1.19-1.93c-.15-.35-.27-.49-.27-.49s-.05-.1-.05-.19c0-.19.1-.28.1-.28s.54-.63 1.19-1.15c.58-.46.8-.38.8-.38l.01.01z"/>
                </svg>
              </a>
              <a href="https://t.me/demex_rus" className="social-link telegram" title="Telegram" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="address-section">
            <div className="address">г. Москва, ул. Золоторожский</div>
            <div className="address">Вал, 11с22, офис 373</div>
            <div className="hours">9:00 - 19:00</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
