/* =============================================
   SCROLL — Intersection Observer animations
   ============================================= */

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in class to animatable elements
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll(
        '.about-card, .timeline-item, .skill-category, .project-card, .education-card, .cert-card'
    );
    animateElements.forEach((el, i) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${i * 0.08}s`;
        observer.observe(el);
    });

    // Trigger counter animation on hero visibility
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                window.animateCounters();
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    heroObserver.observe(document.querySelector('.hero-stats'));
});
