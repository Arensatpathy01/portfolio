/* =============================================
   BLOG ENGAGEMENT — Likes & reads powered by Supabase
   ─────────────────────────────────────────────
   Adds like buttons + read counters to blog cards.
   Falls back silently if Supabase isn't configured.
   ============================================= */

const BlogEngagement = (() => {

    // ── Inject like button + stats into each blog card ──
    const enhanceCards = async () => {
        if (!window.SupabaseBackend || !window.SupabaseBackend.isReady()) return;

        const cards = document.querySelectorAll('.blog-card');
        if (!cards.length) return;

        for (const card of cards) {
            const readMoreLink = card.querySelector('.blog-read-more');
            const title = card.querySelector('.blog-card-title');
            if (!title) continue;

            // Derive slug from title
            const slug = slugify(title.textContent);

            // Fetch stats
            const stats = await window.SupabaseBackend.getBlogStats(slug);
            const liked = await window.SupabaseBackend.hasLiked(slug);

            // Create engagement bar
            const bar = document.createElement('div');
            bar.className = 'blog-engagement-bar';
            bar.innerHTML = `
                <button class="blog-like-btn ${liked ? 'liked' : ''}" data-slug="${slug}" title="Like this post">
                    <i class="fas fa-heart"></i> <span class="like-count">${stats ? stats.likes : 0}</span>
                </button>
                <span class="blog-read-count" title="Read count">
                    <i class="fas fa-eye"></i> <span>${stats ? stats.reads : 0}</span>
                </span>
            `;

            // Insert before the "Read more" link
            const body = card.querySelector('.blog-card-body');
            if (body && readMoreLink) {
                body.insertBefore(bar, readMoreLink);
            } else if (body) {
                body.appendChild(bar);
            }

            // Track read when "Read more" is clicked
            if (readMoreLink) {
                readMoreLink.addEventListener('click', () => {
                    window.SupabaseBackend.trackBlogRead(slug);
                    // Update count in UI
                    const readSpan = bar.querySelector('.blog-read-count span');
                    if (readSpan) readSpan.textContent = parseInt(readSpan.textContent) + 1;
                });
            }
        }

        // Bind all like buttons
        document.querySelectorAll('.blog-like-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const slug = btn.dataset.slug;
                const result = await window.SupabaseBackend.toggleBlogLike(slug);
                if (result === null) return; // error
                btn.classList.toggle('liked', result);
                const countEl = btn.querySelector('.like-count');
                if (countEl) {
                    const current = parseInt(countEl.textContent) || 0;
                    countEl.textContent = result ? current + 1 : Math.max(0, current - 1);
                }
            });
        });
    };

    const slugify = (text) => {
        return text.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 60);
    };

    // ── Init — wait for blog cards to be loaded ──
    const init = () => {
        // BlogLoader renders cards async, so wait a bit
        setTimeout(() => enhanceCards(), 3000);
    };

    return { init, enhanceCards };
})();

document.addEventListener('DOMContentLoaded', () => BlogEngagement.init());
