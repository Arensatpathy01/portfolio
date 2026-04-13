/* =============================================
   GITHUB STATS — Live GitHub API Integration
   Fetches public repos, languages, contributions.
   No API key needed for public data (60 req/hr).
   ============================================= */

const GitHubStats = (() => {
    const USERNAME = 'aren-saty'; // ← Replace with your actual GitHub username
    const API_BASE = 'https://api.github.com';
    const CACHE_KEY = 'github_stats_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 min cache

    let statsData = null;

    // ── Fetch with caching ──
    const fetchWithCache = async () => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                statsData = data;
                return data;
            }
        }
        return await fetchFreshData();
    };

    // ── Fetch from GitHub API ──
    const fetchFreshData = async () => {
        try {
            const [userRes, reposRes] = await Promise.all([
                fetch(`${API_BASE}/users/${USERNAME}`),
                fetch(`${API_BASE}/users/${USERNAME}/repos?per_page=100&sort=updated`)
            ]);

            if (!userRes.ok || !reposRes.ok) throw new Error('GitHub API error');

            const user = await userRes.json();
            const repos = await reposRes.json();

            // Calculate language stats
            const langMap = {};
            let totalBytes = 0;
            repos.forEach(repo => {
                if (repo.language) {
                    langMap[repo.language] = (langMap[repo.language] || 0) + (repo.size || 1);
                    totalBytes += repo.size || 1;
                }
            });

            // Sort languages by usage
            const languages = Object.entries(langMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([name, bytes]) => ({
                    name,
                    percentage: Math.round((bytes / totalBytes) * 100),
                    color: getLangColor(name)
                }));

            // Top repositories
            const topRepos = repos
                .filter(r => !r.fork)
                .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
                .slice(0, 6)
                .map(r => ({
                    name: r.name,
                    description: r.description || 'No description',
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    language: r.language,
                    url: r.html_url,
                    updated: new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                }));

            const data = {
                profile: {
                    login: user.login,
                    name: user.name || user.login,
                    avatar: user.avatar_url,
                    bio: user.bio,
                    publicRepos: user.public_repos,
                    followers: user.followers,
                    following: user.following,
                    url: user.html_url,
                    createdAt: new Date(user.created_at).getFullYear()
                },
                totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
                totalForks: repos.reduce((sum, r) => sum + r.forks_count, 0),
                languages,
                topRepos
            };

            // Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
            statsData = data;
            return data;
        } catch (error) {
            console.warn('GitHub API fetch failed:', error);
            return null;
        }
    };

    // ── Language colors (GitHub official) ──
    const getLangColor = (lang) => {
        const colors = {
            'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
            'C++': '#f34b7d', 'C': '#555555', 'Java': '#b07219', 'Go': '#00ADD8',
            'Rust': '#dea584', 'HTML': '#e34c26', 'CSS': '#563d7c', 'Shell': '#89e051',
            'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138', 'Kotlin': '#A97BFF',
            'Dart': '#00B4AB', 'C#': '#178600', 'Jupyter Notebook': '#DA5B0B'
        };
        return colors[lang] || '#8b949e';
    };

    // ── Render GitHub Stats Card ──
    const renderCard = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container || !statsData) return;

        const { profile, totalStars, totalForks, languages, topRepos } = statsData;

        container.innerHTML = `
            <div class="github-card glass-card">
                <div class="github-card-header">
                    <div class="github-avatar-area">
                        <img src="${profile.avatar}" alt="${profile.name}" class="github-avatar" loading="lazy" />
                        <div class="github-user-info">
                            <h3><i class="fab fa-github"></i> ${profile.name}</h3>
                            <a href="${profile.url}" target="_blank" class="github-handle">@${profile.login}</a>
                        </div>
                    </div>
                    <a href="${profile.url}" target="_blank" class="btn btn-outline btn-sm">
                        <i class="fab fa-github"></i> View Profile
                    </a>
                </div>

                <div class="github-stats-row">
                    <div class="github-stat-item">
                        <span class="github-stat-number">${profile.publicRepos}</span>
                        <span class="github-stat-label">Repositories</span>
                    </div>
                    <div class="github-stat-item">
                        <span class="github-stat-number">${totalStars}</span>
                        <span class="github-stat-label">Stars</span>
                    </div>
                    <div class="github-stat-item">
                        <span class="github-stat-number">${totalForks}</span>
                        <span class="github-stat-label">Forks</span>
                    </div>
                    <div class="github-stat-item">
                        <span class="github-stat-number">${profile.followers}</span>
                        <span class="github-stat-label">Followers</span>
                    </div>
                </div>

                ${languages.length > 0 ? `
                <div class="github-languages">
                    <h4>Top Languages</h4>
                    <div class="github-lang-bar">
                        ${languages.map(l => `
                            <div class="github-lang-segment" style="width:${l.percentage}%;background:${l.color}" 
                                 title="${l.name}: ${l.percentage}%"></div>
                        `).join('')}
                    </div>
                    <div class="github-lang-legend">
                        ${languages.map(l => `
                            <span class="github-lang-item">
                                <span class="github-lang-dot" style="background:${l.color}"></span>
                                ${l.name} <span class="github-lang-pct">${l.percentage}%</span>
                            </span>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${topRepos.length > 0 ? `
                <div class="github-repos">
                    <h4>Top Repositories</h4>
                    <div class="github-repos-grid">
                        ${topRepos.map(r => `
                            <a href="${r.url}" target="_blank" class="github-repo-card">
                                <div class="github-repo-name"><i class="fas fa-book"></i> ${r.name}</div>
                                <p class="github-repo-desc">${r.description}</p>
                                <div class="github-repo-meta">
                                    ${r.language ? `<span><span class="github-lang-dot" style="background:${getLangColor(r.language)}"></span> ${r.language}</span>` : ''}
                                    ${r.stars > 0 ? `<span><i class="fas fa-star"></i> ${r.stars}</span>` : ''}
                                    ${r.forks > 0 ? `<span><i class="fas fa-code-branch"></i> ${r.forks}</span>` : ''}
                                    <span>${r.updated}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>` : ''}

                <div class="github-footer-note">
                    <i class="fas fa-sync-alt"></i> Live data from GitHub API · Cached for 30 min
                </div>
            </div>
        `;
    };

    // ── Init ──
    const init = async (containerId = 'githubStats') => {
        const data = await fetchWithCache();
        if (data) {
            renderCard(containerId);
        } else {
            // Show fallback
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="github-card glass-card github-fallback">
                        <div class="github-card-header">
                            <h3><i class="fab fa-github"></i> GitHub</h3>
                            <a href="https://github.com/${USERNAME}" target="_blank" class="btn btn-outline btn-sm">
                                <i class="fab fa-github"></i> View Profile
                            </a>
                        </div>
                        <p class="github-fallback-text">
                            <i class="fas fa-code-branch"></i> Check out my projects and contributions on GitHub
                        </p>
                    </div>
                `;
            }
        }
    };

    return { init, fetchWithCache, renderCard };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => GitHubStats.init());
