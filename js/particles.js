/* =============================================
   PARTICLES — Floating particle network on hero
   Enhanced with 3D depth simulation
   ============================================= */

(function () {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, particles, mouse;
    const PARTICLE_COUNT_DESKTOP = 70;
    const PARTICLE_COUNT_MOBILE = 30;
    const CONNECTION_DISTANCE = 130;
    const MOUSE_RADIUS = 180;

    mouse = { x: null, y: null };

    function resize() {
        const hero = canvas.parentElement;
        w = canvas.width = hero.offsetWidth;
        h = canvas.height = hero.offsetHeight;
    }

    function getParticleCount() {
        return window.innerWidth <= 768 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.z = Math.random() * 3 + 0.5; // Depth layer (0.5 to 3.5)
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.baseRadius = Math.random() * 2 + 0.8;
            this.radius = this.baseRadius * this.z * 0.5;
            this.opacity = (Math.random() * 0.4 + 0.15) * (this.z / 3);
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.pulseOffset = Math.random() * Math.PI * 2;
            // Color variation based on depth
            this.colorIndex = Math.floor(Math.random() * 3);
        }

        update(time) {
            // Speed based on depth (closer = faster parallax feel)
            const speedMult = this.z * 0.3;
            this.x += this.vx * speedMult;
            this.y += this.vy * speedMult;

            // Pulse radius for depth breathing effect
            this.radius = this.baseRadius * this.z * 0.5 * (1 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.2);

            // Mouse repulsion (stronger for closer particles)
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS) {
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                    this.x += dx * force * 0.03 * this.z;
                    this.y += dy * force * 0.03 * this.z;
                }
            }

            // Wrap around edges
            if (this.x < -10) this.x = w + 10;
            if (this.x > w + 10) this.x = -10;
            if (this.y < -10) this.y = h + 10;
            if (this.y > h + 10) this.y = -10;
        }

        draw() {
            const colors = [
                `rgba(96, 165, 250, ${this.opacity})`,   // Blue
                `rgba(167, 139, 250, ${this.opacity})`,   // Purple
                `rgba(110, 231, 183, ${this.opacity * 0.8})` // Emerald
            ];

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = colors[this.colorIndex];
            ctx.fill();

            // Add glow for closer particles
            if (this.z > 2) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = colors[this.colorIndex].replace(this.opacity, this.opacity * 0.15);
                ctx.fill();
            }
        }
    }

    function init() {
        resize();
        particles = [];
        const count = getParticleCount();
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Adjust connection distance by depth
                const avgZ = (particles[i].z + particles[j].z) / 2;
                const adjustedDist = CONNECTION_DISTANCE * (avgZ / 2);

                if (dist < adjustedDist) {
                    const opacity = (1 - dist / adjustedDist) * 0.12 * (avgZ / 3);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
                    ctx.lineWidth = 0.5 * (avgZ / 2);
                    ctx.stroke();
                }
            }
        }
    }

    let time = 0;
    function animate() {
        time++;
        ctx.clearRect(0, 0, w, h);

        // Sort by depth for proper rendering (far to near)
        particles.sort((a, b) => a.z - b.z);

        particles.forEach(p => {
            p.update(time);
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }

    // Mouse tracking (hero-relative)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', () => {
        resize();
        const newCount = getParticleCount();
        if (Math.abs(particles.length - newCount) > 10) {
            init();
        }
    });

    // Respect reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        init();
        animate();
    }
})();
