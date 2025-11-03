import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AnimatedNumber from '../components/AnimatedNumber'
import ProjectModal from '../components/ProjectModal'
import './Home.css'

const Home = () => {
  const heroRef = useRef(null)
  const projectsRef = useRef(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    if (heroRef.current) observer.observe(heroRef.current)
    if (projectsRef.current) {
      const items = projectsRef.current.querySelectorAll('.project-item')
      items.forEach((item) => observer.observe(item))
    }
    
    // Observe service items
    const serviceItems = document.querySelectorAll('.service-item')
    serviceItems.forEach((item) => observer.observe(item))
    
    // Observe team members
    const teamMembers = document.querySelectorAll('.team-member')
    teamMembers.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  const projects = [
    {
      id: 1,
      title: 'ЖИЛОЙ КОМПЛЕКС',
      location: 'МОСКВА, 2024',
      category: 'RESIDENTIAL',
      image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop'
    },
    {
      id: 2,
      title: 'ОФИСНОЕ ЗДАНИЕ',
      location: 'САНКТ-ПЕТЕРБУРГ, 2023',
      category: 'COMMERCIAL',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop'
    },
    {
      id: 3,
      title: 'КУЛЬТУРНЫЙ ЦЕНТР',
      location: 'ЕКАТЕРИНБУРГ, 2024',
      category: 'CULTURAL',
      image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop'
    }
  ]

  const team = [
    {
      id: 1,
      name: 'АЛЕКСАНДР ИВАНОВ',
      role: 'ГЛАВНЫЙ АРХИТЕКТОР',
      experience: '15 ЛЕТ',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80'
    },
    {
      id: 2,
      name: 'МАРИЯ ПЕТРОВА',
      role: 'ВЕДУЩИЙ ДИЗАЙНЕР',
      experience: '12 ЛЕТ',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80'
    },
    {
      id: 3,
      name: 'ДМИТРИЙ СИДОРОВ',
      role: 'ПРОЕКТНЫЙ МЕНЕДЖЕР',
      experience: '10 ЛЕТ',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80'
    }
  ]

  const services = [
    {
      id: 1,
      number: '01',
      title: 'ЖИЛАЯ АРХИТЕКТУРА',
      description: 'Проектирование жилых комплексов, частных домов и апартаментов.'
    },
    {
      id: 2,
      number: '02',
      title: 'КОММЕРЧЕСКАЯ АРХИТЕКТУРА',
      description: 'Офисные здания, торговые центры, бизнес-центры.'
    },
    {
      id: 3,
      number: '03',
      title: 'КУЛЬТУРНЫЕ ОБЪЕКТЫ',
      description: 'Музеи, театры, библиотеки, культурные центры.'
    },
    {
      id: 4,
      number: '04',
      title: 'ГРАДОСТРОИТЕЛЬСТВО',
      description: 'Планирование городских пространств и общественных зон.'
    }
  ]

  const process = [
    { step: '01', title: 'ИССЛЕДОВАНИЕ', description: 'Анализ участка, требований, контекста' },
    { step: '02', title: 'КОНЦЕПЦИЯ', description: 'Разработка архитектурной концепции' },
    { step: '03', title: 'ПРОЕКТИРОВАНИЕ', description: 'Детальная проработка проекта' },
    { step: '04', title: 'РАЗРАБОТКА', description: 'Техническая документация и согласования' },
    { step: '05', title: 'РЕАЛИЗАЦИЯ', description: 'Авторский надзор и реализация проекта' }
  ]

  const clients = [
    { 
      name: 'РОСАТОМ', 
      logo: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="40" height="40" stroke="currentColor" strokeWidth="3"/>
          <circle cx="40" cy="40" r="8" fill="currentColor"/>
          <line x1="40" y1="20" x2="40" y2="60" stroke="currentColor" strokeWidth="2"/>
          <line x1="20" y1="40" x2="60" y2="40" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      name: 'ГАЗПРОМ', 
      logo: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="25" width="50" height="30" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="25" y="35" width="30" height="10" fill="currentColor"/>
          <line x1="30" y1="45" x2="50" y2="45" stroke="currentColor" strokeWidth="2"/>
          <line x1="35" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      name: 'СБЕРБАНК', 
      logo: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="25" width="40" height="30" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="25" y="30" width="30" height="20" fill="currentColor" opacity="0.3"/>
          <rect x="30" y="35" width="20" height="10" fill="currentColor"/>
        </svg>
      )
    },
    { 
      name: 'АФК СИСТЕМА', 
      logo: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="15" height="40" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="40" y="20" width="15" height="40" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="60" y="20" width="15" height="40" stroke="currentColor" strokeWidth="3" fill="none"/>
          <line x1="20" y1="40" x2="75" y2="40" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      name: 'ДЕВЕЛОПЕРСКАЯ ГРУППА', 
      logo: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="20" height="50" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="40" y="25" width="20" height="40" stroke="currentColor" strokeWidth="3" fill="none"/>
          <rect x="65" y="35" width="10" height="30" fill="currentColor"/>
          <line x1="15" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2"/>
          <line x1="40" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ]

  const awards = [
    { year: '2024', title: 'ARCHITECTURAL AWARD', description: 'Лучший жилой комплекс' },
    { year: '2023', title: 'DESIGN EXCELLENCE', description: 'Инновации в коммерческой архитектуре' },
    { year: '2022', title: 'CULTURAL HERITAGE', description: 'Реставрация исторического здания' }
  ]

  const testimonials = [
    {
      id: 1,
      quote: 'Профессиональный подход и внимание к деталям. Проект превзошел все ожидания.',
      author: 'ИВАН СМИРНОВ',
      company: 'ГЕНЕРАЛЬНЫЙ ДИРЕКТОР, РОСАТОМ',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80'
    },
    {
      id: 2,
      quote: 'Инновационные решения и современный подход к архитектуре. Рекомендуем.',
      author: 'ЕЛЕНА КОЗЛОВА',
      company: 'РУКОВОДИТЕЛЬ ПРОЕКТА, СБЕРБАНК',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80'
    }
  ]

  const history = [
    { year: '1999', event: 'Основание бюро', description: 'Начало работы в архитектуре' },
    { year: '2005', event: 'Первый крупный проект', description: 'Жилой комплекс в Москве' },
    { year: '2010', event: 'Международное признание', description: 'Проекты в 10 странах' },
    { year: '2015', event: 'Премия года', description: 'Лучшее архитектурное бюро' },
    { year: '2020', event: '150+ проектов', description: 'Новый рубеж достижений' },
    { year: '2024', event: 'Современные технологии', description: 'Внедрение BIM и устойчивого дизайна' }
  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="hero-image"></div>
          <div className="hero-overlay"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                АРХИТЕКТУРА
                <br />
                <span className="accent">БЕЗ КОМПРОМИССОВ</span>
              </h1>
              <p className="hero-description">
                Создаем пространства, которые формируют будущее.
                Брутализм как философия дизайна. Чистота форм.
                Функциональность превыше всего.
              </p>
              <div className="hero-actions">
                <Link to="/contact" className="btn btn-primary">
                  НАЧАТЬ ПРОЕКТ
                </Link>
                <Link to="/blog" className="btn btn-secondary">
                  СМОТРЕТЬ РАБОТЫ
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <span>СКРОЛЛ</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedNumber value="150" suffix="+" />
              </div>
              <div className="stat-label">ПРОЕКТОВ</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedNumber value="25" />
              </div>
              <div className="stat-label">ЛЕТ ОПЫТА</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedNumber value="50" suffix="+" />
              </div>
              <div className="stat-label">НАГРАД</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedNumber value="30" />
              </div>
              <div className="stat-label">СТРАН</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="projects-section section" ref={projectsRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ПРОЕКТЫ</h2>
            <p className="section-subtitle">Выборочный портфель работ</p>
          </div>
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="project-item" 
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  setSelectedProject(project)
                  setIsModalOpen(true)
                }}
              >
                <div className="project-image-wrapper">
                  <div className="project-image" style={{ backgroundImage: `url(${project.image})` }}></div>
                  <div className="project-overlay">
                    <div className="project-info">
                      <span className="project-category">{project.category}</span>
                      <h3 className="project-title">{project.title}</h3>
                      <p className="project-location">{project.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">УСЛУГИ</h2>
            <p className="section-subtitle">Полный спектр архитектурных решений</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={service.id} className="service-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="service-number">{service.number}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ПРОЦЕСС РАБОТЫ</h2>
            <p className="section-subtitle">От концепции до реализации</p>
          </div>
          <div className="process-grid">
            {process.map((item, index) => (
              <div key={index} className="process-card">
                <div className="process-card-number">{item.step}</div>
                <div className="process-card-content">
                  <h3 className="process-card-title">{item.title}</h3>
                  <p className="process-card-description">{item.description}</p>
                </div>
                {index < process.length - 1 && <div className="process-card-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">КОМАНДА</h2>
            <p className="section-subtitle">Профессионалы с многолетним опытом</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <div key={member.id} className="team-member" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="team-member-image-wrapper">
                  <div className="team-member-image" style={{ backgroundImage: `url(${member.image})` }}></div>
                </div>
                <div className="team-member-info">
                  <h3 className="team-member-name">{member.name}</h3>
                  <p className="team-member-role">{member.role}</p>
                  <p className="team-member-experience">{member.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="clients-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">КЛИЕНТЫ</h2>
            <p className="section-subtitle">Нам доверяют ведущие компании</p>
          </div>
          <div className="clients-grid">
            {clients.map((client, index) => (
              <div key={index} className="client-item">
                <div className="client-logo">
                  {client.logo}
                </div>
                <p className="client-name">{client.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="awards-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">НАГРАДЫ</h2>
            <p className="section-subtitle">Признание профессионального сообщества</p>
          </div>
          <div className="awards-grid">
            {awards.map((award, index) => (
              <div key={index} className="award-item">
                <div className="award-year">{award.year}</div>
                <h3 className="award-title">{award.title}</h3>
                <p className="award-description">{award.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ОТЗЫВЫ</h2>
            <p className="section-subtitle">Что говорят наши клиенты</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-item">
                <div className="testimonial-quote">"{testimonial.quote}"</div>
                <div className="testimonial-author">
                  <div className="testimonial-author-image" style={{ backgroundImage: `url(${testimonial.image})` }}></div>
                  <div className="testimonial-author-info">
                    <p className="testimonial-author-name">{testimonial.author}</p>
                    <p className="testimonial-author-company">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="history-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ИСТОРИЯ</h2>
            <p className="section-subtitle">25 лет в архитектуре</p>
          </div>
          <div className="history-timeline">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-year">{item.year}</div>
                <div className="history-content">
                  <h3 className="history-event">{item.event}</h3>
                  <p className="history-description">{item.description}</p>
                </div>
                {index < history.length - 1 && <div className="history-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy-section section">
        <div className="container">
          <div className="philosophy-content">
            <div className="philosophy-text">
              <h2 className="philosophy-title">ФИЛОСОФИЯ</h2>
              <div className="philosophy-description">
                <p>
                  Мы верим в силу простоты. Каждая линия имеет значение.
                  Каждая форма выполняет функцию. Брутализм — это не грубость,
                  это честность материала и конструкции.
                </p>
                <p>
                  Наш подход основан на трех принципах: функциональность,
                  долговечность и эстетическая чистота. Мы создаем архитектуру,
                  которая стоит веками.
                </p>
              </div>
            </div>
            <div className="philosophy-visual brutal-grid"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">ГОТОВЫ НАЧАТЬ ПРОЕКТ?</h2>
            <p className="cta-description">
              Свяжитесь с нами сегодня и обсудим ваши идеи.
              Создадим пространство, которое формирует будущее.
            </p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary btn-large">
                СВЯЗАТЬСЯ С НАМИ
              </Link>
              <Link to="/blog" className="btn btn-secondary btn-large">
                СМОТРЕТЬ РАБОТЫ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProject(null)
        }}
      />
    </div>
  )
}

export default Home

