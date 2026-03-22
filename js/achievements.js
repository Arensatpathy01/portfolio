/* =============================================
   ACHIEVEMENTS — Gamified scroll milestones
   Unlocks badges as user explores the site
   Toast notifications on achievement unlock
   ============================================= */

(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const STORAGE_KEY = 'portfolio-achievements';
    let unlocked = {};

    try {
        unlocked = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { unlocked = {}; }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked)); } catch (e) {}
    }

    // ─── Achievement definitions ───
    const achievements = [
        { id: 'explorer',      icon: '🗺️',  title: 'Explorer',           desc: 'Visited all sections',              check: () => allSectionsViewed() },
        { id: 'speed_reader',  icon: '⚡',   title: 'Speed Reader',       desc: 'Scrolled 50% in under 30 seconds',  check: () => scrollPctReached(50) && timeOnPage() < 30 },
        { id: 'deep_diver',    icon: '🤿',   title: 'Deep Diver',         desc: 'Scrolled to 100% of the page',      check: () => scrollPctReached(98) },
        { id: 'curious',       icon: '🤔',   title: 'Curious Mind',       desc: 'Opened the AI chatbot',             check: null },  // triggered externally
        { id: 'networker',     icon: '🔗',   title: 'Networker',          desc: 'Clicked a social link',             check: null },
        { id: 'night_owl',     icon: '🦉',   title: 'Night Owl',          desc: 'Visiting between 10PM and 4AM',     check: () => { const h = new Date().getHours(); return h >= 22 || h < 4; } },
        { id: 'early_bird',    icon: '🐦',   title: 'Early Bird',         desc: 'Visiting between 5AM and 7AM',      check: () => { const h = new Date().getHours(); return h >= 5 && h < 7; } },
        { id: 'loyal_fan',     icon: '⭐',   title: 'Loyal Fan',          desc: 'Visited 3+ times',                  check: () => getVisitCount() >= 3 },
        { id: 'keyboard_pro',  icon: '⌨️',   title: 'Keyboard Pro',       desc: 'Used the command palette',          check: null },
        { id: 'time_traveler', icon: '⏳',   title: 'Time Traveler',      desc: 'Spent 2+ minutes on the site',      check: () => timeOnPage() >= 120 },
    ];

    // ─── Tracking state ───
    const viewedSections = new Set();
    let maxScrollPct = 0;
    const startTime = Date.now();

    function timeOnPage() {
        return (Date.now() - startTime) / 1000;
    }

    function scrollPctReached(pct) {
        return maxScrollPct >= pct;
    }

    function allSectionsViewed() {
        const required = ['hero', 'about', 'experience', 'skills', 'projects', 'education', 'certifications', 'contact'];
        return required.every(s => viewedSections.has(s));
    }

    function getVisitCount() {
        const key = 'portfolio-visit-count';
        let count = parseInt(localStorage.getItem(key) || '0', 10);
        return count;
    }

    function incrementVisitCount() {
        const key = 'portfolio-visit-count';
        let count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
        localStorage.setItem(key, count.toString());
    }

    // ─── Toast notification ───
    let toastContainer;

    function createToastContainer() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'achievement-toast-container';
        document.body.appendChild(toastContainer);
    }

    function showToast(achievement) {
        if (!toastContainer) createToastContainer();

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-toast-icon">${achievement.icon}</div>
            <div class="achievement-toast-info">
                <span class="achievement-toast-label">Achievement Unlocked!</span>
                <span class="achievement-toast-title">${achievement.title}</span>
                <span class="achievement-toast-desc">${achievement.desc}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    // ─── Unlock logic ───
    function tryUnlock(id) {
        if (unlocked[id]) return;
        const ach = achievements.find(a => a.id === id);
        if (!ach) return;

        unlocked[id] = { time: new Date().toISOString() };
        save();
        showToast(ach);
    }

    function checkAutoAchievements() {
        achievements.forEach(ach => {
            if (unlocked[ach.id]) return;
            if (ach.check && ach.check()) {
                tryUnlock(ach.id);
            }
        });
    }

    // ─── Scroll tracking ───
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const winHeight = window.innerHeight;
        maxScrollPct = Math.round((scrollTop / (docHeight - winHeight)) * 100);
    }, { passive: true });

    // ─── Section view tracking ───
    function trackSections() {
        const sections = document.querySelectorAll('.section, .hero');
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    viewedSections.add(entry.target.id);
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(s => observer.observe(s));
    }

    // ─── External triggers ───
    // Chatbot opened
    setTimeout(() => {
        const chatToggle = document.getElementById('chatbotToggle');
        if (chatToggle) {
            chatToggle.addEventListener('click', () => tryUnlock('curious'));
        }
    }, 1000);

    // Social links clicked
    setTimeout(() => {
        document.querySelectorAll('.sidebar-footer a, .footer-links a').forEach(link => {
            link.addEventListener('click', () => tryUnlock('networker'));
        });
    }, 1000);

    // Command palette used
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            tryUnlock('keyboard_pro');
        }
    });

    // ─── Periodic check ───
    setInterval(checkAutoAchievements, 3000);

    // ─── Initialize ───
    incrementVisitCount();
    trackSections();

    // Check time-based achievements immediately
    setTimeout(checkAutoAchievements, 1000);
})();
