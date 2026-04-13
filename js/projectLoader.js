/* =============================================
   DYNAMIC PROJECT LOADER
   Loads projects from JSON data source.
   Database-ready architecture — swap JSON for
   API endpoint when you add a backend.
   ============================================= */

const ProjectLoader = (() => {
    const CONTAINER_ID = 'projectsGrid';
    const DATA_URL = 'data/projects.json';

    // ── Fetch projects ──
    const fetchProjects = async () => {
        try {
            const res = await fetch(DATA_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.projects || [];
        } catch (error) {
            console.warn('ProjectLoader: Could not fetch projects.json, using inline fallback.', error);
            return null; // null = use existing HTML (graceful fallback)
        }
    };

    // ── Render a single project card ──
    const renderCard = (project) => {
        const techTags = (project.tags || []).map(tag =>
            `<a href="${tag.url || '#'}" target="_blank"><span>${tag.name}</span></a>`
        ).join('');

        const links = [];
        if (project.github) links.push(`<a href="${project.github}" target="_blank" class="project-link"><i class="fab fa-github"></i> Code</a>`);
        if (project.demo) links.push(`<a href="${project.demo}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Demo</a>`);
        if (project.paper) links.push(`<a href="${project.paper}" target="_blank" class="project-link"><i class="fas fa-file-alt"></i> Paper</a>`);

        return `
            <div class="project-card glass-card card-3d" data-tilt>
                ${project.image ? `
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}" loading="lazy" />
                    ${project.status ? `<span class="project-badge project-badge-${project.status}">${project.status}</span>` : ''}
                </div>` : ''}
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    ${project.highlights && project.highlights.length > 0 ? `
                    <ul class="project-highlights">
                        ${project.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>` : ''}
                    <div class="project-meta">
                        ${project.duration ? `<span class="project-duration"><i class="fas fa-clock"></i> ${project.duration}</span>` : ''}
                        ${project.year ? `<span class="project-year"><i class="fas fa-calendar"></i> ${project.year}</span>` : ''}
                    </div>
                    ${links.length > 0 ? `<div class="project-links">${links.join('')}</div>` : ''}
                    <div class="tech-tags">${techTags}</div>
                </div>
            </div>
        `;
    };

    // ── Render all projects ──
    const render = (projects) => {
        const container = document.getElementById(CONTAINER_ID);
        if (!container || !projects || projects.length === 0) return;

        // Add filter tabs if multiple categories exist
        const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
        let filterHTML = '';
        if (categories.length > 1) {
            filterHTML = `
                <div class="project-filters">
                    <button class="project-filter active" data-filter="all">All</button>
                    ${categories.map(c => `<button class="project-filter" data-filter="${c}">${c}</button>`).join('')}
                </div>
            `;
        }

        container.innerHTML = filterHTML + `
            <div class="projects-grid-inner">
                ${projects.map(p => renderCard(p)).join('')}
            </div>
        `;

        // Add filter logic
        if (categories.length > 1) {
            const filterBtns = container.querySelectorAll('.project-filter');
            const cards = container.querySelectorAll('.project-card');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    cards.forEach((card, i) => {
                        const match = filter === 'all' || projects[i].category === filter;
                        card.style.display = match ? '' : 'none';
                        card.style.opacity = match ? '1' : '0';
                    });
                });
            });
        }

        // Re-init 3D tilt for dynamically loaded cards
        container.querySelectorAll('.project-card[data-tilt]').forEach(card => {
            if (window.matchMedia('(hover: none)').matches) return;
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(5px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.5s ease';
                setTimeout(() => { card.style.transition = ''; }, 500);
            });
        });
    };

    // ── Init ──
    const init = async () => {
        const projects = await fetchProjects();
        if (projects) {
            render(projects);
        }
        // If null (fetch failed), the existing HTML stays — graceful degradation
    };

    return { init, render, fetchProjects };
})();

document.addEventListener('DOMContentLoaded', () => ProjectLoader.init());
