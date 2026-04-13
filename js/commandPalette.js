/* =============================================
   COMMAND PALETTE — Spotlight-style search
   Ctrl+K / Cmd+K to open
   Fuzzy search across sections, skills, experience
   Full keyboard navigation
   ============================================= */

(function () {
    'use strict';

    // ─── Searchable data ───
    const searchIndex = [
        // Navigation
        { type: 'nav', icon: 'fas fa-home',           label: 'Home',           section: '#hero',           keywords: 'home top hero start' },
        { type: 'nav', icon: 'fas fa-user',            label: 'About Me',       section: '#about',          keywords: 'about me info bio profile' },
        { type: 'nav', icon: 'fas fa-briefcase',       label: 'Experience',     section: '#experience',     keywords: 'experience work jobs career history' },
        { type: 'nav', icon: 'fas fa-code',            label: 'Skills',         section: '#skills',         keywords: 'skills tech stack tools programming' },
        { type: 'nav', icon: 'fas fa-laptop-code',     label: 'Projects',       section: '#projects',       keywords: 'projects portfolio work' },
        { type: 'nav', icon: 'fas fa-graduation-cap',  label: 'Education',      section: '#education',      keywords: 'education university degree college school' },
        { type: 'nav', icon: 'fas fa-certificate',     label: 'Certifications', section: '#certifications', keywords: 'certifications awards achievements badges' },
        { type: 'nav', icon: 'fas fa-paper-plane',     label: 'Contact',        section: '#contact',        keywords: 'contact email message query reach' },
        { type: 'nav', icon: 'fas fa-blog',             label: 'Blog',           section: '#blog',           keywords: 'blog articles posts insights writing' },
        { type: 'nav', icon: 'fas fa-sitemap',          label: 'Architecture',   section: '#architecture',   keywords: 'architecture tech stack how built system design' },

        // Experience
        { type: 'exp', icon: 'fas fa-building',  label: 'NetApp — Software Engineer 2',                    section: '#experience', keywords: 'netapp software engineer storage bengaluru current 2025' },
        { type: 'exp', icon: 'fas fa-plane',      label: 'Boeing — Embedded C++ Engineer',                  section: '#experience', keywords: 'boeing embedded c++ real-time websocket pxi 2024' },
        { type: 'exp', icon: 'fas fa-building',  label: 'Cognizant — Software Engineer',                   section: '#experience', keywords: 'cognizant nike converse feature store jira servicenow 2022 2024' },

        // Skills
        { type: 'skill', icon: 'fas fa-code',       label: 'C++',                           section: '#skills', keywords: 'c++ cplusplus programming language' },
        { type: 'skill', icon: 'fas fa-code',       label: 'Embedded C++',                   section: '#skills', keywords: 'embedded c++ hardware firmware' },
        { type: 'skill', icon: 'fas fa-code',       label: 'Python',                         section: '#skills', keywords: 'python scripting automation' },
        { type: 'skill', icon: 'fas fa-database',   label: 'SQL',                            section: '#skills', keywords: 'sql database query structured' },
        { type: 'skill', icon: 'fas fa-code',       label: 'STL (Standard Template Library)', section: '#skills', keywords: 'stl standard template library containers' },
        { type: 'skill', icon: 'fas fa-microchip',  label: 'Embedded Systems',               section: '#skills', keywords: 'embedded systems hardware firmware iot' },
        { type: 'skill', icon: 'fas fa-sitemap',    label: 'Data Structures',                section: '#skills', keywords: 'data structures algorithms dsa' },
        { type: 'skill', icon: 'fas fa-object-group', label: 'OOP',                          section: '#skills', keywords: 'oop object oriented programming design' },
        { type: 'skill', icon: 'fas fa-layer-group', label: 'Multithreading',                section: '#skills', keywords: 'multithreading concurrency parallel threads' },
        { type: 'skill', icon: 'fas fa-cogs',       label: 'Jenkins',                        section: '#skills', keywords: 'jenkins ci build automation pipeline' },
        { type: 'skill', icon: 'fas fa-infinity',   label: 'CI/CD',                          section: '#skills', keywords: 'ci cd continuous integration deployment devops' },
        { type: 'skill', icon: 'fab fa-docker',     label: 'Docker',                         section: '#skills', keywords: 'docker containers devops microservices' },
        { type: 'skill', icon: 'fab fa-gitlab',     label: 'GitLab',                         section: '#skills', keywords: 'gitlab git version control repository' },
        { type: 'skill', icon: 'fab fa-linux',      label: 'Linux',                          section: '#skills', keywords: 'linux ubuntu terminal bash shell' },
        { type: 'skill', icon: 'fas fa-network-wired', label: 'Wireshark',                   section: '#skills', keywords: 'wireshark networking packets protocol analysis' },

        // Projects
        { type: 'project', icon: 'fas fa-brain', label: 'Brain Tumor Detection (Deep Learning)', section: '#projects', keywords: 'brain tumor detection deep learning mri python machine learning ai' },
        { type: 'project', icon: 'fas fa-broadcast-tower', label: 'Real-Time Data Streaming Interface', section: '#projects', keywords: 'data streaming websocket c++ real-time pxi boeing' },
        { type: 'project', icon: 'fas fa-globe', label: 'Portfolio — 3D Interactive Experience', section: '#projects', keywords: 'portfolio website threejs 3d interactive' },
        { type: 'project', icon: 'fas fa-microchip', label: 'Flight Data Acquisition Module', section: '#projects', keywords: 'flight data acquisition embedded boeing can gps serial' },

        // Education
        { type: 'edu', icon: 'fas fa-graduation-cap', label: 'VSSUT Burla — B.Tech',                section: '#education', keywords: 'vssut burla btech engineering university 2022' },
        { type: 'edu', icon: 'fas fa-school',          label: 'KV Koliwada — Class XII',             section: '#education', keywords: 'kendriya vidyalaya koliwada class 12 xii 2018' },
        { type: 'edu', icon: 'fas fa-school',          label: 'KV Koliwada — Class X',               section: '#education', keywords: 'kendriya vidyalaya koliwada class 10 x 2016' },

        // Certs
        { type: 'cert', icon: 'fab fa-microsoft', label: 'Azure Fundamentals (AZ-900)',              section: '#certifications', keywords: 'azure az-900 fundamentals microsoft cloud' },
        { type: 'cert', icon: 'fab fa-microsoft', label: 'Azure Administrator Associate',            section: '#certifications', keywords: 'azure administrator associate microsoft cloud az-104' },

        // Actions
        { type: 'action', icon: 'fas fa-envelope',  label: 'Send Email',      action: 'mailto',    keywords: 'email mail send message contact' },
        { type: 'action', icon: 'fab fa-linkedin',  label: 'Open LinkedIn',   action: 'linkedin',  keywords: 'linkedin social professional network' },
        { type: 'action', icon: 'fab fa-github',    label: 'Open GitHub',     action: 'github',    keywords: 'github code repository open source' },
        { type: 'action', icon: 'fas fa-robot',     label: 'Open AI Chatbot', action: 'chatbot',   keywords: 'chatbot ai assistant ask question gemini' },
        { type: 'action', icon: 'fas fa-moon',      label: 'Toggle Theme',    action: 'theme',     keywords: 'theme dark light mode toggle switch color' },
        { type: 'action', icon: 'fas fa-arrow-up',  label: 'Back to Top',     action: 'top',       keywords: 'top scroll up beginning start' },
        { type: 'action', icon: 'fas fa-file-download', label: 'Download Resume', action: 'resume', keywords: 'resume download cv pdf' },
    ];

    // ─── Type labels & colors ───
    const typeLabels = {
        nav:     'Navigate',
        exp:     'Experience',
        skill:   'Skill',
        project: 'Project',
        edu:     'Education',
        cert:    'Certification',
        action:  'Action'
    };

    // ─── Fuzzy match scoring ───
    function fuzzyScore(query, text) {
        query = query.toLowerCase();
        text = text.toLowerCase();

        if (text === query) return 100;
        if (text.startsWith(query)) return 90;
        if (text.includes(query)) return 70;

        // Character-by-character fuzzy
        let score = 0, qi = 0;
        for (let i = 0; i < text.length && qi < query.length; i++) {
            if (text[i] === query[qi]) {
                score += (i === 0 || text[i - 1] === ' ') ? 15 : 10;
                qi++;
            }
        }
        return qi === query.length ? score : 0;
    }

    function searchItems(query) {
        if (!query.trim()) return searchIndex.slice(0, 8); // Show nav items by default

        const scored = searchIndex.map(item => {
            const labelScore = fuzzyScore(query, item.label);
            const keywordScore = fuzzyScore(query, item.keywords);
            const typeScore = fuzzyScore(query, typeLabels[item.type] || '');
            return { item, score: Math.max(labelScore, keywordScore * 0.8, typeScore * 0.6) };
        }).filter(x => x.score > 0);

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 10).map(x => x.item);
    }

    // ─── Create DOM ───
    const overlay = document.createElement('div');
    overlay.className = 'cmd-palette-overlay';
    overlay.innerHTML = `
        <div class="cmd-palette">
            <div class="cmd-input-row">
                <i class="fas fa-search cmd-search-icon"></i>
                <input type="text" class="cmd-input" placeholder="Search sections, skills, actions..." autocomplete="off" spellcheck="false" />
                <kbd class="cmd-kbd">ESC</kbd>
            </div>
            <div class="cmd-results"></div>
            <div class="cmd-footer">
                <span><kbd>↑↓</kbd> Navigate</span>
                <span><kbd>↵</kbd> Select</span>
                <span><kbd>ESC</kbd> Close</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.cmd-input');
    const resultsContainer = overlay.querySelector('.cmd-results');
    let activeIndex = 0;

    // ─── Render results ───
    function renderResults(items) {
        if (items.length === 0) {
            resultsContainer.innerHTML = '<div class="cmd-empty"><i class="fas fa-search"></i> No results found</div>';
            return;
        }

        resultsContainer.innerHTML = items.map((item, i) => `
            <button class="cmd-result ${i === activeIndex ? 'active' : ''}" data-index="${i}">
                <div class="cmd-result-icon"><i class="${item.icon}"></i></div>
                <div class="cmd-result-info">
                    <span class="cmd-result-label">${highlightMatch(item.label, input.value)}</span>
                    <span class="cmd-result-type">${typeLabels[item.type] || item.type}</span>
                </div>
                <i class="fas fa-arrow-right cmd-result-arrow"></i>
            </button>
        `).join('');

        // Click handlers
        resultsContainer.querySelectorAll('.cmd-result').forEach(btn => {
            btn.addEventListener('click', () => {
                executeItem(items[parseInt(btn.dataset.index)]);
            });
            btn.addEventListener('mouseenter', () => {
                activeIndex = parseInt(btn.dataset.index);
                updateActive();
            });
        });
    }

    function highlightMatch(text, query) {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function updateActive() {
        const items = resultsContainer.querySelectorAll('.cmd-result');
        items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
        items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }

    // ─── Execute selected item ───
    function executeItem(item) {
        closePalette();

        if (item.type === 'action') {
            switch (item.action) {
                case 'mailto':
                    window.location.href = 'mailto:aren.saty@gmail.com';
                    break;
                case 'linkedin':
                    window.open('https://www.linkedin.com/in/aren-satpathy-84793897/', '_blank');
                    break;
                case 'github':
                    window.open('https://github.com/aren-saty', '_blank');
                    break;
                case 'chatbot':
                    document.getElementById('chatbotToggle')?.click();
                    break;
                case 'theme':
                    window.dispatchEvent(new CustomEvent('toggle-theme'));
                    break;
                case 'top':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'resume':
                    if (window.ResumeTracker) window.ResumeTracker.download();
                    break;
            }
            return;
        }

        if (item.section) {
            const target = document.querySelector(item.section);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Flash highlight
                target.style.transition = 'box-shadow 0.3s';
                target.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.4)';
                setTimeout(() => { target.style.boxShadow = ''; }, 1500);
            }
        }
    }

    // ─── Open / Close ───
    function openPalette() {
        overlay.classList.add('open');
        input.value = '';
        activeIndex = 0;
        renderResults(searchItems(''));
        setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
        overlay.classList.remove('open');
        input.value = '';
    }

    // ─── Keyboard shortcut ───
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            overlay.classList.contains('open') ? closePalette() : openPalette();
        }
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            closePalette();
        }
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
    });

    // ─── Input handling ───
    input.addEventListener('input', () => {
        activeIndex = 0;
        renderResults(searchItems(input.value));
    });

    input.addEventListener('keydown', (e) => {
        const items = resultsContainer.querySelectorAll('.cmd-result');
        const count = items.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % count;
            updateActive();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + count) % count;
            updateActive();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchItems(input.value);
            if (results[activeIndex]) executeItem(results[activeIndex]);
        }
    });

    // Expose open function for external triggers
    window.openCommandPalette = openPalette;
})();
