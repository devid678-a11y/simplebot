import { useEffect, useState } from 'react'
import './SouvenirsLanding.css'
import SmartImage from '../components/SmartImage'
import Icon from '../components/Icon'

export default function SouvenirsLanding() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Анимация появления элементов при скролле
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Здесь будет отправка формы
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="souvenirs-landing">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="container">
          <div className="hero-content fade-in">
            <h1 className="hero-title">
              Корпоративные сувениры
              <span className="gradient-text"> для вашего бизнеса</span>
            </h1>
            <p className="hero-subtitle">
              Увеличиваем узнаваемость бренда на 73% с помощью качественных промо-материалов
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Довольных клиентов</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">15,000+</div>
                <div className="stat-label">Изготовленных сувениров</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Рекомендуют нас</div>
              </div>
            </div>
            <button className="cta-primary" onClick={() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })}>
              Получить расчет стоимости
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title fade-in">Почему выбирают нас</h2>
          <div className="benefits-grid">
            <div className="benefit-card fade-in">
              <div className="benefit-icon">
                <Icon name="lightning" size={40} color="#1976d2" />
              </div>
              <h3>Быстрое производство</h3>
              <p>От 3 до 7 дней от заказа до доставки</p>
            </div>
            <div className="benefit-card fade-in">
              <div className="benefit-icon">
                <Icon name="palette" size={40} color="#7b1fa2" />
              </div>
              <h3>Индивидуальный дизайн</h3>
              <p>Уникальные решения под ваш бренд</p>
            </div>
            <div className="benefit-card fade-in">
              <div className="benefit-icon">
                <Icon name="dollar" size={40} color="#1976d2" />
              </div>
              <h3>Выгодные цены</h3>
              <p>Оптимальное соотношение цена-качество</p>
            </div>
            <div className="benefit-card fade-in">
              <div className="benefit-icon">
                <Icon name="package" size={40} color="#7b1fa2" />
              </div>
              <h3>Доставка по РФ</h3>
              <p>Быстрая и надежная доставка</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title fade-in">Категории сувениров</h2>
          <div className="products-grid">
            {[
              { name: 'Ручки и письменные принадлежности', icon: '✍️', desc: 'Классика корпоративных подарков' },
              { name: 'USB-накопители и аксессуары', icon: '💾', desc: 'Современные технологичные решения' },
              { name: 'Текстиль и одежда', icon: '👕', desc: 'Футболки, поло, толстовки с логотипом' },
              { name: 'Эко-сувениры', icon: '🌱', desc: 'Экологичные материалы и решения' },
              { name: 'Канцелярия', icon: '📎', desc: 'Блокноты, папки, ежедневники' },
              { name: 'Подарочные наборы', icon: '🎁', desc: 'Готовые комплекты для клиентов' },
            ].map((product, idx) => (
              <div key={idx} className="product-card fade-in">
                <div className="product-image-wrapper">
                  <SmartImage
                    productType={product.name}
                    alt={product.name}
                    width={400}
                    height={300}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3>{product.name}</h3>
                <p>{product.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="container">
          <h2 className="section-title fade-in">Как мы работаем</h2>
          <div className="process-steps">
            {[
              { step: '01', title: 'Консультация', desc: 'Обсуждаем ваши задачи и бюджет' },
              { step: '02', title: 'Дизайн', desc: 'Создаем макеты с вашим брендингом' },
              { step: '03', title: 'Производство', desc: 'Изготавливаем сувениры в срок' },
              { step: '04', title: 'Доставка', desc: 'Отправляем заказ вам или клиентам' },
            ].map((item, idx) => (
              <div key={idx} className="process-step fade-in">
                <div className="step-number">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title fade-in">Отзывы клиентов</h2>
          <div className="testimonials-grid">
            {[
              { name: 'Анна Смирнова', company: 'ООО "ТехноПлюс"', text: 'Заказали 500 ручек с логотипом. Качество отличное, доставили в срок. Клиенты остались довольны!' },
              { name: 'Дмитрий Иванов', company: 'ИП Иванов', text: 'Работаем с ними уже 2 года. Всегда находят оптимальное решение по цене и качеству.' },
              { name: 'Елена Петрова', company: 'ООО "БизнесСервис"', text: 'Заказывали эко-сувениры для конференции. Все прошло идеально, рекомендуем!' },
            ].map((testimonial, idx) => (
              <div key={idx} className="testimonial-card fade-in">
                <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Form Section */}
      <section id="form" className="form-section">
        <div className="container">
          <div className="form-wrapper fade-in">
            <h2 className="form-title">Получите расчет стоимости за 5 минут</h2>
            <p className="form-subtitle">Заполните форму, и мы свяжемся с вами в течение часа</p>
            {submitted ? (
              <div className="success-message">
                ✅ Спасибо! Мы свяжемся с вами в ближайшее время
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="tel"
                    placeholder="Телефон"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Опишите, какие сувениры вас интересуют"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <button type="submit" className="cta-primary form-submit">
                  Получить расчет
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title fade-in">Частые вопросы</h2>
          <div className="faq-list">
            {[
              { q: 'Какой минимальный тираж?', a: 'Минимальный тираж от 50 штук. Для больших заказов предоставляем скидки.' },
              { q: 'Сколько времени занимает производство?', a: 'Стандартный срок производства 5-7 рабочих дней. Срочные заказы возможны за 3 дня с доплатой.' },
              { q: 'Можно ли использовать свой дизайн?', a: 'Да, мы работаем с вашими макетами или создаем дизайн с нуля на основе вашего брендбука.' },
              { q: 'Какие способы оплаты?', a: 'Оплата наличными, банковским переводом, картой. Для постоянных клиентов возможна отсрочка платежа.' },
            ].map((faq, idx) => (
              <details key={idx} className="faq-item fade-in">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Контакты</h3>
              <p>📞 +7 (495) 123-45-67</p>
              <p>📧 info@souvenirs.ru</p>
              <p>📍 Москва, ул. Примерная, 123</p>
            </div>
            <div className="footer-section">
              <h3>Режим работы</h3>
              <p>Пн-Пт: 9:00 - 18:00</p>
              <p>Сб-Вс: Выходной</p>
            </div>
            <div className="footer-section">
              <h3>Социальные сети</h3>
              <div className="social-links">
                <a href="#">VK</a>
                <a href="#">Telegram</a>
                <a href="#">WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Корпоративные сувениры. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


