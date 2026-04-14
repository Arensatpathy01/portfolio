/* =============================================
   VISITOR ANALYTICS — Supabase-powered tracking
   ─────────────────────────────────────────────
   Tracks page views, unique visitors (fingerprint),
   and section engagement using IntersectionObserver.
   Falls back silently if Supabase isn't configured.
   ============================================= */

const VisitorAnalytics = (() => {
    const TRACKED_SECTIONS = new Set();

    // ── Track page view on load ──
    const trackPageView = () => {
        if (!window.SupabaseBackend || !window.SupabaseBackend.isReady()) return;
        const page = window.location.pathname || '/';
        window.SupabaseBackend.trackPageView(page);
    };

    // ── Observe sections and track when they enter viewport ──
    const observeSections = () => {
        if (!window.SupabaseBackend || !window.SupabaseBackend.isReady()) return;

        const sections = document.querySelectorAll('.section[id]');
        if (!sections.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (!TRACKED_SECTIONS.has(id)) {
                        TRACKED_SECTIONS.add(id);
                        window.SupabaseBackend.trackSectionView(id);
                    }
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(s => observer.observe(s));
    };

    // ── Init ──
    const init = () => {
        // Small delay to let SupabaseBackend initialize first
        setTimeout(() => {
            trackPageView();
            observeSections();
        }, 1500);
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => VisitorAnalytics.init());
