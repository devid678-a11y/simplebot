import './Pricing.css'

const Pricing = () => {
  const plans = [
    {
      name: 'Базовый',
      price: 1990,
      period: 'месяц',
      description: 'Для начинающих поваров',
      features: [
        'Доступ к 1 курсу на выбор',
        'Видео-уроки HD качества',
        'Доступ на 30 дней',
        'Поддержка сообщества',
        'Мобильное приложение'
      ],
      popular: false
    },
    {
      name: 'Премиум',
      price: 4990,
      period: 'месяц',
      description: 'Для серьезных учеников',
      features: [
        'Доступ ко всем курсам',
        'Видео-уроки HD качества',
        'Доступ навсегда',
        'Поддержка сообщества',
        'Мобильное приложение',
        'Бонусные материалы',
        'Поддержка преподавателей'
      ],
      popular: true
    },
    {
      name: 'VIP',
      price: 9990,
      period: 'месяц',
      description: 'Максимальные возможности',
      features: [
        'Все из Премиум',
        'Интерактивные уроки с шеф-поваром',
        'Персональные консультации',
        'Ранний доступ к новым курсам',
        'Эксклюзивные рецепты',
        'Сертификат о прохождении',
        'Приоритетная поддержка'
      ],
      popular: false
    }
  ]

  return (
    <section className="pricing-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Выберите тариф</h2>
          <p className="section-subtitle">
            Гибкие тарифы для любого уровня подготовки
          </p>
        </div>
        
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="popular-badge">Популярный</div>
              )}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="price-value">{plan.price.toLocaleString()}</span>
                  <span className="price-currency">₽</span>
                  <span className="price-period">/{plan.period}</span>
                </div>
              </div>
              
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="btn btn-primary btn-full">
                Выбрать тариф
              </button>
            </div>
          ))}
        </div>
        
        <div className="pricing-guarantee">
          <div className="guarantee-icon">🛡️</div>
          <div className="guarantee-content">
            <h3 className="guarantee-title">30 дней гарантия возврата</h3>
            <p className="guarantee-description">
              Если вам не понравится курс, мы вернем деньги в течение 30 дней. 
              Без вопросов, без условий.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing



