/**
 * Arch Bureau Brutalism Theme - Main JavaScript
 */

(function() {
    'use strict';

    // Progress Bar
    function initProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        function updateProgressBar() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollableHeight = documentHeight - windowHeight;
            const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgressBar);
        updateProgressBar();
    }

    // Scroll to Top Button
    function initScrollToTop() {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (!scrollToTopBtn) return;

        function toggleVisibility() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }

        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        window.addEventListener('scroll', toggleVisibility);
        toggleVisibility();
    }

    // Header Scroll Effect
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        function handleScroll() {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    // Mobile Menu Toggle
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const nav = document.getElementById('mainNav');
        
        if (!menuToggle || !nav) return;

        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('open');
            nav.classList.toggle('open');
        });

        // Close menu when clicking on a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('open');
                nav.classList.remove('open');
            });
        });
    }

    // Animated Numbers
    function initAnimatedNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number[data-value]');
        if (statNumbers.length === 0) return;

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    animateNumber(entry.target);
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        statNumbers.forEach(function(element) {
            observer.observe(element);
        });
    }

    function animateNumber(element) {
        const targetValue = parseInt(element.getAttribute('data-value'));
        const suffix = element.textContent.match(/[^0-9]+$/)?.[0] || '';
        const duration = 2000;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    // Intersection Observer for fade-in animations
    function initFadeInAnimations() {
        const elements = document.querySelectorAll('.project-item, .service-item, .team-member, .blog-post');
        if (elements.length === 0) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        elements.forEach(function(element) {
            observer.observe(element);
        });
    }

    // Contact Form Handling
    function initContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const formSuccess = document.getElementById('formSuccess');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'ОТПРАВКА...';
            }

            // Simulate form submission (replace with actual AJAX call)
            setTimeout(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'ОТПРАВИТЬ';
                }
                if (formSuccess) {
                    formSuccess.style.display = 'block';
                    contactForm.reset();
                    setTimeout(function() {
                        formSuccess.style.display = 'none';
                    }, 5000);
                }
            }, 1500);
        });
    }

    // Initialize all functions when DOM is ready
    function init() {
        initProgressBar();
        initScrollToTop();
        initHeaderScroll();
        initMobileMenu();
        initAnimatedNumbers();
        initFadeInAnimations();
        initContactForm();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

