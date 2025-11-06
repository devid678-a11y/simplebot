import './Chefs.css'

const Chefs = () => {
  const chefs = [
    {
      id: 1,
      name: 'Андрей Макаров',
      role: 'Шеф-повар',
      experience: '15 лет опыта',
      restaurant: 'Ресторан "Европа"',
      awards: 'Лучший шеф-повар 2023',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      specialty: 'Итальянская кухня'
    },
    {
      id: 2,
      name: 'Мария Волкова',
      role: 'Шеф-кондитер',
      experience: '12 лет опыта',
      restaurant: 'Кондитерская "Сладкая жизнь"',
      awards: 'Золотая медаль кондитеров',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      specialty: 'Десерты и выпечка'
    },
    {
      id: 3,
      name: 'Дмитрий Ким',
      role: 'Шеф-повар',
      experience: '10 лет опыта',
      restaurant: 'Ресторан "Токио"',
      awards: 'Мастер азиатской кухни',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      specialty: 'Азиатская кухня'
    }
  ]

  return (
    <section className="chefs-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Наши преподаватели</h2>
          <p className="section-subtitle">
            Обучайтесь у профессиональных шеф-поваров с мировым именем
          </p>
        </div>
        
        <div className="chefs-grid">
          {chefs.map((chef, index) => (
            <div 
              key={chef.id}
              className="chef-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="chef-image-wrapper">
                <div 
                  className="chef-image"
                  style={{ backgroundImage: `url(${chef.image})` }}
                ></div>
                <div className="chef-badge">{chef.specialty}</div>
              </div>
              
              <div className="chef-content">
                <h3 className="chef-name">{chef.name}</h3>
                <p className="chef-role">{chef.role}</p>
                <p className="chef-experience">{chef.experience}</p>
                <p className="chef-restaurant">{chef.restaurant}</p>
                <div className="chef-award">
                  <span className="award-icon">🏆</span>
                  <span>{chef.awards}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Chefs



