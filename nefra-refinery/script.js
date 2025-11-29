// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Parallax effect
function initParallax() {
    if (prefersReducedMotion) return;

    const parallaxElements = document.querySelectorAll('.parallax-element');

    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        parallaxElements.forEach((element, index) => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    }

    window.addEventListener('scroll', updateParallax);
}

// Smooth scrolling for navigation links
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav

                window.scrollTo({
                    top: offsetTop,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            }
        });
    });
}

// Animate numbers on scroll
function animateNumbers() {
    if (prefersReducedMotion) {
        // Just set final values for reduced motion
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseFloat(stat.dataset.count);
            stat.textContent = target.toLocaleString();
        });
        return;
    }

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const target = parseFloat(statNumber.dataset.count);
                animateCounter(statNumber, target);
                observer.unobserve(statNumber);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-number').forEach(stat => {
        observer.observe(stat);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const start = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = startValue + (target - startValue) * easeOutQuart;

        element.textContent = current.toFixed(target % 1 === 0 ? 0 : 1);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}

// Intersection Observer for fade-in animations
function initScrollAnimations() {
    if (prefersReducedMotion) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.about-card, .tech-item, .process-step, .metric-card, .contact-item');
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.contains('nav-menu-open');

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target) &&
            navMenu.classList.contains('nav-menu-open')) {
            closeMobileMenu();
        }
    });

    function openMobileMenu() {
        navMenu.classList.add('nav-menu-open');
        navToggle.classList.add('nav-toggle-open');
        body.classList.add('menu-open');

        // Animate toggle button
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    }

    function closeMobileMenu() {
        navMenu.classList.remove('nav-menu-open');
        navToggle.classList.remove('nav-toggle-open');
        body.classList.remove('menu-open');

        // Reset toggle button
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

// Add CSS for menu open state and animations
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .nav-menu-open {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            padding: 20px;
            animation: slideDown 0.3s ease-out;
        }

        .nav-toggle-open span {
            background: #0066cc;
        }

        .menu-open {
            overflow: hidden;
        }

        .animate-in {
            animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Hover effects for interactive elements */
        .about-card:hover .card-icon {
            transform: scale(1.1);
            transition: transform 0.3s ease;
        }

        .tech-item:hover .tech-number {
            color: #3385dd;
            transition: color 0.3s ease;
        }

        .process-step:hover .step-number {
            transform: scale(1.1);
            transition: transform 0.3s ease;
        }

        .metric-card:hover .metric-value {
            transform: scale(1.05);
            transition: transform 0.3s ease;
        }

        /* Form enhancements */
        .contact-form button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 102, 204, 0.3);
        }

        .contact-form button:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// Form handling
function initContactForm() {
    const form = document.querySelector('.contact-form form');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Simple form validation
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ff6b35';
                isValid = false;
            } else {
                input.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }
        });

        if (isValid) {
            // Simulate form submission
            const button = form.querySelector('button');
            const originalText = button.textContent;

            button.textContent = 'Отправка...';
            button.disabled = true;

            setTimeout(() => {
                button.textContent = 'Отправлено!';
                button.style.background = '#00a67e';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.background = '';
                    form.reset();
                }, 2000);
            }, 1500);
        }
    });
}

// Performance optimization: throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addDynamicStyles();
    initParallax();
    initSmoothScroll();
    animateNumbers();
    initScrollAnimations();
    initMobileMenu();
    initContactForm();

    // Add loading class removal for initial animations
    document.body.classList.add('loaded');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause animations when page is not visible
        document.body.classList.add('page-hidden');
    } else {
        // Resume animations when page becomes visible
        document.body.classList.remove('page-hidden');
    }
});

// Add resize listener for responsive adjustments
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Re-initialize parallax on resize if needed
        if (!prefersReducedMotion) {
            initParallax();
        }
    }, 250);
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close mobile menu with Escape key
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');

        if (navMenu && navMenu.classList.contains('nav-menu-open')) {
            navMenu.classList.remove('nav-menu-open');
            navToggle.classList.remove('nav-toggle-open');
            document.body.classList.remove('menu-open');
        }
    }
});
