/* =============================================
   CREATIVE — Advanced animations & interactions
   Tilt cards, parallax, stagger reveals,
   magnetic buttons, text shimmer, glow cursor
   ============================================= */

(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // ===== 1. TILT EFFECT ON PROJECT CARDS =====
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            card.style.transition = 'transform 0.1s ease';

            // Move internal glow
            const glowX = (x / rect.width) * 100;
            const glowY = (y / rect.height) * 100;
            card.style.setProperty('--glow-x', `${glowX}%`);
            card.style.setProperty('--glow-y', `${glowY}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s ease';
        });
    });

    // ===== 2. STAGGERED REVEAL ON SCROLL =====
    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const children = entry.target.querySelectorAll('.stagger-child');
                children.forEach((child, i) => {
                    child.style.transitionDelay = `${i * 0.1}s`;
                    child.classList.add('stagger-visible');
                });
                staggerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    // Apply stagger classes
    document.querySelectorAll('.skills-grid, .about-grid, .cert-grid, .education-grid').forEach(grid => {
        grid.classList.add('stagger-parent');
        grid.querySelectorAll('.skill-category, .about-card, .cert-card, .cert-card-link, .education-card, .education-card-link').forEach(child => {
            child.classList.add('stagger-child');
        });
        staggerObserver.observe(grid);
    });

    // ===== 3. PARALLAX ON SCROLL =====
    const parallaxElements = document.querySelectorAll('.section-banner img');
    const heroImage = document.querySelector('.hero-bg-image');

    function handleParallax() {
        const scrollY = window.scrollY;

        // Hero background parallax
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrollY * 0.3}px)`;
        }

        // Section banners parallax
        parallaxElements.forEach(img => {
            const rect = img.parentElement.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const offset = (rect.top / window.innerHeight) * 30;
                img.style.transform = `translateY(${offset}px) scale(1.1)`;
            }
        });
    }

    window.addEventListener('scroll', handleParallax, { passive: true });

    // ===== 4. MAGNETIC BUTTONS =====
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ===== 5. ANIMATED COUNTER WITH EASING =====
    // (Already handled by counters.js, this adds the glow pulse)
    const statNumbers = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('counter-animated');
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => counterObserver.observe(el));

    // ===== 6. SCROLL INDICATOR FADE =====
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            const opacity = Math.max(0, 1 - window.scrollY / 300);
            scrollIndicator.style.opacity = opacity;
            scrollIndicator.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.5}px)`;
        }, { passive: true });
    }

    // ===== 7. TYPING CURSOR GLOW =====
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        cursor.classList.add('cursor-glow');
    }

    // ===== 8. SKILL TAG HOVER RIPPLE =====
    document.querySelectorAll('.skill-tags span, .tech-tags span').forEach(tag => {
        tag.addEventListener('mouseenter', (e) => {
            const ripple = document.createElement('span');
            ripple.className = 'tag-ripple';
            const rect = tag.getBoundingClientRect();
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            tag.style.position = 'relative';
            tag.style.overflow = 'hidden';
            tag.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ===== 9. SECTION TITLE REVEAL ANIMATION =====
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('title-revealed');
                titleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.section-title').forEach(title => {
        title.classList.add('title-animate');
        titleObserver.observe(title);
    });

    // ===== 10. ORBIT RING ROTATION =====
    const orbitRing = document.querySelector('.orbit-ring');
    if (orbitRing) {
        let angle = 0;
        function rotateOrbit() {
            angle += 0.3;
            orbitRing.style.transform = `rotate(${angle}deg)`;
            requestAnimationFrame(rotateOrbit);
        }
        rotateOrbit();
    }

    // ===== 11. NAV LINK ACTIVE GLOW =====
    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.classList.add('nav-glow');
        });
        link.addEventListener('mouseleave', () => {
            link.classList.remove('nav-glow');
        });
    });

    // ===== 12. TIMELINE DOT PULSE ON SCROLL =====
    const dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelector('.timeline-dot')?.classList.add('dot-pulse');
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.timeline-item').forEach(item => {
        dotObserver.observe(item);
    });

})();
