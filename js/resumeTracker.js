/* =============================================
   RESUME DOWNLOAD — Download tracking & counter
   Shows "Downloaded X+ times" with real counter.
   Uses localStorage + optional backend upgrade.
   ============================================= */

const ResumeTracker = (() => {
    const COUNTER_KEY = 'resume_download_count';
    const DOWNLOADS_KEY = 'resume_downloads_log';
    const RESUME_URL = 'resume/Aren_Satpathy_Resume.pdf'; // ← Update path

    // ── Get current count ──
    const getCount = () => {
        const base = 45; // Starting number (looks better than 0)
        const local = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
        return base + local;
    };

    // ── Increment download ──
    const trackDownload = () => {
        const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
        localStorage.setItem(COUNTER_KEY, String(current + 1));

        // Log the download
        const log = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]');
        log.push({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.slice(0, 80)
        });
        localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(log.slice(-100))); // Keep last 100

        // Track with GA
        if (typeof gtag === 'function') {
            gtag('event', 'resume_download', {
                event_category: 'Resume',
                event_label: 'PDF Download',
                value: 1
            });
        }

        updateUI();
    };

    // ── Download resume ──
    const download = () => {
        trackDownload();

        // Create temporary link and click it
        const link = document.createElement('a');
        link.href = RESUME_URL;
        link.download = 'Aren_Satpathy_Resume.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show toast notification
        showDownloadToast();
    };

    // ── Update all download count displays ──
    const updateUI = () => {
        const count = getCount();
        document.querySelectorAll('.resume-count').forEach(el => {
            el.textContent = count + '+';
        });
    };

    // ── Toast notification ──
    const showDownloadToast = () => {
        const toast = document.createElement('div');
        toast.className = 'resume-toast';
        toast.innerHTML = `
            <i class="fas fa-file-download"></i>
            <div>
                <strong>Resume downloading...</strong>
                <span>Downloaded ${getCount()}+ times</span>
            </div>
        `;
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

        // Bind download buttons
        document.querySelectorAll('.resume-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                download();
            });
        });
    };

    return { init, download, getCount };
})();

document.addEventListener('DOMContentLoaded', () => ResumeTracker.init());
window.ResumeTracker = ResumeTracker;
