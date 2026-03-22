/* =============================================
   PAGE TRANSITIONS — Smooth scroll-driven
   animations with split-text reveals
   ============================================= */

(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ─── Split text into animated spans ───
    function splitText(element) {
        const text = element.textContent;
        element.innerHTML = '';
        element.setAttribute('aria-label', text);

        const words = text.split(' ');
        words.forEach((word, wi) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'split-word';
            wordSpan.style.display = 'inline-block';

            [...word].forEach((char, ci) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'split-char';
                charSpan.textContent = char;
                charSpan.style.display = 'inline-block';
                charSpan.style.transitionDelay = `${(wi * 4 + ci) * 30}ms`;
                wordSpan.appendChild(charSpan);
            });

            element.appendChild(wordSpan);
            // Add space between words
            if (wi < words.length - 1) {
                const space = document.createTextNode(' ');
                element.appendChild(space);
            }
        });

        element.classList.add('split-ready');
    }

    // ─── Apply to hero name and section titles ───
    const heroName = document.querySelector('.hero-name');
    if (heroName) splitText(heroName);

    // ─── Parallax layers ───
    const parallaxElements = [];

    function setupParallax() {
        document.querySelectorAll('.section-banner img').forEach(img => {
            parallaxElements.push({ el: img, speed: 0.3, type: 'translate' });
        });
        document.querySelectorAll('.hero-bg-shapes .shape').forEach(shape => {
            parallaxElements.push({ el: shape, speed: 0.15 + Math.random() * 0.2, type: 'translate' });
        });
    }

    // ─── Scroll-driven section transitions ───
    const sections = document.querySelectorAll('.section');

    function createSectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const section = entry.target;
                const ratio = entry.intersectionRatio;

                if (entry.isIntersecting) {
                    section.classList.add('section-visible');

                    // Stagger children
                    const children = section.querySelectorAll('.about-card, .timeline-item, .skill-category, .project-card, .education-card, .cert-card, h2, .section-banner');
                    children.forEach((child, i) => {
                        child.style.transitionDelay = `${i * 80}ms`;
                        child.classList.add('child-visible');
                    });
                }
            });
        }, {
            threshold: [0, 0.1, 0.2, 0.3],
            rootMargin: '0px 0px -50px 0px'
        });

        sections.forEach(s => observer.observe(s));
    }

    // ─── Smooth parallax on scroll ───
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;

                parallaxElements.forEach(({ el, speed }) => {
                    const rect = el.getBoundingClientRect();
                    const visible = rect.top < window.innerHeight && rect.bottom > 0;
                    if (visible) {
                        const offset = (rect.top - window.innerHeight / 2) * speed;
                        el.style.transform = `translateY(${offset}px) scale(1.1)`;
                    }
                });

                // Section depth effect
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const center = rect.top + rect.height / 2;
                    const viewCenter = window.innerHeight / 2;
                    const distance = Math.abs(center - viewCenter) / window.innerHeight;
                    const scale = 1 - distance * 0.02;
                    const opacity = 1 - distance * 0.3;

                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        section.style.transform = `scale(${Math.max(scale, 0.96)})`;
                        section.style.opacity = Math.max(opacity, 0.7);
                    }
                });

                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ─── Text reveal on scroll ───
    function setupTextReveal() {
        const elements = document.querySelectorAll('.hero-greeting, .hero-title-wrapper, .hero-stats, .hero-cta, .hero-tags');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('text-revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        elements.forEach((el, i) => {
            el.classList.add('text-reveal');
            el.style.transitionDelay = `${i * 150}ms`;
            observer.observe(el);
        });
    }

    // ─── Magnetic hover for buttons ───
    function setupMagneticButtons() {
        const buttons = document.querySelectorAll('.btn, .hero-cta a');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
                setTimeout(() => { btn.style.transition = ''; }, 400);
            });
        });
    }

    // ─── Timeline progressive reveal ───
    function setupTimelineReveal() {
        const items = document.querySelectorAll('.timeline-item');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('timeline-visible');
                    // Animate the dot
                    const dot = entry.target.querySelector('.timeline-dot');
                    if (dot) dot.classList.add('dot-pulse');
                }
            });
        }, { threshold: 0.2 });

        items.forEach((item, i) => {
            item.style.transitionDelay = `${i * 150}ms`;
            observer.observe(item);
        });
    }

    // ─── Initialize ───
    setupParallax();
    createSectionObserver();
    setupTextReveal();
    setupMagneticButtons();
    setupTimelineReveal();
})();
