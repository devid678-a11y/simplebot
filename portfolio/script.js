// Navigation scroll effect
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth scroll for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link on scroll
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Animate stats counter
const animateCounter = (element, target) => {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const suffix = element.getAttribute('data-suffix') || '';

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current) + suffix;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + suffix;
        }
    };

    updateCounter();
};

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');

            // Animate stats
            if (entry.target.classList.contains('about')) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    animateCounter(stat, target);
                });
            }

            // Animate skill bars
            if (entry.target.classList.contains('skills')) {
                const skillBars = entry.target.querySelectorAll('.skill-progress');
                skillBars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    setTimeout(() => {
                        bar.style.width = `${width}%`;
                    }, 200);
                });
            }
        }
    });
}, observerOptions);

// Observe sections
sections.forEach(section => {
    observer.observe(section);
});

// Project cards hover effect
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Contact form handling
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Here you would typically send the data to a server
    console.log('Form submitted:', data);
    
    // Show success message
    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span>Отправлено! ✓</span>';
    submitBtn.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
    
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        contactForm.reset();
    }, 3000);
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const shapes = document.querySelectorAll('.shape');
    
    if (hero) {
        shapes.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            shape.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }
});

// Add fade-in animation to elements on scroll
const fadeElements = document.querySelectorAll('.project-card, .skill-item, .feature-item');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(element);
});

// Cursor effect (optional, can be removed if not needed)
let cursor = null;

if (window.innerWidth > 768) {
    cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid rgba(102, 126, 234, 0.5);
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

    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.borderColor = 'rgba(102, 126, 234, 1)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.borderColor = 'rgba(102, 126, 234, 0.5)';
        });
    });
}

// Initialize animations on load
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    
    // Animate hero elements
    const heroTitle = document.querySelector('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const heroButtons = document.querySelector('.hero-buttons');
    
    if (heroTitle) {
        setTimeout(() => heroTitle.style.opacity = '1', 100);
    }
    if (heroDescription) {
        setTimeout(() => heroDescription.style.opacity = '1', 300);
    }
    if (heroButtons) {
        setTimeout(() => heroButtons.style.opacity = '1', 500);
    }
});

// Add typing effect to hero title (optional enhancement)
const typingEffect = (element, text, speed = 100) => {
    let i = 0;
    element.textContent = '';
    
    const type = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };
    
    type();
};

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
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

// Apply debounce to scroll handlers
const debouncedScroll = debounce(() => {
    // Scroll handlers here
}, 10);

window.addEventListener('scroll', debouncedScroll);

// Project Filters
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Project Modal
const projectModal = document.getElementById('projectModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const viewProjectButtons = document.querySelectorAll('.view-project');

const projectData = {
    1: {
        image: 'https://i.pinimg.com/736x/8a/7b/8f/8a7b8f8c9d4e5f6a7b8c9d0e1f2a3b4.jpg',
        title: 'E-Commerce Platform',
        category: 'Web Application',
        description: 'Современная платформа для электронной коммерции с интуитивным интерфейсом и мощной системой управления заказами. Реализована система рекомендаций на основе машинного обучения, интеграция с платежными системами и аналитика продаж в реальном времени.',
        tags: ['React', 'Node.js', 'MongoDB', 'Stripe', 'ML'],
        demo: '#',
        code: '#'
    },
    2: {
        image: 'https://i.pinimg.com/736x/5b/3c/9a/5b3c9a8f7e6d5c4b3a2f1e0d9c8b7a6.jpg',
        title: 'Brand Identity',
        category: 'UI/UX Design',
        description: 'Полный редизайн бренда с созданием уникальной визуальной идентичности и системы дизайна. Разработана комплексная система компонентов, руководство по стилю и анимации для обеспечения консистентности во всех точках контакта с брендом.',
        tags: ['Figma', 'Design System', 'Branding', 'Animation'],
        demo: '#',
        code: '#'
    },
    3: {
        image: 'https://i.pinimg.com/736x/3d/4e/5f/3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.jpg',
        title: 'Fitness Tracker',
        category: 'Mobile App',
        description: 'Мобильное приложение для отслеживания тренировок с интеграцией носимых устройств и аналитикой прогресса. Включает персонализированные планы тренировок, социальные функции и интеграцию с популярными фитнес-платформами.',
        tags: ['React Native', 'Firebase', 'API', 'HealthKit'],
        demo: '#',
        code: '#'
    },
    4: {
        image: 'https://i.pinimg.com/736x/7e/8f/9a/7e8f9a1b2c3d4e5f6a7b8c9d0e1f2a3.jpg',
        title: 'Dashboard Analytics',
        category: 'Web Application',
        description: 'Интерактивная панель аналитики с реальным временем обновления данных и настраиваемыми виджетами. Поддержка множественных источников данных, экспорт отчетов и настраиваемые дашборды для различных ролей пользователей.',
        tags: ['Vue.js', 'D3.js', 'WebSocket', 'Chart.js'],
        demo: '#',
        code: '#'
    },
    5: {
        image: 'https://i.pinimg.com/736x/9a/1b/2c/9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5.jpg',
        title: 'Creative Agency',
        category: 'Landing Page',
        description: 'Современный лендинг для креативного агентства с анимациями и интерактивными элементами. Полностью адаптивный дизайн, оптимизированный для конверсии с интеграцией форм обратной связи и аналитики.',
        tags: ['HTML5', 'CSS3', 'GSAP', 'AOS'],
        demo: '#',
        code: '#'
    },
    6: {
        image: 'https://i.pinimg.com/736x/2c/3d/4e/2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.jpg',
        title: 'Project Management',
        category: 'SaaS Platform',
        description: 'Комплексная платформа для управления проектами с командной работой и интеграцией с популярными сервисами. Включает управление задачами, временем, ресурсами, отчетность и интеграции с Slack, GitHub, Jira.',
        tags: ['Next.js', 'PostgreSQL', 'Stripe', 'WebSocket'],
        demo: '#',
        code: '#'
    }
};

function openModal(projectId) {
    const project = projectData[projectId];
    if (!project) return;
    
    modalBody.innerHTML = `
        <img src="${project.image}" alt="${project.title}" class="modal-image">
        <span class="modal-category">${project.category}</span>
        <h2 class="modal-title">${project.title}</h2>
        <p class="modal-description">${project.description}</p>
        <div class="modal-tags">
            ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="modal-links">
            <a href="${project.demo}" class="modal-link" target="_blank">Посмотреть демо</a>
            <a href="${project.code}" class="modal-link" target="_blank">Исходный код</a>
        </div>
    `;
    
    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    projectModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (viewProjectButtons.length > 0 && projectModal && modalBody && modalClose) {
    viewProjectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = button.getAttribute('data-project');
            openModal(projectId);
        });
    });

    modalClose.addEventListener('click', closeModal);
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal || e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Testimonials Carousel
const testimonialsWrapper = document.getElementById('testimonialsWrapper');
const testimonialsPrev = document.getElementById('testimonialsPrev');
const testimonialsNext = document.getElementById('testimonialsNext');
let currentTestimonial = 0;
const testimonialCards = document.querySelectorAll('.testimonial-card');
const totalTestimonials = testimonialCards.length;

