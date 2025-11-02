import { useState } from 'react'
import '../elevate-styles.css'
import SmartImage from '../components/SmartImage'
import Icon from '../components/Icon'
import { 
  Leaf, Zap, Briefcase, Crown, Shirt, Coffee,
  CheckCircle2, ArrowRight, Users, Award, TrendingUp,
  Clock, Truck, Shield, Heart, Star, Gift, Sparkles,
  Target, BarChart3, ThumbsUp, Building2, Globe
} from 'lucide-react'

export default function ElevateGiftsLanding() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const categories = [
    { title: 'Эко-Friendly', desc: 'Натуральные материалы', color: '#16a34a', icon: Leaf, image: 'eco-natural-sustainable' },
    { title: 'Tech & Gadgets', desc: 'Power banks, Флешки', color: '#2563eb', icon: Zap, image: 'technology-gadgets-electronics' },
    { title: 'Office Essentials', desc: 'Блокноты, Ручки', color: '#9333ea', icon: Briefcase, image: 'office-stationery-notebooks' },
    { title: 'Premium Collection', desc: 'VIP подарки', color: '#B8860B', icon: Crown, image: 'premium-luxury-gifts' },
    { title: 'Textile', desc: 'Футболки, Худи', color: '#db2777', icon: Shirt, image: 'textile-clothing-apparel' },
    { title: 'Food & Drink', desc: 'Термосы, Наборы', color: '#ea580c', icon: Coffee, image: 'food-drink-thermos' }
  ]

  const benefits = [
    { icon: Award, title: 'Премиум качество', desc: 'Работаем только с проверенными поставщиками' },
    { icon: Target, title: 'Индивидуальный подход', desc: 'Каждый проект уникален и разрабатывается специально для вас' },
    { icon: Clock, title: 'Быстрые сроки', desc: 'От заказа до доставки за 5-7 рабочих дней' },
    { icon: Shield, title: 'Гарантия качества', desc: '100% гарантия на все изделия' },
    { icon: Globe, title: 'Доставка по РФ', desc: 'Доставляем в любой город России' },
    { icon: Heart, title: 'Экологичность', desc: 'Широкий выбор эко-материалов' }
  ]

  const processSteps = [
    { step: '01', title: 'Консультация', desc: 'Обсуждаем ваши задачи, бюджет и сроки', icon: Users },
    { step: '02', title: 'Дизайн', desc: 'Создаем уникальные макеты с вашим брендингом', icon: Sparkles },
    { step: '03', title: 'Производство', desc: 'Изготавливаем сувениры на собственном производстве', icon: Briefcase },
    { step: '04', title: 'Контроль качества', desc: 'Проверяем каждое изделие перед отправкой', icon: CheckCircle2 },
    { step: '05', title: 'Доставка', desc: 'Быстрая и безопасная доставка до вашего офиса', icon: Truck },
    { step: '06', title: 'Поддержка', desc: 'Консультации и помощь после получения заказа', icon: Heart }
  ]

  const testimonials = [
    { name: 'Анна Смирнова', company: 'ООО "ТехноПлюс"', text: 'Заказали 500 ручек с логотипом. Качество отличное, доставили в срок. Клиенты остались довольны!', rating: 5 },
    { name: 'Дмитрий Иванов', company: 'ИП Иванов', text: 'Работаем с ними уже 2 года. Всегда находят оптимальное решение по цене и качеству.', rating: 5 },
    { name: 'Елена Петрова', company: 'ООО "БизнесСервис"', text: 'Заказывали эко-сувениры для конференции. Все прошло идеально, рекомендуем!', rating: 5 },
    { name: 'Михаил Козлов', company: 'Группа компаний "Альфа"', text: 'Премиум подарки для наших партнеров. Впечатлены качеством и сервисом.', rating: 5 }
  ]

  const stats = [
    { number: '5 лет', label: 'на рынке' },
    { number: '1200+', label: 'выполненных проектов' },
    { number: '500+', label: 'довольных клиентов' },
    { number: '98%', label: 'рекомендуют нас' }
  ]

  const faqItems = [
    { q: 'Какой минимальный тираж?', a: 'Минимальный тираж от 50 штук. Для больших заказов предоставляем скидки до 25%.' },
    { q: 'Сколько времени занимает производство?', a: 'Стандартный срок производства 5-7 рабочих дней. Срочные заказы возможны за 3 дня с доплатой 20%.' },
    { q: 'Можно ли использовать свой дизайн?', a: 'Да, мы работаем с вашими макетами или создаем дизайн с нуля на основе вашего брендбука. Бесплатная правка до 3 раз.' },
    { q: 'Какие способы оплаты?', a: 'Оплата наличными, банковским переводом, картой. Для постоянных клиентов возможна отсрочка платежа до 30 дней.' },
    { q: 'Есть ли доставка в регионы?', a: 'Да, доставляем по всей России. Стоимость и сроки доставки рассчитываются индивидуально.' },
    { q: 'Предоставляете ли вы гарантию?', a: 'Да, предоставляем гарантию 12 месяцев на все изделия. Если обнаружите брак - заменим бесплатно.' }
  ]

  return (
    <div style={{ 
      backgroundColor: '#F9F9F9', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#333333'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontFamily: 'Poppins, sans-serif', 
              fontWeight: 700, 
              color: '#333333',
              margin: 0
            }}>
              ELEVATE GIFTS
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <a href="tel:+74951234567" style={{ color: '#333333', textDecoration: 'none' }}>
                +7 (495) 123-45-67
              </a>
              <button style={{
                backgroundColor: '#008080',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Заказать Бриф
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#008080', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Превращаем бренд в опыт
          </p>
          <p style={{ fontSize: '0.75rem', color: '#999' }}>Деловые подарки нового поколения</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '1.5rem',
              lineHeight: 1.2
            }}>
              Искусство Корпоративного Подарка.
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Персонализированные решения, отражающие ценности вашего бренда.
            </p>
            <button style={{
              backgroundColor: '#008080',
              color: 'white',
              padding: '0.875rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '1.125rem',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              Начать Проект →
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid rgba(184, 134, 11, 0.2)' }}>
              <SmartImage
                keyword="premium corporate gifts wooden background minimalist"
                alt="Премиальные корпоративные сувениры"
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>Нам доверяют:</p>
            <div style={{ display: 'flex', gap: '2rem', opacity: 0.6 }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>SONY</div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>GAZPROM</div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>YANDEX</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', width: '100%', maxWidth: '800px' }}>
              {stats.map((stat, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#008080' }}>{stat.number}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <SmartImage
              keyword="corporate team business professionals"
              alt="О компании"
              width={600}
              height={400}
              style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
          </div>
          <div>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '1rem'
            }}>
              О компании ELEVATE GIFTS
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', lineHeight: 1.7 }}>
              Мы специализируемся на создании премиальных корпоративных сувениров и деловых подарков, которые отражают ценности вашего бренда и оставляют незабываемое впечатление.
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Наша команда дизайнеров и менеджеров работает с компаниями всех размеров - от стартапов до крупных корпораций. Мы понимаем, что каждый подарок - это возможность укрепить отношения с клиентами и партнерами.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#008080" />
                <span style={{ fontSize: '0.875rem' }}>Собственное производство</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#008080" />
                <span style={{ fontSize: '0.875rem' }}>Сертифицированные материалы</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#008080" />
                <span style={{ fontSize: '0.875rem' }}>Экологичное производство</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: 'white', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: '#333333',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Почему выбирают нас
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {benefits.map((benefit, idx) => {
              const IconComponent = benefit.icon
              return (
                <div key={idx} style={{
                  backgroundColor: '#F9F9F9',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ color: '#008080', marginBottom: '1rem' }}>
                    <IconComponent size={40} />
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    color: '#333333',
                    marginBottom: '0.5rem'
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {benefit.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Product Categories - Enhanced */}
      <section id="catalog" style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          color: '#333333',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          Категории Продуктов
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {categories.map((cat, idx) => {
            const IconComponent = cat.icon
            return (
              <div key={idx} style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                  <SmartImage
                    keyword={cat.image}
                    alt={cat.title}
                    width={400}
                    height={300}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ color: cat.color, marginBottom: '1rem' }}>
                    <IconComponent size={32} />
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    color: '#333333',
                    marginBottom: '0.5rem'
                  }}>
                    {cat.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>{cat.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Process Section */}
      <section style={{ backgroundColor: 'white', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: '#333333',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Как мы работаем
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {processSteps.map((step, idx) => {
              const IconComponent = step.icon
              return (
                <div key={idx} style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  backgroundColor: '#F9F9F9',
                  borderRadius: '0.75rem',
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 800,
                    color: '#008080',
                    opacity: 0.2,
                    marginBottom: '1rem'
                  }}>
                    {step.step}
                  </div>
                  <div style={{ color: '#008080', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <IconComponent size={32} />
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    color: '#333333',
                    marginBottom: '0.5rem'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Portfolio/Examples Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          color: '#333333',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          Примеры наших работ
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { title: 'Корпоративные ручки', desc: 'Тираж 1000 шт', image: 'corporate-pens-business-writing' },
            { title: 'Премиум блокноты', desc: 'VIP подарки', image: 'premium-notebooks-leather-luxury' },
            { title: 'Эко-сумки', desc: 'Экологичные материалы', image: 'eco-bags-sustainable-tote' },
            { title: 'USB флешки', desc: 'Технологичные решения', image: 'usb-flash-drives-technology' },
            { title: 'Футболки с логотипом', desc: 'Корпоративный стиль', image: 't-shirts-logo-corporate' },
            { title: 'Подарочные наборы', desc: 'Готовые комплекты', image: 'gift-sets-premium-box' }
          ].map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                <SmartImage
                  keyword={item.image}
                  alt={item.title}
                  width={400}
                  height={300}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: '#333333',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ backgroundColor: 'white', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: '#333333',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Отзывы наших клиентов
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {testimonials.map((testimonial, idx) => (
              <div key={idx} style={{
                backgroundColor: '#F9F9F9',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: '1px solid #f0f0f0',
                position: 'relative'
              }}>
                <div style={{ fontSize: '1rem', color: '#ffc107', marginBottom: '1rem' }}>
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p style={{
                  color: '#333',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                  fontStyle: 'italic'
                }}>
                  "{testimonial.text}"
                </p>
                <div>
                  <div style={{
                    fontWeight: 600,
                    color: '#333333',
                    marginBottom: '0.25rem'
                  }}>
                    {testimonial.name}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>
                    {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Form */}
      <section style={{ backgroundColor: 'white', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2rem)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: '#333333',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            Готовы к Вашей следующей кампании?
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Имя"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            <input
              type="tel"
              placeholder="Телефон"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              required
            />
            <textarea
              placeholder="Опишите задачу"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
            {submitted ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                fontWeight: 600
              }}>
                ✅ Спасибо! Мы свяжемся с вами в ближайшее время.
              </div>
            ) : (
              <button
                type="submit"
                style={{
                  backgroundColor: '#008080',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                Получить Индивидуальный Расчет
              </button>
            )}
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          color: '#333333',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          Часто задаваемые вопросы
        </h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqItems.map((faq, idx) => (
            <details key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid #f0f0f0',
              cursor: 'pointer'
            }}>
              <summary style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                color: '#333333',
                fontSize: '1rem',
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{faq.q}</span>
                <span style={{ color: '#008080', fontSize: '1.5rem' }}>+</span>
              </summary>
              <p style={{
                color: '#666',
                marginTop: '1rem',
                lineHeight: 1.7,
                fontSize: '0.9375rem'
              }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#333333',
        color: 'white',
        padding: '3rem 1rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem' }}>
                Контакты
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <a href="tel:+74951234567" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  +7 (495) 123-45-67
                </a>
                <a href="mailto:info@elevategifts.ru" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                  info@elevategifts.ru
                </a>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>Москва, ул. Примерная, д. 123</div>
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem' }}>
                Навигация
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <a href="#catalog" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Каталог</a>
                <a href="#portfolio" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Портфолио</a>
                <a href="#eco" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Эко-серия</a>
                <a href="#contacts" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Контакты</a>
              </nav>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem' }}>
                Услуги
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Корпоративные подарки</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Брендирование</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>VIP подарки</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Эко-сувениры</a>
              </nav>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #374151',
            paddingTop: '2rem',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8125rem'
          }}>
            © 2025 ELEVATE GIFTS. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  )
}
