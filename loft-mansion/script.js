// ============================================
// Navigation
// ============================================
const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Close menu on link click
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
});

// ============================================
// Smooth Scroll
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// Particles Animation
// ============================================
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;
    const colors = ['#F97316', '#FF6B6B', '#FF8C69', '#FB923C'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

createParticles();

// ============================================
// Scroll Animations
// ============================================
function animateOnScroll() {
    const elements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}

animateOnScroll();

// ============================================
// Calendar
// ============================================
class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = this.loadEvents();
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            });
        }
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[month]} ${year}`;
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Clear calendar
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';

        // Day names
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'calendar-day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const dayEl = this.createDayElement(day, true, year, month - 1);
            calendarGrid.appendChild(dayEl);
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const hasEvent = this.hasEvent(date);
            const dayEl = this.createDayElement(day, false, year, month, isToday, hasEvent);
            calendarGrid.appendChild(dayEl);
        }

        // Next month days (to fill the grid)
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = this.createDayElement(day, true, year, month + 1);
            calendarGrid.appendChild(dayEl);
        }
    }

    createDayElement(day, isOtherMonth, year, month, isToday = false, hasEvent = false) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;

        if (isOtherMonth) {
            dayEl.classList.add('other-month');
        }

        if (isToday) {
            dayEl.classList.add('today');
        }

        if (hasEvent) {
            dayEl.classList.add('has-event');
            // Помечаем даты с событиями как занятые
            dayEl.classList.add('booked');
            dayEl.title = 'Дата занята';
        }

        if (!isOtherMonth && !hasEvent) {
            dayEl.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.calendar-day.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Add selection to clicked day
                dayEl.classList.add('selected');
                this.selectedDate = new Date(year, month, day);
                
                // Update booking form date
                const bookingDateInput = document.getElementById('date');
                if (bookingDateInput) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    bookingDateInput.value = dateStr;
                }
            });
        }

        return dayEl;
    }

    hasEvent(date) {
        return this.events.some(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    loadEvents() {
        // Sample events - в реальном проекте загружать из API или WordPress
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        return [
            {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
                title: 'DJ Night: Deep House',
                description: 'Вечеринка с топовыми диджеями. Deep house, techno, progressive. Бар и танцпол.',
                time: '22:00',
                type: 'party',
                guests: 150,
                price: 'от 1500₽'
            },
            {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
                title: 'Живой концерт',
                description: 'Выступление популярных артистов. Акустика и электроника. Ограниченное количество мест.',
                time: '20:00',
                type: 'concert',
                guests: 100,
                price: 'от 2000₽'
            },
            {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
                title: 'Корпоративное мероприятие',
                description: 'Пространство для корпоративов. Полное техническое оснащение, кейтеринг, парковка.',
                time: '18:00',
                type: 'corporate',
                guests: 200,
                price: 'по запросу'
            },
            {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18),
                title: 'Свадебная вечеринка',
                description: 'Эксклюзивное пространство для свадебных торжеств. Романтическая атмосфера и полный сервис.',
                time: '17:00',
                type: 'wedding',
                guests: 120,
                price: 'по запросу'
            },
            {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25),
                title: 'День рождения VIP',
                description: 'Премиум формат празднования. Индивидуальный подход, эксклюзивное меню.',
                time: '19:00',
                type: 'birthday',
                guests: 80,
                price: 'по запросу'
            }
        ];
    }
}

// Initialize calendar
const calendar = new Calendar('calendarGrid');

// ============================================
// Events Display
// ============================================
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    const events = calendar.events;
    
    if (events.length === 0) {
        eventsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Скоро здесь появятся мероприятия</p>';
        return;
    }

    eventsGrid.innerHTML = events.map(event => {
        const date = new Date(event.date);
        const day = date.getDate();
        const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const month = monthNames[date.getMonth()];
        const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const weekday = weekdayNames[date.getDay()];
        
        // Вычисляем дни до события
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        const typeLabels = {
            'party': 'Вечеринка',
            'concert': 'Концерт',
            'corporate': 'Корпоратив',
            'wedding': 'Свадьба',
            'birthday': 'День рождения',
            'other': 'Событие'
        };
        
        return `
            <div class="event-card" data-animate="fade-up">
                <div class="event-type-badge">${typeLabels[event.type] || 'Событие'}</div>
                <div class="event-header">
                    <span class="event-date">${day} ${month} <span class="event-weekday">${weekday}</span></span>
                    ${daysUntil >= 0 ? `<span class="event-countdown">Через ${daysUntil} ${daysUntil === 1 ? 'день' : daysUntil < 5 ? 'дня' : 'дней'}</span>` : ''}
                </div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <div class="event-meta">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${event.time}
                    </span>
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        ${event.guests || 0} гостей
                    </span>
                    <span class="event-price">${event.price || 'по запросу'}</span>
                </div>
            </div>
        `;
    }).join('');

    // Re-initialize scroll animations for new elements
    setTimeout(() => {
        animateOnScroll();
    }, 100);
}

renderEvents();

// ============================================
// Booking Form
// ============================================
const bookingForm = document.getElementById('bookingForm');
const bookingModal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');

if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(bookingForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date'),
            time: formData.get('time'),
            guests: formData.get('guests'),
            eventType: formData.get('eventType'),
            message: formData.get('message')
        };

        // В реальном проекте здесь будет отправка на сервер WordPress
        console.log('Booking data:', data);
        
        // Показываем модальное окно
        if (bookingModal) {
            bookingModal.classList.add('active');
        }

        // Очищаем форму
        bookingForm.reset();
    });
}

if (modalClose) {
    modalClose.addEventListener('click', () => {
        if (bookingModal) {
            bookingModal.classList.remove('active');
        }
    });
}

if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('active');
        }
    });
}

// Set minimum date to today
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// ============================================
// Parallax Effect
// ============================================
function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - scrolled / 500;
        }
    });
}

initParallax();

// ============================================
// Cursor Effect (Optional Enhancement)
// ============================================
function initCursorEffect() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid var(--accent-pink);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
        display: none;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
        cursor.style.display = 'block';
    });

    // Hide cursor on mobile
    if (window.innerWidth < 968) {
        cursor.style.display = 'none';
    }
}

// Uncomment to enable custom cursor
// initCursorEffect();

// ============================================
// Performance Optimization
// ============================================
// Throttle function for scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize scroll listeners
const optimizedScrollHandler = throttle(() => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// ============================================
// WordPress Integration Helper
// ============================================
// Функции для интеграции с WordPress (можно использовать через AJAX или REST API)

function submitBookingToWordPress(data) {
    // Пример интеграции с WordPress REST API
    /*
    fetch('/wp-json/wp/v2/bookings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': wpApiSettings.nonce // WordPress nonce
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Booking submitted:', data);
        // Показать модальное окно успеха
    })
    .catch(error => {
        console.error('Error:', error);
        // Показать ошибку
    });
    */
}

function loadEventsFromWordPress() {
    // Пример загрузки событий из WordPress
    /*
    fetch('/wp-json/wp/v2/events?per_page=10')
        .then(response => response.json())
        .then(events => {
            calendar.events = events.map(event => ({
                date: new Date(event.date),
                title: event.title.rendered,
                description: event.excerpt.rendered,
                time: event.meta.time,
                type: event.meta.event_type
            }));
            calendar.render();
            renderEvents();
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
    */
}

// ============================================
// FAQ Accordion
// ============================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// ============================================
// Scroll to Top Button
// ============================================
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// Active Navigation Link on Scroll
// ============================================
function initActiveNav() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ============================================
// Form Validation & Price Calculator
// ============================================
function initFormEnhancements() {
    const bookingForm = document.getElementById('bookingForm');
    const guestsInput = document.getElementById('guests');
    const dateInput = document.getElementById('date');
    
    if (!bookingForm || !guestsInput) return;
    
    const priceDisplay = document.createElement('div');
    priceDisplay.className = 'price-display';
    priceDisplay.style.cssText = 'margin-top: 1rem; padding: 1rem; background: var(--surface); border-radius: var(--radius-sm); border: 1px solid rgba(204, 85, 85, 0.2);';
    
    // Insert price display after guests input
    guestsInput.parentElement.appendChild(priceDisplay);
    
    function calculatePrice() {
        const guests = parseInt(guestsInput.value) || 0;
        const eventType = document.getElementById('eventType').value;
        
        if (guests === 0) {
            priceDisplay.innerHTML = '<span style="color: var(--text-tertiary);">Введите количество гостей для расчета стоимости</span>';
            return;
        }
        
        // Базовая стоимость
        let basePrice = 50000;
        let pricePerGuest = 0;
        
        // Множители по типу мероприятия
        const multipliers = {
            'party': 1.0,
            'concert': 1.2,
            'corporate': 1.5,
            'wedding': 2.0,
            'birthday': 1.3,
            'other': 1.0
        };
        
        const multiplier = multipliers[eventType] || 1.0;
        
        if (guests > 100) {
            pricePerGuest = 400;
        } else if (guests > 50) {
            pricePerGuest = 500;
        } else {
            pricePerGuest = 600;
        }
        
        const totalPrice = Math.round(basePrice * multiplier + guests * pricePerGuest);
        
        priceDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary);">Примерная стоимость:</span>
                <strong style="color: var(--accent-orange-light); font-size: 1.2rem;">${totalPrice.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-tertiary);">
                * Точная стоимость будет рассчитана после подтверждения даты
            </div>
        `;
    }
    
    guestsInput.addEventListener('input', calculatePrice);
    document.getElementById('eventType').addEventListener('change', calculatePrice);
    
    // Real-time validation
    const inputs = bookingForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value) {
                this.style.borderColor = 'var(--accent-orange)';
            } else {
                this.style.borderColor = '';
            }
        });
    });
}

