/* =============================================
   ANALYTICS — Google Analytics 4 + Custom Events
   + Cookie Consent Banner
   ============================================= */

const SiteAnalytics = (() => {
    const GA_ID = 'G-XXXXXXXXXX'; // ← Replace with your GA4 Measurement ID
    const CONSENT_KEY = 'analytics_consent';

    // ── Check if GA is configured ──
    const isConfigured = () => GA_ID !== 'G-XXXXXXXXXX';

    // ── Check consent ──
    const hasConsent = () => localStorage.getItem(CONSENT_KEY) === 'accepted';

    // ── Load GA4 Script ──
    const loadGA = () => {
        if (!isConfigured() || !hasConsent()) return;

        // Load gtag.js
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
        });

        console.log('📊 Google Analytics loaded');
    };

    // ── Track custom events ──
    const trackEvent = (action, category, label, value) => {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }

        // Also store locally for admin visibility
        const events = JSON.parse(localStorage.getItem('site_events') || '[]');
        events.push({ action, category, label, value, t: Date.now() });
        if (events.length > 500) events.splice(0, events.length - 500);
        localStorage.setItem('site_events', JSON.stringify(events));
    };

    // ── Cookie Consent Banner ──
    const showConsentBanner = () => {
        if (localStorage.getItem(CONSENT_KEY)) return; // Already decided

        const banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.innerHTML = `
            <div class="cookie-consent-inner">
                <div class="cookie-consent-text">
                    <i class="fas fa-cookie-bite"></i>
                    <p>This site uses cookies & analytics to improve your experience and track visits.</p>
                </div>
                <div class="cookie-consent-actions">
                    <button class="cookie-btn cookie-accept">Accept</button>
                    <button class="cookie-btn cookie-decline">Decline</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        requestAnimationFrame(() => banner.classList.add('show'));

        banner.querySelector('.cookie-accept').addEventListener('click', () => {
            localStorage.setItem(CONSENT_KEY, 'accepted');
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 400);
            loadGA();
        });

        banner.querySelector('.cookie-decline').addEventListener('click', () => {
            localStorage.setItem(CONSENT_KEY, 'declined');
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 400);
        });
    };

    // ── Auto-track section views ──
    const trackSectionViews = () => {
        const sections = document.querySelectorAll('.section, .hero');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id || 'unknown';
                    trackEvent('section_view', 'Navigation', id);
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(s => observer.observe(s));
    };

    // ── Auto-track outbound link clicks ──
    const trackOutboundLinks = () => {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[target="_blank"]');
            if (link) {
                trackEvent('outbound_click', 'Link', link.href);
            }
        });
    };

    // ── Track time on page ──
    const trackTimeOnPage = () => {
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const seconds = Math.round((Date.now() - startTime) / 1000);
            trackEvent('time_on_page', 'Engagement', `${seconds}s`, seconds);
        });
    };

    // ── Init ──
    const init = () => {
        showConsentBanner();
        if (hasConsent()) loadGA();
        trackSectionViews();
        trackOutboundLinks();
        trackTimeOnPage();
    };

    return { init, trackEvent, hasConsent };
})();

document.addEventListener('DOMContentLoaded', () => SiteAnalytics.init());
window.SiteAnalytics = SiteAnalytics;
