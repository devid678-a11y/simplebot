import './Benefits.css'

const Benefits = () => {
  const benefits = [
    {
      icon: '🎥',
      title: 'Видео-уроки HD качества',
      description: 'Все уроки записаны в профессиональном качестве с разных ракурсов'
    },
    {
      icon: '♾️',
      title: 'Доступ навсегда',
      description: 'Купили один раз — смотрите сколько угодно, пересматривайте в любое время'
    },
    {
      icon: '👥',
      title: 'Поддержка сообщества',
      description: 'Общайтесь с другими учениками, делитесь рецептами и задавайте вопросы'
    },
    {
      icon: '📱',
      title: 'Мобильное приложение',
      description: 'Учитесь на телефоне или планшете, даже на кухне во время готовки'
    },
    {
      icon: '🎁',
      title: 'Бонусные материалы',
      description: 'Чек-листы, таблицы замены продуктов, секретные рецепты в подарок'
    },
    {
      icon: '📞',
      title: 'Поддержка преподавателей',
      description: 'Задавайте вопросы шеф-поварам и получайте персональные советы'
    }
  ]

  return (
    <section className="benefits-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Преимущества обучения</h2>
          <p className="section-subtitle">
            Почему тысячи людей выбирают наши курсы
          </p>
        </div>
        
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="benefit-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="benefit-icon">{benefit.icon}</div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits



