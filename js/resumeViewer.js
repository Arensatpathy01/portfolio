/* =============================================
   RESUME VIEWER — PDF Modal / Overlay
   Opens the resume PDF in a fullscreen modal
   with iframe viewer, download & close buttons.
   ============================================= */

const ResumeViewer = (() => {
    const RESUME_URL = 'resume/Resume_Aren_Satpathy.pdf';
    let modal = null;

    const buildModal = () => {
        if (modal) return modal;

        modal = document.createElement('div');
        modal.className = 'resume-modal';
        modal.id = 'resumeModal';
        modal.innerHTML = `
            <div class="resume-modal-backdrop"></div>
            <div class="resume-modal-content">
                <div class="resume-modal-header">
                    <h3><i class="fas fa-file-pdf"></i> Resume — Aren Satpathy</h3>
                    <div class="resume-modal-actions">
                        <a href="${RESUME_URL}" download="Resume_Aren_Satpathy.pdf" class="btn btn-primary btn-sm resume-modal-download">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <button class="resume-modal-close" id="resumeModalClose" aria-label="Close resume viewer">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="resume-modal-body">
                    <iframe src="" class="resume-modal-iframe" id="resumeIframe" title="Resume PDF Viewer"></iframe>
                    <div class="resume-modal-fallback" id="resumeFallback" style="display:none;">
                        <i class="fas fa-file-pdf" style="font-size:3rem;color:var(--accent);"></i>
                        <p>Your browser cannot display this PDF inline.</p>
                        <a href="${RESUME_URL}" download class="btn btn-primary"><i class="fas fa-download"></i> Download PDF</a>
                        <a href="${RESUME_URL}" target="_blank" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> Open in New Tab</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.resume-modal-backdrop').addEventListener('click', close);
        modal.querySelector('#resumeModalClose').addEventListener('click', close);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) close();
        });

        return modal;
    };

    const open = async () => {
        // Check file exists
        try {
            const resp = await fetch(RESUME_URL, { method: 'HEAD' });
            if (!resp.ok) {
                alert('Resume file is not available at this time.');
                return;
            }
        } catch {
            alert('Could not reach the resume file.');
            return;
        }

        const m = buildModal();
        const iframe = m.querySelector('#resumeIframe');
        const fallback = m.querySelector('#resumeFallback');

        // Set iframe src
        iframe.src = RESUME_URL;
        iframe.style.display = 'block';
        fallback.style.display = 'none';

        // Fallback: if iframe fails to load (some mobile browsers)
        iframe.onerror = () => {
            iframe.style.display = 'none';
            fallback.style.display = 'flex';
        };

        m.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Clear iframe to stop PDF rendering
        const iframe = modal.querySelector('#resumeIframe');
        if (iframe) iframe.src = '';
    };

    const init = () => {
        // Add "View" buttons next to existing resume download buttons
        document.querySelectorAll('.resume-download-btn').forEach(btn => {
            // Create a View button sibling
            const viewBtn = document.createElement('a');
            viewBtn.href = '#';
            viewBtn.className = 'btn btn-outline btn-sm resume-view-btn';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                open();
            });

            // Insert after the download button
            if (btn.parentNode) {
                btn.parentNode.insertBefore(viewBtn, btn.nextSibling);
            }
        });
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, open, close };
})();
