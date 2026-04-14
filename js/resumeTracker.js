/* =============================================
   RESUME DOWNLOAD — Download tracking & counter
   Shows "Downloaded X+ times" with real counter.
   Uses Supabase for global count, localStorage fallback.
   ============================================= */

const ResumeTracker = (() => {
    const COUNTER_KEY = 'resume_download_count';
    const DOWNLOADS_KEY = 'resume_downloads_log';
    const RESUME_URL = 'resume/Resume_Aren_Satpathy.pdf';

    // ── Get count (localStorage fallback) ──
    const getCountLocal = () => {
        const base = 45;
        const local = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
        return base + local;
    };

    // ── Get count (Supabase → localStorage) ──
    const getCount = async () => {
        if (window.SupabaseBackend && window.SupabaseBackend.isReady()) {
            const remote = await window.SupabaseBackend.getResumeCount();
            if (remote !== null) return remote;
        }
        return getCountLocal();
    };

    // ── Increment download ──
    const trackDownload = async () => {
        // Always update localStorage
        const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
        localStorage.setItem(COUNTER_KEY, String(current + 1));

        const log = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]');
        log.push({ timestamp: new Date().toISOString(), userAgent: navigator.userAgent.slice(0, 80) });
        localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(log.slice(-100)));

        // Track with Supabase (global counter)
        if (window.SupabaseBackend && window.SupabaseBackend.isReady()) {
            await window.SupabaseBackend.incrementResumeCount();
        }

        // Track with GA
        if (typeof gtag === 'function') {
            gtag('event', 'resume_download', { event_category: 'Resume', event_label: 'PDF Download', value: 1 });
        }

        await updateUI();
    };

    // ── Download resume ──
    const download = async () => {
        try {
            const resp = await fetch(RESUME_URL, { method: 'HEAD' });
            if (!resp.ok) { showDownloadToast(false); return; }
        } catch {
            showDownloadToast(false);
            return;
        }

        await trackDownload();

        const link = document.createElement('a');
        link.href = RESUME_URL;
        link.download = 'Resume_Aren_Satpathy.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showDownloadToast(true);
    };

    // ── Update all download count displays ──
    const updateUI = async () => {
        const count = await getCount();
        document.querySelectorAll('.resume-count').forEach(el => {
            el.textContent = count + '+';
        });
    };

    // ── Toast notification ──
    const showDownloadToast = (success = true) => {
        const toast = document.createElement('div');
        toast.className = 'resume-toast';
        if (success) {
            toast.innerHTML = `
                <i class="fas fa-file-download"></i>
                <div>
                    <strong>Resume downloading…</strong>
                    <span>Downloaded ${getCountLocal()}+ times</span>
                </div>
            `;
        } else {
            toast.innerHTML = `
                <i class="fas fa-exclamation-circle" style="color:#f87171"></i>
                <div>
                    <strong>Resume not available yet</strong>
                    <span>Please check back soon or contact me directly.</span>
                </div>
            `;
        }
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // ── Init ──
    const init = () => {
        updateUI();
        document.querySelectorAll('.resume-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                download();
            });
        });
    };

    return { init, download, getCount: getCountLocal };
})();

document.addEventListener('DOMContentLoaded', () => ResumeTracker.init());
window.ResumeTracker = ResumeTracker;