// ============================================
// Gallery Lightbox
// ============================================
function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-scroll .gallery-item');
    const galleryImages = document.querySelectorAll('.gallery-scroll .gallery-image-wrapper img');
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <button class="lightbox-prev" aria-label="Предыдущее">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
        <button class="lightbox-next" aria-label="Следующее">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
        <div class="lightbox-content">
            <img src="" alt="" class="lightbox-image">
            <div class="lightbox-info">
                <h3 class="lightbox-title"></h3>
                <p class="lightbox-description"></p>
            </div>
        </div>
    `;
    document.body.appendChild(lightbox);
    
    let currentIndex = 0;
    const images = Array.from(galleryImages);
    
    function openLightbox(index) {
        currentIndex = index;
        const img = images[index];
        const item = img.closest('.gallery-item');
        const info = item.querySelector('.gallery-info');
        
        lightbox.querySelector('.lightbox-image').src = img.src;
        lightbox.querySelector('.lightbox-image').alt = img.alt;
        lightbox.querySelector('.lightbox-title').textContent = info ? info.querySelector('h3').textContent : '';
        lightbox.querySelector('.lightbox-description').textContent = info ? info.querySelector('p').textContent : '';
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function nextImage() {
        currentIndex = (currentIndex + 1) % images.length;
        openLightbox(currentIndex);
    }
    
    function prevImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        openLightbox(currentIndex);
    }
    
    // Event listeners
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });
    
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-next').addEventListener('click', nextImage);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', prevImage);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
}

// ============================================
// Animated Counter for Stats
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                counter.classList.add('counted');
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, {
        threshold: 0.5
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// ============================================
// Gallery Parallax Effect
// ============================================
function initGalleryParallax() {
    const galleryItems = document.querySelectorAll('.gallery-scroll .gallery-item');
    
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (!img) return;
        
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) / 15;
            const moveY = (y - centerY) / 15;
            
            img.style.transform = `scale(1.15) translate(${moveX}px, ${moveY}px)`;
        });
        
        item.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1) translate(0, 0)';
        });
    });
}

// ============================================
// Gallery Smooth Scroll Enhancement
// ============================================
function initGalleryScroll() {
    const galleryScroll = document.getElementById('galleryScroll');
    if (!galleryScroll) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    
    galleryScroll.addEventListener('mousedown', (e) => {
        isDown = true;
        galleryScroll.style.cursor = 'grabbing';
        startX = e.pageX - galleryScroll.offsetLeft;
        scrollLeft = galleryScroll.scrollLeft;
    });
    
    galleryScroll.addEventListener('mouseleave', () => {
        isDown = false;
        galleryScroll.style.cursor = 'grab';
    });
    
    galleryScroll.addEventListener('mouseup', () => {
        isDown = false;
        galleryScroll.style.cursor = 'grab';
    });
    
    galleryScroll.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - galleryScroll.offsetLeft;
        const walk = (x - startX) * 2;
        galleryScroll.scrollLeft = scrollLeft - walk;
    });
    
    // Touch support for mobile
    let touchStartX = 0;
    let touchScrollLeft = 0;
    
    galleryScroll.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].pageX - galleryScroll.offsetLeft;
        touchScrollLeft = galleryScroll.scrollLeft;
    });
    
    galleryScroll.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX - galleryScroll.offsetLeft;
        const walk = (x - touchStartX) * 2;
        galleryScroll.scrollLeft = touchScrollLeft - walk;
    });
}

// ============================================
// Initialize on DOM Load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loft Mansion website loaded');
    
    initFAQ();
    initScrollTop();
    initActiveNav();
    initFormEnhancements();
    initGalleryLightbox();
    animateCounters();
    initGalleryParallax();
    initGalleryScroll();
});

