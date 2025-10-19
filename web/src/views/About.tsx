import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="t-about">
      <div className="container">
        <div className="hero">
          <h1>О компании</h1>
          <br />
        </div>
        
        <section className="section">
          <div className="grid-2">
            <div className="card">
              <h2>Кто мы</h2>
              <p className="lead" style={{fontSize: '20px', color: '#000', fontWeight: '600'}}>
                DEMEX RUS — официальный представитель международного бренда эпоксидной плиточной затирки в России.
              </p>
            </div>
            <div className="card">
              <h2>Наша миссия</h2>
              <p>Мы создаем будущее профессионального ремонта, делая его проще, эффективнее и доступнее для каждого.</p>
              <p>Наша миссия — изменить подход к оформлению плиточных швов, предлагая российским мастерам и энтузиастам DIY передовые решения, которые меняют представление о качестве и скорости работы.</p>
              <p className="muted">Мы не просто поставляем продукцию — мы меняем индустрию, делая её более доступной, понятной и результативной. Для каждого.</p>
            </div>
          </div>
        </section>

        <section className="section" id="values">
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Мы верим, что каждый заслуживает</h3>
              <ul className="list">
                <br />
                <li>Безупречного результата без сложных технологий</li>
                <li>Экономии времени без потери качества</li>
                <li>Надежности в каждом шве</li>
                <li>Удовольствия от процесса работы</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="card-title">Мы создаем решения, которые</h3>
              <ul className="list">
                <br />
                <li>Делают работу проще и эффективнее</li>
                <li>Обеспечивают профессиональный результат даже начинающим</li>
                <li>Соответствуют высоким стандартам качества</li>
                <li>Учитывают особенности отечественного климата и условий эксплуатации</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="photos-final" id="about-photos-final">
          <h2>Фото</h2>
          <div className="grid">
            <figure className="photo-card">
              <div className="frame">
                <img 
                  src="https://static.tildacdn.com/tild6430-6639-4338-a432-616231326339/11.png"
                  alt="Фото 1 (замените ссылку)" 
                  width="1200" 
                  height="1200" 
                  loading="lazy"
                />
              </div>
              <figcaption>Завод Yitu Grout</figcaption>
            </figure>
            <figure className="photo-card">
              <div className="frame">
                <img 
                  src="https://static.tildacdn.com/tild6435-3265-4239-b963-303137396261/5.png"
                  alt="Фото 2 (замените ссылку)" 
                  width="1200" 
                  height="1200" 
                  loading="lazy"
                />
              </div>
              <figcaption>Завод DEMEX / Yitu Grout</figcaption>
            </figure>
          </div>
        </section>

        <section className="section">
          <h2>Компания в цифрах</h2>
          <div className="card" style={{marginBottom: '12px'}}>
            В настоящее время существует два основных завода: в Цзиньхуа, Чжэцзян и Шицзячжуан, Хэбэй.
          </div>
          <div className="stats">
            <div className="stat">
              <div className="num">50 000</div>
              <div className="desc">м² — площадь производственных помещений</div>
            </div>
            <div className="stat">
              <div className="num">30 000</div>
              <div className="desc">м² — площадь складских помещений</div>
            </div>
            <div className="stat">
              <div className="num">300</div>
              <div className="desc">автоматизированных производственных машин</div>
            </div>
            <div className="stat">
              <div className="num">100 млн</div>
              <div className="desc">единиц продукции выпускается в год</div>
            </div>
          </div>
        </section>

        <section className="section" id="countries">
          <h2>Страны‑представители</h2>
          <div className="card">
            <p className="lead">
              Прямые представительства: Россия,
              <a 
                href="https://demexgrout.com/?srsltid=AfmBOorv9Zb67N3kIn9lmhy0VPbuig8kFzD7QUqayyEtepGg5egQlGTi" 
                target="_blank" 
                rel="noopener" 
                style={{color: 'var(--accent)', textDecoration: 'none'}}
              >
                США
              </a>
              и
              <a 
                href="https://demex.vn/" 
                target="_blank" 
                rel="noopener" 
                style={{color: 'var(--accent)', textDecoration: 'none'}}
              >
                Вьетнам
              </a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
