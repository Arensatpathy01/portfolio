/* =============================================
   SKILLS RADAR — Interactive radar/spider chart
   Canvas-based, animated, hover tooltips
   ============================================= */

(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ─── Skill data by category ───
    const categories = {
        'Core': {
            color: '#60a5fa',
            skills: [
                { name: 'C++', level: 92 },
                { name: 'Python', level: 78 },
                { name: 'Embedded C++', level: 88 },
                { name: 'SQL', level: 70 },
                { name: 'STL', level: 85 },
                { name: 'OOP', level: 90 },
            ]
        },
        'Systems': {
            color: '#a78bfa',
            skills: [
                { name: 'Embedded Systems', level: 88 },
                { name: 'Multithreading', level: 85 },
                { name: 'Real-Time', level: 82 },
                { name: 'Data Structures', level: 87 },
                { name: 'OS Concepts', level: 80 },
                { name: 'SDLC', level: 75 },
            ]
        },
        'DevOps': {
            color: '#6ee7b7',
            skills: [
                { name: 'Jenkins', level: 78 },
                { name: 'Docker', level: 75 },
                { name: 'CI/CD', level: 80 },
                { name: 'GitLab', level: 82 },
                { name: 'Linux', level: 88 },
                { name: 'Wireshark', level: 72 },
            ]
        }
    };

    let activeCategory = 'Core';
    let animationProgress = 0;
    let hoveredSkill = null;
    let canvas, ctx;
    let centerX, centerY, radius;
    let animFrameId;

    // ─── Wait for DOM ───
    function init() {
        const container = document.getElementById('skillsRadar');
        if (!container) return;

        canvas = document.createElement('canvas');
        canvas.className = 'radar-canvas';
        container.appendChild(canvas);

        // Create category tabs
        const tabBar = document.createElement('div');
        tabBar.className = 'radar-tabs';
        Object.keys(categories).forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `radar-tab ${cat === activeCategory ? 'active' : ''}`;
            btn.textContent = cat;
            btn.style.setProperty('--tab-color', categories[cat].color);
            btn.addEventListener('click', () => switchCategory(cat, tabBar));
            tabBar.appendChild(btn);
        });
        container.appendChild(tabBar);

        // Tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'radar-tooltip';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);

        resize();
        window.addEventListener('resize', resize);

        // Mouse tracking for hover
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (canvas.height / rect.height);
            checkHover(mx, my, tooltip, rect, e);
        });

        canvas.addEventListener('mouseleave', () => {
            hoveredSkill = null;
            tooltip.style.display = 'none';
        });

        // Intersection observer — animate when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animationProgress = 0;
                    animateIn();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(container);
    }

    function resize() {
        const container = canvas.parentElement;
        const w = Math.min(container.offsetWidth, 500);
        const h = w;
        const dpr = Math.min(window.devicePixelRatio, 2);

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        centerX = w / 2;
        centerY = h / 2;
        radius = w * 0.35;

        draw();
    }

    function switchCategory(cat, tabBar) {
        activeCategory = cat;
        animationProgress = 0;
        tabBar.querySelectorAll('.radar-tab').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === cat);
        });
        animateIn();
    }

    // ─── Animation ───
    function animateIn() {
        cancelAnimationFrame(animFrameId);
        function step() {
            animationProgress += 0.03;
            if (animationProgress > 1) animationProgress = 1;
            draw();
            if (animationProgress < 1) {
                animFrameId = requestAnimationFrame(step);
            }
        }
        step();
    }

    // ─── Draw radar ───
    function draw() {
        if (!ctx) return;
        const w = canvas.width / (Math.min(window.devicePixelRatio, 2));
        const h = canvas.height / (Math.min(window.devicePixelRatio, 2));

        ctx.clearRect(0, 0, w, h);

        const skills = categories[activeCategory].skills;
        const color = categories[activeCategory].color;
        const count = skills.length;
        const angleStep = (Math.PI * 2) / count;
        const eased = easeOutCubic(animationProgress);

        // Draw grid rings
        for (let ring = 1; ring <= 5; ring++) {
            const r = (radius / 5) * ring;
            ctx.beginPath();
            for (let i = 0; i <= count; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${ring === 5 ? 0.08 : 0.04})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axis lines & labels
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            // Axis line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            const labelR = radius + 24;
            const lx = centerX + Math.cos(angle) * labelR;
            const ly = centerY + Math.sin(angle) * labelR;

            ctx.font = `500 ${hoveredSkill === i ? 13 : 11}px 'Inter', sans-serif`;
            ctx.fillStyle = hoveredSkill === i ? color : 'rgba(228, 231, 239, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Adjust alignment for edge labels
            if (Math.cos(angle) > 0.3) ctx.textAlign = 'left';
            else if (Math.cos(angle) < -0.3) ctx.textAlign = 'right';

            ctx.fillText(skills[i].name, lx, ly);
        }

        // Draw data polygon (filled)
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const value = (skills[i].level / 100) * radius * eased;
            const x = centerX + Math.cos(angle) * value;
            const y = centerY + Math.sin(angle) * value;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, hexToRgba(color, 0.15));
        gradient.addColorStop(1, hexToRgba(color, 0.05));
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = hexToRgba(color, 0.6);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const value = (skills[i].level / 100) * radius * eased;
            const x = centerX + Math.cos(angle) * value;
            const y = centerY + Math.sin(angle) * value;

            // Outer glow
            if (hoveredSkill === i) {
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fillStyle = hexToRgba(color, 0.15);
                ctx.fill();
            }

            // Point
            ctx.beginPath();
            ctx.arc(x, y, hoveredSkill === i ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // White center
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
    }

    // ─── Hover detection ───
    function checkHover(mx, my, tooltip, canvasRect, event) {
        const skills = categories[activeCategory].skills;
        const count = skills.length;
        const angleStep = (Math.PI * 2) / count;
        let found = false;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const value = (skills[i].level / 100) * radius * easeOutCubic(animationProgress);
            const x = centerX + Math.cos(angle) * value;
            const y = centerY + Math.sin(angle) * value;
            const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);

            if (dist < 15) {
                hoveredSkill = i;
                found = true;

                tooltip.innerHTML = `<strong>${skills[i].name}</strong><span class="radar-tooltip-val">${skills[i].level}%</span>`;
                tooltip.style.display = 'block';
                tooltip.style.left = (event.clientX - canvasRect.left + 12) + 'px';
                tooltip.style.top = (event.clientY - canvasRect.top - 30) + 'px';
                tooltip.style.setProperty('--tt-color', categories[activeCategory].color);
                break;
            }
        }

        if (!found) {
            hoveredSkill = null;
            tooltip.style.display = 'none';
        }

        draw();
    }

    // ─── Helpers ───
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // ─── Init on DOM ready ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
