import './Testimonials.css'

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Мария Петрова',
      role: 'Домохозяйка',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      quote: 'Никогда не думала, что смогу готовить такие блюда! Теперь моя семья в восторге от моих кулинарных экспериментов. Курс очень понятный, все пошагово.',
      rating: 5,
      dish: 'Паста Карбонара'
    },
    {
      id: 2,
      name: 'Алексей Смирнов',
      role: 'IT-специалист',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      quote: 'У меня было ноль опыта в готовке. После курса я могу готовить ресторанные блюда. Друзья не верят, что это я готовил! Отличная инвестиция в себя.',
      rating: 5,
      dish: 'Стейк с овощами'
    },
    {
      id: 3,
      name: 'Елена Козлова',
      role: 'Студентка',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      quote: 'Потрясающий курс! Видео очень качественные, все объясняется просто. Теперь я готовлю намного лучше и с удовольствием. Рекомендую всем!',
      rating: 5,
      dish: 'Тирамису'
    },
    {
      id: 4,
      name: 'Дмитрий Иванов',
      role: 'Бизнесмен',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      quote: 'Купил курс для жены, но сам увлекся. Теперь готовим вместе, это стало нашим хобби. Качество обучения на высшем уровне.',
      rating: 5,
      dish: 'Ризотто с грибами'
    }
  ]

  return (
    <section className="testimonials-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Отзывы наших учеников</h2>
          <p className="section-subtitle">
            Более 50,000 довольных учеников уже готовят как шеф-повара
          </p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              className="testimonial-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="star">⭐</span>
                ))}
              </div>
              
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              
              <div className="testimonial-author">
                <div 
                  className="author-image"
                  style={{ backgroundImage: `url(${testimonial.image})` }}
                ></div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
              
              <div className="testimonial-dish">
                <span className="dish-icon">🍽️</span>
                <span>Готовит: {testimonial.dish}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="testimonials-stats">
          <div className="stat-box">
            <div className="stat-number">98%</div>
            <div className="stat-label">Довольных учеников</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">4.9</div>
            <div className="stat-label">Средний рейтинг</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">50,000+</div>
            <div className="stat-label">Активных учеников</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials



