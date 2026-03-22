/* =============================================
   THEME SWITCHER — Light / Dark / System
   Smooth transitions, persistent preference
   ============================================= */

(function () {
    'use strict';

    const STORAGE_KEY = 'portfolio-theme';
    const themes = ['dark', 'light', 'system'];
    const icons = { dark: 'fa-moon', light: 'fa-sun', system: 'fa-circle-half-stroke' };
    const labels = { dark: 'Dark Mode', light: 'Light Mode', system: 'System' };

    // ─── State ───
    let currentTheme = localStorage.getItem(STORAGE_KEY) || 'dark';

    // ─── Create toggle button ───
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = `<i class="fas ${icons[currentTheme]}"></i>`;

    // Insert into sidebar footer
    function insertButton() {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.insertBefore(btn, sidebarFooter.firstChild);
        } else {
            document.body.appendChild(btn);
        }
    }

    // ─── Apply theme ───
    function applyTheme(theme) {
        const resolved = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
            : theme;

        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.classList.toggle('light-theme', resolved === 'light');

        btn.innerHTML = `<i class="fas ${icons[theme]}"></i>`;
        btn.title = labels[theme];

        localStorage.setItem(STORAGE_KEY, theme);
        currentTheme = theme;
    }

    // ─── Cycle themes ───
    function cycleTheme() {
        const idx = themes.indexOf(currentTheme);
        const next = themes[(idx + 1) % themes.length];
        applyTheme(next);

        // Notify command palette
        if (btn.animate) {
            btn.animate([
                { transform: 'rotate(0deg) scale(1)' },
                { transform: 'rotate(180deg) scale(1.2)' },
                { transform: 'rotate(360deg) scale(1)' }
            ], { duration: 400, easing: 'ease-out' });
        }
    }

    btn.addEventListener('click', cycleTheme);

    // Listen for command palette theme toggle
    window.addEventListener('toggle-theme', cycleTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (currentTheme === 'system') applyTheme('system');
    });

    // ─── Initialize ───
    applyTheme(currentTheme);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertButton);
    } else {
        insertButton();
    }
})();
