// Team Carousel
const teamCarousel = document.getElementById('teamCarousel');
const teamPrev = document.getElementById('teamPrev');
const teamNext = document.getElementById('teamNext');

if (teamCarousel && teamPrev && teamNext) {
    let scrollPosition = 0;
    const scrollAmount = 310; // card width + gap

    teamPrev.addEventListener('click', () => {
        scrollPosition = Math.max(0, scrollPosition - scrollAmount);
        teamCarousel.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    });

    teamNext.addEventListener('click', () => {
        const maxScroll = teamCarousel.scrollWidth - teamCarousel.clientWidth;
        scrollPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
        teamCarousel.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    });
}

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Apply button handler
const applyButton = document.querySelector('.btn-apply');
if (applyButton) {
    applyButton.addEventListener('click', () => {
        alert('Форма заявки будет открыта');
        // Здесь можно добавить модальное окно с формой
    });
}

// Card action buttons
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        if (this.textContent === 'ЗАПИСАТЬСЯ') {
            e.preventDefault();
            alert('Форма записи будет открыта');
            // Здесь можно добавить модальное окно с формой записи
        } else if (this.textContent === 'ПОДРОБНЕЕ') {
            e.preventDefault();
            alert('Подробная информация будет показана');
            // Здесь можно добавить модальное окно с подробной информацией
        }
    });
});

// Certificate form
const certificateForm = document.querySelector('.certificate-form');
if (certificateForm) {
    certificateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = certificateForm.querySelector('.certificate-input').value;
        if (name) {
            alert(`Сертификат будет оформлен на имя: ${name}`);
            certificateForm.reset();
        } else {
            alert('Пожалуйста, введите имя');
        }
    });
}

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.backgroundColor = 'rgba(26, 26, 26, 0.98)';
    } else {
        header.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
    }
    
    lastScroll = currentScroll;
});

