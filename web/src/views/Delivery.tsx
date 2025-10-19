import React, { useState } from 'react';
import './Delivery.css';

const Delivery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'payment'>('delivery');

  return (
    <div className="t-delivery-page">
      <div className="container">
        <h1 className="page-title">Доставка и оплата</h1>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            Доставка
          </button>
          <button 
            className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Оплата
          </button>
        </div>

        {activeTab === 'delivery' && (
          <>
            {/* Самовывоз */}
            <section className="card">
              <div>
                <h2>Самовывоз</h2>
                <p className="text">
                  Все товары вы можете забрать самостоятельно с нашего склада по адресу: 
                  <b>г. Москва, внут.тер.г. муниципальный округ Лефортово, ул. Золоторожский вал, д. 11 стр. 22, помещ. 373</b>. 
                  Время готовности и детали уточняйте у менеджера.
                </p>
                <ul className="list muted">
                  <li>Быстрая выдача заказа</li>
                </ul>
                <div className="row">
                  <span className="chip"><span className="dot"></span> Пн–Вс: с 09:00 до 20:00</span>
                  <span className="chip chip--accent">Бесплатно</span>
                </div>
              </div>

              <div className="media">
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=37.704826%2C55.749917&z=16&pt=37.704826,55.749917,pm2gnm"
                  style={{border: 0, width: '100%', height: '100%', display: 'block'}}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <a className="map-button" href="https://yandex.ru/maps/-/CLFtmBoS" target="_blank" rel="noopener">
                  Открыть в Яндекс Картах
                </a>
              </div>
            </section>

            {/* Москва и МО */}
            <section className="card">
              <div>
                <h2>Доставка по Москве и МО</h2>
                <p className="text">Мы бесплатно доставляем заказы по Москве и за пределами МКАД. Стоимость за МКАД рассчитывается индивидуально. Дату и время согласуем по телефону.</p>
                <div className="row">
                  <span className="chip"><span className="dot"></span> Пн–Вс: с 09:00 до 20:00</span>
                  <span className="chip chip--accent">Бесплатно в пределах МКАД</span>
                  <span className="chip">Рассчитывается индивидуально</span>
                </div>
              </div>
              <a className="media" aria-label="Грузовик">
                <img src="https://i.pinimg.com/1200x/6c/a8/02/6ca80277c4de3949cbf863858c08873c.jpg" alt="Доставка грузовиком" />
              </a>
            </section>

            <div className="divider"></div>

            {/* По России */}
            <section className="card">
              <div>
                <h2>Доставка по России</h2>
                <p className="text">Организуем доставку по всей России транспортными компаниями, которые выбираете вы или мы порекомендуем оптимальный вариант.</p>
                <div className="row">
                  <span className="chip"><span className="dot"></span> Пн–Вс: с 09:00 до 18:00</span>
                  <span className="chip">По тарифам перевозчика</span>
                  <span className="chip">СДЭК</span>
                  <span className="chip">ПЭК</span>
                </div>
                <p className="foot">Выбор доставки осуществляется при оформлении заказа в корзине или через персонального менеджера.</p>
              </div>
              <a className="media" aria-label="Карта России">
                <img src="https://i.pinimg.com/1200x/b0/09/a8/b009a8d18d60ec0c29e85501ef6d16ba.jpg" alt="Карта России" />
              </a>
            </section>

            <div className="divider"></div>
          </>
        )}

        {activeTab === 'payment' && (
          <>
            {/* Оплата наличными */}
            <section className="card">
              <div>
                <h2>Оплата наличными</h2>
                <p className="text">
                  Вы можете оплатить заказ наличными курьеру при его получении или в пункте самовывоза. При получении товара обязательно проверьте комплектацию заказа, наличие чека.
                </p>
                <p className="text">
                  Так же можно совершить перевод с карты на карту через систему быстрых переводов.
                </p>
                <div className="row">
                  <span className="chip chip--accent">Без комиссии</span>
                  <span className="chip"><span className="dot"></span> При получении</span>
                  <span className="chip"><span className="dot"></span> В пункте самовывоза</span>
                </div>
              </div>
              <a className="media" aria-label="Наличные деньги">
                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Наличные деньги" />
              </a>
            </section>

            <div className="divider"></div>

            {/* Онлайн оплата */}
            <section className="card">
              <div>
                <h2>Онлайн на сайте</h2>
                <p className="text">
                  Оплата банковскими картами осуществляется через АО «Т-Банк». К оплате принимаются карты VISA, MasterCard, МИР.
                </p>
                <div className="row">
                  <span className="chip"><span className="dot"></span> VISA</span>
                  <span className="chip"><span className="dot"></span> MasterCard</span>
                  <span className="chip"><span className="dot"></span> МИР</span>
                  <span className="chip chip--accent">Безопасно</span>
                </div>
                <p className="foot">Все платежи защищены современными системами шифрования.</p>
              </div>
              <a className="media" aria-label="Банковские карты">
                <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Банковские карты" />
              </a>
            </section>

            <div className="divider"></div>

            {/* Безналичный расчет */}
            <section className="card">
              <div>
                <h2>Безналичный расчет</h2>
                <p className="text">
                  Для юридических лиц и ИП доступна оплата по безналичному расчету. Мы работаем с НДС и без НДС.
                </p>
                <div className="row">
                  <span className="chip"><span className="dot"></span> С НДС</span>
                  <span className="chip"><span className="dot"></span> Без НДС</span>
                  <span className="chip chip--accent">Для юр. лиц</span>
                </div>
                <p className="foot">Документы для оплаты высылаются на email после оформления заказа.</p>
              </div>
              <a className="media" aria-label="Документы">
                <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Документы" />
              </a>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Delivery;

