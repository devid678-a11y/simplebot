import { useEffect } from 'react'
import './Landing.css'

export default function Landing() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting)),
      { threshold: 0.2 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <h1 className="hero-title">Заголовок страницы</h1>
          <p className="hero-sub">Короткий подзаголовок о ценности и преимуществе.</p>
          <div className="hero-cta">
            <a className="btn-primary" href="#contact">Оставить заявку</a>
            <a className="btn-ghost" href="#portfolio">Портфолио</a>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="feat-grid">
            <div className="card reveal">
              <h3>Быстро</h3>
              <p className="muted">Оптимизированные страницы и анимации без лагов.</p>
            </div>
            <div className="card reveal">
              <h3>Гибко</h3>
              <p className="muted">Легко менять контент и блоки под задачи.</p>
            </div>
            <div className="card reveal">
              <h3>Стильно</h3>
              <p className="muted">Современная типографика, плавные переходы.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="container">
          <h2>Связаться с нами</h2>
          <form className="contact-form">
            <input placeholder="Имя" />
            <input placeholder="Email" />
            <button className="btn-primary" type="button">Отправить</button>
          </form>
        </div>
      </section>
    </div>
  )
}


