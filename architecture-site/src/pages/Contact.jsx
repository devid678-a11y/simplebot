import { useState } from 'react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    project: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        project: '',
        message: ''
      })
      
      setTimeout(() => {
        setSubmitStatus(null)
      }, 5000)
    }, 1500)
  }

  const contactInfo = [
    {
      label: 'АДРЕС',
      value: 'МОСКВА, УЛ. АРХИТЕКТОРОВ, 15',
      link: null
    },
    {
      label: 'ТЕЛЕФОН',
      value: '+7 (495) 123-45-67',
      link: 'tel:+74951234567'
    },
    {
      label: 'EMAIL',
      value: 'INFO@ARCHBUREAU.RU',
      link: 'mailto:info@archbureau.ru'
    },
    {
      label: 'ЧАСЫ РАБОТЫ',
      value: 'ПН-ПТ: 10:00 - 19:00',
      link: null
    }
  ]

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="container">
          <h1 className="contact-hero-title">КОНТАКТЫ</h1>
          <p className="contact-hero-subtitle">Начнем ваш проект сегодня</p>
        </div>
      </div>

      <div className="contact-content section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info-section">
              <h2 className="contact-section-title">СВЯЖИТЕСЬ С НАМИ</h2>
              <p className="contact-section-description">
                Готовы обсудить ваш проект? Заполните форму или свяжитесь
                с нами напрямую. Мы ответим в течение 24 часов.
              </p>

              <div className="contact-info-list">
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-info-item">
                    <div className="contact-info-label">{info.label}</div>
                    {info.link ? (
                      <a href={info.link} className="contact-info-value">
                        {info.value}
                      </a>
                    ) : (
                      <div className="contact-info-value">{info.value}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="contact-visual brutal-grid"></div>
            </div>

            <div className="contact-form-section">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    ИМЯ *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    EMAIL *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    ТЕЛЕФОН
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project" className="form-label">
                    ТИП ПРОЕКТА
                  </label>
                  <select
                    id="project"
                    name="project"
                    value={formData.project}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">ВЫБЕРИТЕ ТИП</option>
                    <option value="residential">ЖИЛОЙ</option>
                    <option value="commercial">КОММЕРЧЕСКИЙ</option>
                    <option value="cultural">КУЛЬТУРНЫЙ</option>
                    <option value="other">ДРУГОЙ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    СООБЩЕНИЕ *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    rows="6"
                    required
                  ></textarea>
                </div>

                {submitStatus === 'success' && (
                  <div className="form-success">
                    ✓ Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
                  </div>
                )}

                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

