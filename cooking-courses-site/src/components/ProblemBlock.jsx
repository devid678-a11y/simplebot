import './ProblemBlock.css'

const ProblemBlock = () => {
  const problems = [
    {
      icon: '😔',
      title: 'Устали от однообразной еды?',
      description: 'Одни и те же блюда каждый день надоедают'
    },
    {
      icon: '😰',
      title: 'Боитесь готовить что-то сложное?',
      description: 'Думаете, что ресторанные блюда — это слишком сложно'
    },
    {
      icon: '⏰',
      title: 'Нет времени на долгие рецепты?',
      description: 'Хотите готовить быстро и вкусно'
    },
    {
      icon: '💰',
      title: 'Рестораны слишком дороги?',
      description: 'Хотите готовить дома, но не знаете как'
    }
  ]

  return (
    <section className="problem-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Знакомые проблемы?</h2>
          <p className="section-subtitle">
            Мы знаем, через что вы проходите. И у нас есть решение!
          </p>
        </div>
        
        <div className="problems-grid">
          {problems.map((problem, index) => (
            <div key={index} className="problem-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="problem-icon">{problem.icon}</div>
              <h3 className="problem-title">{problem.title}</h3>
              <p className="problem-description">{problem.description}</p>
            </div>
          ))}
        </div>
        
        <div className="solution-box">
          <div className="solution-icon">✨</div>
          <h3 className="solution-title">Наши курсы — это просто!</h3>
          <p className="solution-description">
            Пошаговые видео-уроки, которые превратят вас в настоящего шеф-повара. 
            Готовьте ресторанные блюда дома, даже если никогда не готовили.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProblemBlock



