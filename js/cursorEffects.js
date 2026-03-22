/* =============================================
   CUSTOM CURSOR — Magnetic dot + glow trail
   GPU-accelerated, responsive, accessible
   ============================================= */

(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (window.innerWidth <= 768) return;

    // ─── Create cursor elements ───
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.appendChild(glow);

    let mouseX = -100, mouseY = -100;
    let dotX = -100, dotY = -100;
    let ringX = -100, ringY = -100;
    let glowX = -100, glowY = -100;
    let isHovering = false;
    let isClicking = false;
    let isHidden = false;
    let rafId;

    // ─── Trail particles ───
    const trailCanvas = document.createElement('canvas');
    trailCanvas.className = 'cursor-trail-canvas';
    document.body.appendChild(trailCanvas);
    const ctx = trailCanvas.getContext('2d');
    let trails = [];

    function resizeTrailCanvas() {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    }
    resizeTrailCanvas();
    window.addEventListener('resize', resizeTrailCanvas);

    // ─── Mouse tracking ───
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (isHidden) {
            isHidden = false;
            dot.style.opacity = '1';
            ring.style.opacity = '1';
            glow.style.opacity = '1';
        }
        // Add trail particle
        trails.push({
            x: e.clientX,
            y: e.clientY,
            alpha: 0.6,
            size: isHovering ? 3 : 2,
            color: isHovering ? '96, 165, 250' : '167, 139, 250'
        });
        if (trails.length > 30) trails.shift();
    });

    document.addEventListener('mouseleave', () => {
        isHidden = true;
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        glow.style.opacity = '0';
    });

    // ─── Hover detection ───
    const interactiveSelectors = 'a, button, input, textarea, select, .btn, .nav-links a, .chatbot-toggle, .project-card, .about-card, .skill-tags span, .cert-card, .education-card, .timeline-content, .hero-tags a, [data-tilt], .cmd-result';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelectors)) {
            isHovering = true;
            dot.classList.add('hovering');
            ring.classList.add('hovering');
            glow.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelectors)) {
            isHovering = false;
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
            glow.classList.remove('hovering');
        }
    });

    // ─── Click effect ───
    document.addEventListener('mousedown', () => {
        isClicking = true;
        dot.classList.add('clicking');
        ring.classList.add('clicking');
        // Spawn click ripple
        spawnRipple(mouseX, mouseY);
    });

    document.addEventListener('mouseup', () => {
        isClicking = false;
        dot.classList.remove('clicking');
        ring.classList.remove('clicking');
    });

    function spawnRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // ─── Animation loop ───
    function animate() {
        rafId = requestAnimationFrame(animate);

        // Smooth follow — dot (fast), ring (medium), glow (slow)
        const dotLerp = 0.35;
        const ringLerp = 0.15;
        const glowLerp = 0.08;

        dotX += (mouseX - dotX) * dotLerp;
        dotY += (mouseY - dotY) * dotLerp;
        ringX += (mouseX - ringX) * ringLerp;
        ringY += (mouseY - ringY) * ringLerp;
        glowX += (mouseX - glowX) * glowLerp;
        glowY += (mouseY - glowY) * glowLerp;

        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%) scale(${isClicking ? 0.6 : 1})`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${isHovering ? 1.8 : 1}${isClicking ? ' * 0.8' : ''})`;
        glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

        // Draw trail
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        for (let i = trails.length - 1; i >= 0; i--) {
            const t = trails[i];
            t.alpha -= 0.02;
            t.size *= 0.97;
            if (t.alpha <= 0) {
                trails.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${t.color}, ${t.alpha})`;
            ctx.fill();
        }
    }

    // Hide default cursor
    document.documentElement.style.cursor = 'none';
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after { cursor: none !important; }
        input, textarea, select { cursor: text !important; }
    `;
    document.head.appendChild(style);

    animate();

    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
        } else {
            animate();
        }
    });
})();
