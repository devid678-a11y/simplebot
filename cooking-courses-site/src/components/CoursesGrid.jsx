import { Link } from 'react-router-dom'
import './CoursesGrid.css'

const CoursesGrid = () => {
  const courses = [
    {
      id: 1,
      title: 'Итальянская кухня',
      description: 'Паста, пицца, ризотто и другие классические блюда Италии',
      duration: '12 часов',
      lessons: 24,
      price: 4990,
      oldPrice: 9990,
      rating: 4.9,
      students: 12450,
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop',
      badge: 'Популярный'
    },
    {
      id: 2,
      title: 'Азиатская кухня',
      description: 'Суши, рамэн, пад-тай и другие блюда Азии',
      duration: '15 часов',
      lessons: 30,
      price: 5990,
      oldPrice: 11990,
      rating: 4.8,
      students: 8900,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      badge: 'Новинка'
    },
    {
      id: 3,
      title: 'Выпечка и десерты',
      description: 'Торты, пирожные, печенье и другие сладости',
      duration: '18 часов',
      lessons: 36,
      price: 6990,
      oldPrice: 13990,
      rating: 5.0,
      students: 15600,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
      badge: 'Хит'
    },
    {
      id: 4,
      title: 'Здоровое питание',
      description: 'Полезные и вкусные блюда для правильного питания',
      duration: '10 часов',
      lessons: 20,
      price: 4490,
      oldPrice: 8990,
      rating: 4.7,
      students: 6700,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'Веганская кухня',
      description: 'Вкусные блюда без продуктов животного происхождения',
      duration: '14 часов',
      lessons: 28,
      price: 5490,
      oldPrice: 10990,
      rating: 4.9,
      students: 5200,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Барбекю и гриль',
      description: 'Стейки, шашлыки и другие блюда на огне',
      duration: '8 часов',
      lessons: 16,
      price: 3990,
      oldPrice: 7990,
      rating: 4.8,
      students: 3400,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=400&fit=crop'
    }
  ]

  return (
    <section className="courses-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Наши курсы</h2>
          <p className="section-subtitle">
            Выберите курс, который вам интересен, и начните готовить уже сегодня
          </p>
        </div>
        
        <div className="courses-grid">
          {courses.map((course, index) => (
            <div 
              key={course.id} 
              className="course-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {course.badge && (
                <div className="course-badge">{course.badge}</div>
              )}
              
              <div className="course-image-wrapper">
                <div 
                  className="course-image"
                  style={{ backgroundImage: `url(${course.image})` }}
                ></div>
                <div className="course-overlay">
                  <Link to={`/course/${course.id}`} className="btn btn-primary">
                    Смотреть курс
                  </Link>
                </div>
              </div>
              
              <div className="course-content">
                <div className="course-header">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-rating">
                    <span className="rating-stars">⭐</span>
                    <span className="rating-value">{course.rating}</span>
                  </div>
                </div>
                
                <p className="course-description">{course.description}</p>
                
                <div className="course-info">
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📚</span>
                    <span>{course.lessons} уроков</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">👥</span>
                    <span>{course.students.toLocaleString()} учеников</span>
                  </div>
                </div>
                
                <div className="course-price">
                  <div className="price-current">
                    <span className="price-value">{course.price.toLocaleString()}</span>
                    <span className="price-currency">₽</span>
                  </div>
                  {course.oldPrice && (
                    <div className="price-old">
                      {course.oldPrice.toLocaleString()} ₽
                    </div>
                  )}
                </div>
                
                <Link to={`/course/${course.id}`} className="btn btn-primary btn-full">
                  Записаться на курс
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CoursesGrid



