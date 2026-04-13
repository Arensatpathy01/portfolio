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
    // Skip split-text on small screens — just show the name
    const heroName = document.querySelector('.hero-name');
    if (heroName && window.innerWidth > 768) {
        splitText(heroName);
    }

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
                    const children = section.querySelectorAll('.about-card, .timeline-item, .skill-category, .project-card, .education-card, .cert-card, .blog-card, h2, .section-banner');
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

        // Re-apply child-visible for dynamically loaded content
        // (e.g. projectLoader.js, blogLoader.js inject cards after initial observe)
        const mutationObs = new MutationObserver((mutations) => {
            mutations.forEach(mut => {
                const section = mut.target.closest('.section');
                if (section && section.classList.contains('section-visible')) {
                    const newChildren = section.querySelectorAll(
                        '.about-card, .timeline-item, .skill-category, .project-card, .education-card, .cert-card, .blog-card, h2, .section-banner'
                    );
                    newChildren.forEach((child, i) => {
                        if (!child.classList.contains('child-visible')) {
                            child.style.transitionDelay = `${i * 60}ms`;
                            child.classList.add('child-visible');
                        }
                    });
                }
            });
        });

        sections.forEach(s => {
            mutationObs.observe(s, { childList: true, subtree: true });
        });
    }

    // ─── Smooth parallax on scroll ───\n    // NOTE: Section depth/parallax is handled by creative.js.\n    // This file only handles the MutationObserver for dynamically loaded content.

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

    // ─── Magnetic buttons handled by creative.js ───

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
    createSectionObserver();
    setupTextReveal();
    setupTimelineReveal();
})();