if (testimonialsWrapper && testimonialsPrev && testimonialsNext && totalTestimonials > 0) {
    function showTestimonial(index) {
        testimonialsWrapper.style.transform = `translateX(-${index * 100}%)`;
    }

    testimonialsPrev.addEventListener('click', () => {
        currentTestimonial = (currentTestimonial - 1 + totalTestimonials) % totalTestimonials;
        showTestimonial(currentTestimonial);
    });

    testimonialsNext.addEventListener('click', () => {
        currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
        showTestimonial(currentTestimonial);
    });

    // Auto-rotate testimonials
    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
        showTestimonial(currentTestimonial);
    }, 5000);
}

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Language Toggle
const langToggle = document.getElementById('langToggle');
let currentLang = localStorage.getItem('language') || 'ru';

const translations = {
    ru: {
        'nav.about': 'О себе',
        'nav.projects': 'Проекты',
        'nav.skills': 'Навыки',
        'nav.contact': 'Контакты',
        'experience.label': 'Опыт работы',
        'experience.title': 'Профессиональный путь',
        'projects.label': 'Портфолио',
        'projects.title': 'Избранные проекты',
        'projects.filter.all': 'Все',
        'projects.filter.web': 'Web',
        'projects.filter.design': 'Design',
        'projects.filter.mobile': 'Mobile',
        'projects.view': 'Посмотреть',
        'projects.code': 'Код',
        'testimonials.label': 'Отзывы',
        'testimonials.title': 'Что говорят клиенты',
        'education.label': 'Образование',
        'education.title': 'Образование и сертификаты',
        'blog.label': 'Блог',
        'blog.title': 'Последние статьи',
        'blog.readMore': 'Читать далее →'
    },
    en: {
        'nav.about': 'About',
        'nav.projects': 'Projects',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'experience.label': 'Experience',
        'experience.title': 'Professional Journey',
        'projects.label': 'Portfolio',
        'projects.title': 'Featured Projects',
        'projects.filter.all': 'All',
        'projects.filter.web': 'Web',
        'projects.filter.design': 'Design',
        'projects.filter.mobile': 'Mobile',
        'projects.view': 'View',
        'projects.code': 'Code',
        'testimonials.label': 'Testimonials',
        'testimonials.title': 'What Clients Say',
        'education.label': 'Education',
        'education.title': 'Education & Certificates',
        'blog.label': 'Blog',
        'blog.title': 'Latest Articles',
        'blog.readMore': 'Read more →'
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    if (langToggle) {
        const langText = langToggle.querySelector('.lang-text');
        if (langText) {
            langText.textContent = lang.toUpperCase();
        }
    }
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

if (langToggle) {
    langToggle.addEventListener('click', () => {
        const newLang = currentLang === 'ru' ? 'en' : 'ru';
        changeLanguage(newLang);
    });

    // Initialize language
    changeLanguage(currentLang);
}

