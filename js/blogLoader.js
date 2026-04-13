/* =============================================
   BLOG LOADER — Static blog with JSON data source
   Load posts from data/blog.json.
   Can upgrade to Firebase/Supabase backend later.
   ============================================= */

const BlogLoader = (() => {
    const DATA_URL = 'data/blog.json';
    const CONTAINER_ID = 'blogGrid';
    const INITIAL_SHOW = 3;

    let allPosts = [];
    let showing = INITIAL_SHOW;

    // ── Fetch blog posts ──
    const fetchPosts = async () => {
        try {
            const res = await fetch(DATA_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.posts || [];
        } catch (error) {
            console.warn('BlogLoader: Could not fetch blog.json', error);
            return [];
        }
    };

    // ── Render a blog card ──
    const renderCard = (post) => {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const tagHTML = (post.tags || []).map(t => `<span class="blog-tag">${t}</span>`).join('');

        return `
            <article class="blog-card glass-card card-3d" data-tilt>
                ${post.cover ? `
                <div class="blog-card-cover">
                    <img src="${post.cover}" alt="${post.title}" loading="lazy" />
                    <span class="blog-card-category">${post.category || 'Tech'}</span>
                </div>` : ''}
                <div class="blog-card-body">
                    <div class="blog-card-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-clock"></i> ${post.readTime || '5 min'} read</span>
                    </div>
                    <h3 class="blog-card-title">${post.title}</h3>
                    <p class="blog-card-excerpt">${post.excerpt}</p>
                    <div class="blog-card-tags">${tagHTML}</div>
                    <a href="${post.url || '#'}" class="blog-read-more" ${post.external ? 'target="_blank"' : ''}>
                        Read more <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    };

    // ── Render all ──
    const render = () => {
        const container = document.getElementById(CONTAINER_ID);
        if (!container || allPosts.length === 0) return;

        const visible = allPosts.slice(0, showing);
        const cardsHTML = visible.map(p => renderCard(p)).join('');

        const loadMoreHTML = showing < allPosts.length ? `
            <button class="btn btn-outline blog-load-more" id="blogLoadMore">
                <i class="fas fa-plus"></i> Load More Posts
            </button>
        ` : '';

        container.innerHTML = `
            <div class="blog-grid-inner">${cardsHTML}</div>
            ${loadMoreHTML}
        `;

        // Load more handler
        const loadMoreBtn = document.getElementById('blogLoadMore');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                showing += 3;
                render();
            });
        }
    };

    // ── Init ──
    const init = async () => {
        allPosts = await fetchPosts();
        if (allPosts.length > 0) {
            render();
        } else {
            // Hide blog section if no posts
            const section = document.getElementById('blog');
            if (section) section.style.display = 'none';
        }
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => BlogLoader.init());
