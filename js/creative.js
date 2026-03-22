/* =============================================
   CREATIVE — Advanced 3D animations & interactions
   Tilt cards, parallax, stagger reveals,
   magnetic buttons, text shimmer, glow cursor,
   mouse-driven 3D parallax depth
   ============================================= */

(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // ===== 1. ENHANCED 3D TILT EFFECT ON CARDS =====
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) translateY(-6px)`;
            card.style.transition = 'transform 0.1s ease';

            // Move internal glow
            const glowX = (x / rect.width) * 100;
            const glowY = (y / rect.height) * 100;
            card.style.setProperty('--glow-x', `${glowX}%`);
            card.style.setProperty('--glow-y', `${glowY}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        });
    });

    // ===== 2. 3D CARD TILT ON ALL INTERACTIVE CARDS =====
    if (!isTouchDevice) {
        const tiltCards = document.querySelectorAll('.about-card, .skill-category, .timeline-content, .education-card, .cert-card');
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px) translateY(-4px)`;
                card.style.transition = 'transform 0.15s ease';

                // Dynamic glow position
                const glowX = (x / rect.width) * 100;
                const glowY = (y / rect.height) * 100;
                card.style.setProperty('--glow-x', `${glowX}%`);
                card.style.setProperty('--glow-y', `${glowY}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            });
        });
    }

    // ===== 3. STAGGERED REVEAL ON SCROLL =====
    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const children = entry.target.querySelectorAll('.stagger-child');
                children.forEach((child, i) => {
                    child.style.transitionDelay = `${i * 0.12}s`;
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

    // ===== 4. 3D PARALLAX ON SCROLL =====
    const parallaxElements = document.querySelectorAll('.section-banner img');
    const heroImage = document.querySelector('.hero-bg-image');
    const sections = document.querySelectorAll('.section');

    function handleParallax() {
        const scrollY = window.scrollY;

        // Hero background parallax with 3D depth
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrollY * 0.3}px) translateZ(-50px) scale(1.5)`;
        }

        // Section banners parallax
        parallaxElements.forEach(img => {
            const rect = img.parentElement.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const offset = (rect.top / window.innerHeight) * 30;
                img.style.transform = `translateY(${offset}px) scale(1.1)`;
            }
        });

        // Subtle section depth based on scroll position
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewCenter = window.innerHeight / 2;
            const sectionCenter = rect.top + rect.height / 2;
            const distance = (sectionCenter - viewCenter) / window.innerHeight;
            const scale = 1 - Math.abs(distance) * 0.02;
            const translateZ = -Math.abs(distance) * 5;

            if (rect.top < window.innerHeight && rect.bottom > 0) {
                section.style.transform = `perspective(1200px) translateZ(${translateZ}px) scale(${Math.max(scale, 0.97)})`;
                section.style.opacity = 1 - Math.abs(distance) * 0.1;
            }
        });
    }

    window.addEventListener('scroll', handleParallax, { passive: true });

    // ===== 5. MAGNETIC BUTTONS WITH 3D =====
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (isTouchDevice) return;

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) translateZ(8px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ===== 6. ANIMATED COUNTER WITH EASING =====
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

    // ===== 7. SCROLL INDICATOR FADE =====
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            const opacity = Math.max(0, 1 - window.scrollY / 300);
            scrollIndicator.style.opacity = opacity;
            scrollIndicator.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.5}px)`;
        }, { passive: true });
    }

    // ===== 8. TYPING CURSOR GLOW =====
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        cursor.classList.add('cursor-glow');
    }

    // ===== 9. SKILL TAG HOVER RIPPLE =====
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

    // ===== 10. SECTION TITLE REVEAL ANIMATION =====
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

    // ===== 11. ORBIT RING 3D ROTATION =====
    const orbitRing = document.querySelector('.orbit-ring');
    if (orbitRing) {
        let angle = 0;
        function rotateOrbit() {
            angle += 0.3;
            orbitRing.style.transform = `rotate(${angle}deg) rotateX(15deg)`;
            requestAnimationFrame(rotateOrbit);
        }
        rotateOrbit();
    }

    // ===== 12. NAV LINK ACTIVE GLOW =====
    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.classList.add('nav-glow');
        });
        link.addEventListener('mouseleave', () => {
            link.classList.remove('nav-glow');
        });
    });

    // ===== 13. TIMELINE DOT PULSE ON SCROLL =====
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

    // ===== 14. MOUSE-DRIVEN HERO 3D PARALLAX =====
    if (!isTouchDevice) {
        const heroContent = document.querySelector('.hero-content');
        const heroText = document.querySelector('.hero-text');
        const heroVisual = document.querySelector('.hero-visual');

        if (heroContent) {
            document.querySelector('.hero')?.addEventListener('mousemove', (e) => {
                const rect = document.querySelector('.hero').getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                if (heroText) {
                    heroText.style.transform = `translateZ(30px) translateX(${x * -10}px) translateY(${y * -10}px)`;
                }
                if (heroVisual) {
                    heroVisual.style.transform = `translateZ(50px) translateX(${x * 15}px) translateY(${y * 15}px)`;
                }
            });

            document.querySelector('.hero')?.addEventListener('mouseleave', () => {
                if (heroText) heroText.style.transform = 'translateZ(30px)';
                if (heroVisual) heroVisual.style.transform = 'translateZ(50px)';
            });
        }
    }

    // ===== 15. DYNAMIC CARD GLOW POSITION =====
    if (!isTouchDevice) {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--glow-x', `${x}%`);
                card.style.setProperty('--glow-y', `${y}%`);
            });
        });
    }

})();
