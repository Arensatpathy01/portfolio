/* =============================================
   TESTIMONIALS — Carousel with auto-play
   Loads testimonials from data/testimonials.json
   ============================================= */

const TestimonialCarousel = (() => {
    let testimonials = [];
    let currentIndex = 0;
    let autoPlayTimer = null;
    const AUTO_PLAY_MS = 6000;

    const buildCard = (t) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card glass-card';
        card.innerHTML = `
            <div class="testimonial-quote">
                <i class="fas fa-quote-left testimonial-quote-icon"></i>
                <p>${t.text}</p>
            </div>
            <div class="testimonial-author">
                <div class="testimonial-avatar">
                    <i class="${t.avatar}"></i>
                </div>
                <div class="testimonial-author-info">
                    <strong>${t.name}</strong>
                    <span>${t.role}</span>
                </div>
            </div>
        `;
        return card;
    };

    const updateDots = () => {
        const dots = document.querySelectorAll('.testimonial-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    };

    const goTo = (index) => {
        if (testimonials.length === 0) return;
        currentIndex = ((index % testimonials.length) + testimonials.length) % testimonials.length;
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        const cards = track.querySelectorAll('.testimonial-card');
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === currentIndex);
        });
        updateDots();
    };

    const next = () => goTo(currentIndex + 1);
    const prev = () => goTo(currentIndex - 1);

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayTimer = setInterval(next, AUTO_PLAY_MS);
    };

    const stopAutoPlay = () => {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    };

    const buildDots = () => {
        const container = document.getElementById('testimonialDots');
        if (!container) return;
        container.innerHTML = '';
        testimonials.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = `testimonial-dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
            dot.addEventListener('click', () => {
                goTo(i);
                startAutoPlay(); // reset timer on manual nav
            });
            container.appendChild(dot);
        });
    };

    const init = async () => {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;

        try {
            const resp = await fetch('data/testimonials.json');
            if (!resp.ok) throw new Error('Failed to load testimonials');
            testimonials = await resp.json();
        } catch (err) {
            console.warn('Testimonials: could not load data', err);
            return;
        }

        if (testimonials.length === 0) return;

        // Build cards
        testimonials.forEach((t, i) => {
            const card = buildCard(t);
            if (i === 0) card.classList.add('active');
            track.appendChild(card);
        });

        buildDots();

        // Nav buttons
        const prevBtn = document.querySelector('.testimonial-prev');
        const nextBtn = document.querySelector('.testimonial-next');
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAutoPlay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAutoPlay(); });

        // Touch / swipe support
        let touchStartX = 0;
        track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? next() : prev();
                startAutoPlay();
            }
        }, { passive: true });

        // Pause autoplay on hover
        const wrapper = document.querySelector('.testimonials-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', stopAutoPlay);
            wrapper.addEventListener('mouseleave', startAutoPlay);
        }

        startAutoPlay();
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, next, prev, goTo };
})();
