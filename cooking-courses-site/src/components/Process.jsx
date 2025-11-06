import './Process.css'

const Process = () => {
  const steps = [
    {
      number: '01',
      title: 'Выбираете курс',
      description: 'Выберите курс, который вам интересен. Все курсы доступны сразу после покупки.',
      icon: '📚'
    },
    {
      number: '02',
      title: 'Смотрите видео-уроки',
      description: 'Учитесь в удобное время. Видео доступны навсегда, можно пересматривать.',
      icon: '▶️'
    },
    {
      number: '03',
      title: 'Готовите по рецептам',
      description: 'Следуйте пошаговым инструкциям и готовьте ресторанные блюда дома.',
      icon: '👨‍🍳'
    },
    {
      number: '04',
      title: 'Получаете сертификат',
      description: 'После завершения курса получите сертификат, подтверждающий ваши навыки.',
      icon: '🏆'
    }
  ]

  return (
    <section className="process-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Как это работает</h2>
          <p className="section-subtitle">
            Простой процесс обучения, который приведет вас к результату
          </p>
        </div>
        
        <div className="process-steps">
          {steps.map((step, index) => (
            <div key={index} className="process-step">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Process



