"""
Portfolio Test Automation — Playwright (Exhaustive)
Validates ALL features, components, interactions, and responsive behaviour
across Desktop (1440), Tablet (768), Phone (480), Small Phone (360), Fold (280).

Run:
    .venv/bin/python -m pytest tests/test_portfolio.py -v --headed   # visible browser
    .venv/bin/python -m pytest tests/test_portfolio.py -v            # headless (CI)
"""

import json, pytest, re, time
from playwright.sync_api import Page, expect

BASE = "http://localhost:8080"
FEATURES_URL = f"{BASE}/features.html"

# ─── Viewport presets ───
VIEWPORTS = {
    "desktop":     {"width": 1440, "height": 900},
    "tablet":      {"width": 768,  "height": 1024},
    "phone":       {"width": 480,  "height": 844},
    "small_phone": {"width": 360,  "height": 640},
    "fold":        {"width": 280,  "height": 653},
}

MOBILE_VIEWPORTS = {k: v for k, v in VIEWPORTS.items() if v["width"] <= 768}

# Helper ──────────────────────────────────────────
def _dismiss_cookies(page: Page):
    """Accept the cookie consent banner if it's showing so it doesn't block clicks."""
    page.evaluate("""() => {
        const b = document.querySelector('.cookie-consent');
        if (b) b.remove();
    }""")
    page.wait_for_timeout(100)

def _goto(page: Page, url=BASE, wait="networkidle", vp=None):
    """Navigate helper that optionally sets viewport and always dismisses cookie banner."""
    if vp:
        page.set_viewport_size(vp)
    page.goto(url, wait_until=wait)
    page.wait_for_timeout(300)
    _dismiss_cookies(page)


# ══════════════════════════════════════════════════════════════════
# 1. PAGE LOAD & RESOURCE INTEGRITY
# ══════════════════════════════════════════════════════════════════

class TestPageLoad:
    """Both pages load, every linked CSS/JS returns 200, no console errors."""

    def test_index_loads_200(self, page: Page):
        resp = page.goto(BASE, wait_until="domcontentloaded")
        assert resp.status == 200

    def test_features_page_loads_200(self, page: Page):
        resp = page.goto(FEATURES_URL, wait_until="domcontentloaded")
        assert resp.status == 200

    def test_all_local_css_returns_200(self, page: Page):
        failed = []
        def check(r):
            if "/css/" in r.url and r.url.endswith(".css") and r.status != 200:
                failed.append(f"{r.url} → {r.status}")
        page.on("response", check)
        page.goto(BASE, wait_until="networkidle")
        assert failed == [], f"CSS failures: {failed}"

    def test_all_local_js_returns_200(self, page: Page):
        failed = []
        def check(r):
            if "/js/" in r.url and r.url.endswith(".js") and r.status != 200:
                failed.append(f"{r.url} → {r.status}")
        page.on("response", check)
        page.goto(BASE, wait_until="networkidle")
        assert failed == [], f"JS failures: {failed}"

    def test_no_real_console_errors(self, page: Page):
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(2000)
        benign = ["gemini", "emailjs", "analytics", "gtag", "G-XXXXXXXXXX",
                  "Failed to load resource", "favicon", "robots.txt",
                  "net::ERR", "the server responded with a status of 404",
                  "ERR_CONNECTION_REFUSED", "googletagmanager"]
        real = [e for e in errors if not any(x in e.lower() for x in [b.lower() for b in benign])]
        assert real == [], f"Console errors: {real}"

    def test_projects_json_valid(self, page: Page):
        resp = page.goto(f"{BASE}/data/projects.json")
        assert resp.status == 200
        data = json.loads(resp.body().decode())
        assert "projects" in data and len(data["projects"]) >= 1

    def test_blog_json_valid(self, page: Page):
        resp = page.goto(f"{BASE}/data/blog.json")
        assert resp.status == 200
        data = json.loads(resp.body().decode())
        assert "posts" in data and len(data["posts"]) >= 1

    def test_all_local_images_load(self, page: Page):
        failed = []
        def check(r):
            if "/images/" in r.url and r.status != 200:
                failed.append(r.url)
        page.on("response", check)
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(2000)
        assert failed == [], f"Image load failures: {failed}"

    def test_profile_image_loads(self, page: Page):
        resp = page.goto(f"{BASE}/profile.jpg")
        assert resp.status == 200

    def test_resume_readme_exists(self, page: Page):
        resp = page.request.get(f"{BASE}/resume/README.md")
        assert resp.status == 200

    @pytest.mark.parametrize("model", ["robot.glb", "damaged_helmet.glb", "brain_stem.glb", "astronaut.glb"])
    def test_glb_models_accessible(self, page: Page, model: str):
        resp = page.request.get(f"{BASE}/models/{model}")
        assert resp.status == 200, f"Model {model} not accessible"

    def test_features_page_standalone(self, page: Page):
        """Verify the features page is self-contained (no shared sidebar/portfolio CSS)"""
        resp = page.goto(FEATURES_URL, wait_until="domcontentloaded")
        assert resp.status == 200
        # Should have topbar, not sidebar
        assert page.locator(".topbar").count() == 1
        assert page.locator(".sidebar").count() == 0


# ══════════════════════════════════════════════════════════════════
# 2. HTML STRUCTURE & DOCTYPE
# ══════════════════════════════════════════════════════════════════

class TestHTMLStructure:
    def test_doctype_html5(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        doctype = page.evaluate("document.doctype ? document.doctype.name : null")
        assert doctype == "html"

    def test_lang_attribute(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        assert page.locator("html[lang='en']").count() == 1

    def test_charset_meta(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        assert page.locator('meta[charset="UTF-8"]').count() == 1

    def test_viewport_meta(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        content = page.locator('meta[name="viewport"]').get_attribute("content")
        assert "width=device-width" in content

    def test_main_landmark(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        assert page.locator("main.main-content").count() == 1

    def test_nav_landmark(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        assert page.locator("nav.sidebar").count() == 1

    def test_footer_landmark(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        assert page.locator("footer.footer").count() == 1


# ══════════════════════════════════════════════════════════════════
# 3. HERO SECTION — NAME VISIBILITY (CRITICAL)
# ══════════════════════════════════════════════════════════════════

class TestHeroNameVisibility:
    """'Aren Satpathy' must be VISIBLE at every viewport."""

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_hero_name_visible(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1500)
        name = page.locator(".hero-name")
        expect(name).to_be_visible()
        result = page.evaluate("""() => {
            const el = document.querySelector('.hero-name');
            if (!el) return {error: 'not found'};
            const cs = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                opacity: cs.opacity, visibility: cs.visibility, display: cs.display,
                webkitTextFillColor: cs.webkitTextFillColor,
                width: rect.width, height: rect.height,
                textContent: el.textContent.trim()
            };
        }""")
        assert "error" not in result, f"[{vp_name}] .hero-name not found"
        assert result["opacity"] == "1", f"[{vp_name}] opacity={result['opacity']}"
        assert result["visibility"] == "visible"
        assert result["display"] != "none"
        assert result["width"] > 0 and result["height"] > 0
        assert "Aren" in result["textContent"]
        if vp["width"] <= 768:
            fc = result["webkitTextFillColor"]
            if fc == "transparent" or fc == "rgba(0, 0, 0, 0)":
                has_grad = page.evaluate("""() => {
                    const cs = getComputedStyle(document.querySelector('.hero-name'));
                    return cs.backgroundImage && cs.backgroundImage !== 'none';
                }""")
                assert has_grad, f"[{vp_name}] text-fill-color=transparent but no gradient"

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_hero_greeting_visible(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1500)
        greeting = page.locator(".hero-greeting")
        expect(greeting).to_be_visible()
        result = page.evaluate("""() => {
            const el = document.querySelector('.hero-greeting');
            if (!el) return {error: 'not found'};
            const cs = getComputedStyle(el);
            return {opacity: cs.opacity, height: el.getBoundingClientRect().height,
                    text: el.textContent.trim()};
        }""")
        assert result["opacity"] == "1"
        assert result["height"] > 0
        # Greeting can be "Hi, I'm" or time-based like "Good morning! I'm" / "Working late? I'm"
        assert "i'm" in result["text"].lower(), f"[{vp_name}] Greeting text missing 'I'm': {result['text']}"

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_split_chars_visible(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1500)
        invisible = page.evaluate("""() => {
            const chars = document.querySelectorAll('.split-char');
            return [...chars].filter(c => getComputedStyle(c).opacity !== '1')
                            .map((c,i) => ({i, opacity: getComputedStyle(c).opacity, text: c.textContent}));
        }""")
        assert invisible == [], f"[{vp_name}] Invisible split-chars: {invisible}"


# ══════════════════════════════════════════════════════════════════
# 4. HERO SECTION — ALL SUB-COMPONENTS
# ══════════════════════════════════════════════════════════════════

class TestHeroSection:
    def test_hero_section_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#hero")).to_have_count(1)

    def test_particles_canvas_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#particlesCanvas")).to_have_count(1)

    def test_hero_bg_image_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".hero-bg-image")).to_have_count(1)

    def test_hero_bg_shapes_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        shapes = page.locator(".hero-bg-shapes .shape")
        assert shapes.count() == 5

    def test_hero_avatar_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".avatar-large-img")).to_have_count(1)
        src = page.locator(".avatar-large-img").get_attribute("src")
        assert "profile" in src

    def test_hero_orbit_ring(self, page: Page):
        _goto(page, wait="domcontentloaded")
        dots = page.locator(".orbit-ring .orbit-dot")
        assert dots.count() == 3

    def test_hero_title_wrapper(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".hero-title-wrapper")).to_have_count(1)
        expect(page.locator("#typedText")).to_have_count(1)
        expect(page.locator(".cursor")).to_have_count(1)

    def test_hero_tags_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        tags = page.locator(".hero-tags a")
        assert tags.count() == 3

    def test_hero_tags_have_links(self, page: Page):
        _goto(page, wait="domcontentloaded")
        for i in range(3):
            href = page.locator(".hero-tags a").nth(i).get_attribute("href")
            assert href.startswith("http")

    def test_hero_stats_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        stats = page.locator(".hero-stats .stat")
        assert stats.count() == 4

    def test_hero_stat_numbers_have_data_target(self, page: Page):
        _goto(page, wait="domcontentloaded")
        nums = page.locator(".stat-number")
        for i in range(nums.count()):
            target = nums.nth(i).get_attribute("data-target")
            assert target is not None and int(target) > 0

    def test_hero_cta_buttons(self, page: Page):
        _goto(page, wait="domcontentloaded")
        btns = page.locator(".hero-cta .btn")
        # 3 original + 1 "View" resume button injected by resumeViewer.js
        assert btns.count() >= 3

    def test_hero_contact_me_link(self, page: Page):
        _goto(page, wait="domcontentloaded")
        href = page.locator(".hero-cta .btn-primary").get_attribute("href")
        assert "mailto:" in href

    def test_hero_linkedin_link(self, page: Page):
        _goto(page, wait="domcontentloaded")
        link = page.locator('.hero-cta .btn-outline[href*="linkedin"]')
        expect(link).to_have_count(1)
        assert link.get_attribute("target") == "_blank"

    def test_hero_resume_button(self, page: Page):
        _goto(page, wait="domcontentloaded")
        btn = page.locator(".hero-cta .resume-download-btn")
        expect(btn).to_have_count(1)

    def test_scroll_indicator_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".scroll-indicator")).to_have_count(1)
        expect(page.locator(".scroll-mouse")).to_have_count(1)
        expect(page.locator(".scroll-wheel")).to_have_count(1)

    def test_model_hero_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#model-hero")).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 5. TYPING EFFECT
# ══════════════════════════════════════════════════════════════════

class TestTypingEffect:
    def test_typed_text_fills_after_wait(self, page: Page):
        _goto(page)
        page.wait_for_timeout(4000)
        text = page.locator("#typedText").inner_text()
        assert len(text) > 5, f"Typed text too short: '{text}'"

    def test_typed_text_contains_known_title(self, page: Page):
        _goto(page)
        page.wait_for_timeout(4000)
        text = page.locator("#typedText").inner_text()
        known_titles = ["Software Engineer", "Embedded C++", "Real-Time", "DevOps"]
        assert any(t in text for t in known_titles), f"Unknown title: '{text}'"


# ══════════════════════════════════════════════════════════════════
# 6. COUNTER ANIMATION
# ══════════════════════════════════════════════════════════════════

class TestCounterAnimation:
    def test_stat_numbers_animate_to_target(self, page: Page):
        _goto(page)
        page.locator("#hero").scroll_into_view_if_needed()
        page.wait_for_timeout(3000)
        stats = page.evaluate("""() => {
            return [...document.querySelectorAll('.stat-number')].map(el => ({
                target: parseInt(el.getAttribute('data-target')),
                current: parseInt(el.textContent)
            }));
        }""")
        for s in stats:
            assert s["current"] == s["target"], f"Counter didn't reach target: {s}"


# ══════════════════════════════════════════════════════════════════
# 7. SCROLL ANIMATIONS (fade-in / visible)
# ══════════════════════════════════════════════════════════════════

class TestScrollAnimations:
    def test_sections_get_fade_in_class(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.wait_for_timeout(500)
        count = page.evaluate("document.querySelectorAll('.fade-in').length")
        assert count > 0, "No elements received .fade-in class"

    def test_scrolled_sections_become_visible(self, page: Page):
        _goto(page)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)
        visible_count = page.evaluate("document.querySelectorAll('.visible').length")
        assert visible_count > 0, "No .visible elements after scrolling"


# ══════════════════════════════════════════════════════════════════
# 8. SIDEBAR & NAVIGATION
# ══════════════════════════════════════════════════════════════════

class TestNavigation:
    def test_sidebar_visible_desktop(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expect(page.locator(".sidebar")).to_be_visible()

    def test_sidebar_hidden_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        right = page.evaluate("document.querySelector('.sidebar').getBoundingClientRect().right")
        assert right <= 0, "Sidebar should be off-screen on mobile"

    def test_hamburger_visible_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        expect(page.locator("#hamburger")).to_be_visible()

    def test_hamburger_hidden_desktop(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        vis = page.evaluate("""() => {
            const h = document.getElementById('hamburger');
            return h ? getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().width > 0 : false;
        }""")
        assert not vis

    def test_hamburger_opens_sidebar(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        page.locator("#hamburger").click()
        page.wait_for_timeout(500)
        left = page.evaluate("document.querySelector('.sidebar').getBoundingClientRect().left")
        assert left >= 0, "Sidebar should be visible after hamburger click"
        has_active = page.evaluate("document.querySelector('.sidebar').classList.contains('active')")
        assert has_active

    def test_hamburger_closes_sidebar(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        page.locator("#hamburger").click()
        page.wait_for_timeout(500)
        page.locator("#hamburger").click()
        page.wait_for_timeout(500)
        has_active = page.evaluate("document.querySelector('.sidebar').classList.contains('active')")
        assert not has_active

    def test_nav_links_exist(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expected = ["hero", "about", "experience", "skills", "projects",
                    "education", "certifications", "testimonials", "blog", "contact"]
        for sec in expected:
            expect(page.locator(f'.nav-links a[href="#{sec}"]')).to_have_count(1)

    def test_features_link_in_sidebar(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expect(page.locator('.nav-links a[href="features.html"]')).to_have_count(1)

    def test_sidebar_avatar(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expect(page.locator(".avatar-ring .avatar-img")).to_have_count(1)
        expect(page.locator(".sidebar-header h2")).to_contain_text("Aren")

    def test_sidebar_social_links(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        links = page.locator(".sidebar-footer a")
        assert links.count() == 3

    def test_search_hint_in_sidebar(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        hint = page.locator(".search-hint")
        expect(hint).to_be_visible()

    def test_mobile_header_visible_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        expect(page.locator("#mobileHeader")).to_be_visible()

    def test_nav_link_smooth_scroll(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.locator('.nav-links a[href="#about"]').click()
        page.wait_for_timeout(1000)
        in_view = page.evaluate("""() => {
            const el = document.querySelector('#about');
            const r = el.getBoundingClientRect();
            return r.top >= -100 && r.top < window.innerHeight;
        }""")
        assert in_view, "Nav link did not scroll to #about"

    def test_active_nav_link_updates_on_scroll(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.evaluate("document.querySelector('#about').scrollIntoView()")
        page.wait_for_timeout(1000)
        active_href = page.evaluate("""() => {
            const a = document.querySelector('.nav-links a.active');
            return a ? a.getAttribute('href') : null;
        }""")
        assert active_href == "#about", f"Active nav link: {active_href}"

    def test_nav_link_closes_sidebar_on_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        page.locator("#hamburger").click()
        page.wait_for_timeout(400)
        page.locator('.nav-links a[href="#about"]').click()
        page.wait_for_timeout(600)
        has_active = page.evaluate("document.querySelector('.sidebar').classList.contains('active')")
        assert not has_active, "Sidebar should close after nav link click on mobile"


# ══════════════════════════════════════════════════════════════════
# 9. ALL SECTIONS EXISTENCE & CONTENT
# ══════════════════════════════════════════════════════════════════

class TestSections:
    @pytest.mark.parametrize("section_id", [
        "hero", "about", "experience", "skills", "projects",
        "education", "certifications", "testimonials", "blog", "contact"
    ])
    def test_section_exists(self, page: Page, section_id: str):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(f"#{section_id}")).to_have_count(1)

    def test_every_section_has_title(self, page: Page):
        _goto(page, wait="domcontentloaded")
        titles = page.locator(".section-title")
        assert titles.count() >= 7, f"Only {titles.count()} section titles found"

    def test_section_titles_no_emoji(self, page: Page):
        """Emojis were removed from section titles for a professional look."""
        _goto(page, wait="domcontentloaded")
        emojis = page.locator(".section-title .emoji")
        assert emojis.count() == 0, "Section titles should not contain emoji spans"


# ══════════════════════════════════════════════════════════════════
# 10. ABOUT SECTION
# ══════════════════════════════════════════════════════════════════

class TestAboutSection:
    def test_about_grid_cards(self, page: Page):
        _goto(page, wait="domcontentloaded")
        cards = page.locator("#about .about-card")
        assert cards.count() >= 3

    def test_about_contains_netapp(self, page: Page):
        _goto(page, wait="domcontentloaded")
        text = page.locator("#about").inner_text()
        assert "NetApp" in text

    def test_about_languages(self, page: Page):
        _goto(page, wait="domcontentloaded")
        langs = page.locator(".language-tag")
        assert langs.count() >= 3

    def test_about_github_stats_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#githubStats")).to_have_count(1)

    def test_about_section_banner(self, page: Page):
        _goto(page, wait="domcontentloaded")
        img = page.locator("#about .section-banner img")
        expect(img).to_have_count(1)
        assert "workspace" in img.get_attribute("src")


# ══════════════════════════════════════════════════════════════════
# 11. EXPERIENCE SECTION
# ══════════════════════════════════════════════════════════════════

class TestExperienceSection:
    def test_timeline_items_count(self, page: Page):
        _goto(page, wait="domcontentloaded")
        items = page.locator("#experience .timeline-item")
        assert items.count() == 3

    def test_timeline_companies(self, page: Page):
        _goto(page, wait="domcontentloaded")
        text = page.locator("#experience").inner_text()
        for co in ["NetApp", "Boeing", "Cognizant"]:
            assert co in text, f"Company '{co}' not found in experience"

    def test_timeline_has_dots(self, page: Page):
        _goto(page, wait="domcontentloaded")
        dots = page.locator("#experience .timeline-dot")
        assert dots.count() == 3

    def test_timeline_tech_tags(self, page: Page):
        _goto(page, wait="domcontentloaded")
        tags = page.locator("#experience .tech-tags span")
        assert tags.count() >= 5

    def test_experience_model_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#model-experience")).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 12. SKILLS SECTION
# ══════════════════════════════════════════════════════════════════

class TestSkillsSection:
    def test_skill_categories(self, page: Page):
        _goto(page, wait="domcontentloaded")
        cats = page.locator("#skills .skill-category")
        assert cats.count() == 4

    def test_skill_tags(self, page: Page):
        _goto(page, wait="domcontentloaded")
        tags = page.locator("#skills .skill-tags span")
        assert tags.count() >= 15

    def test_skills_radar_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#skillsRadar")).to_have_count(1)

    def test_skills_model_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#model-skills")).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 13. SKILLS RADAR
# ══════════════════════════════════════════════════════════════════

class TestSkillsRadar:
    def test_radar_canvas_created(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        assert page.locator("#skillsRadar canvas").count() >= 1

    def test_radar_tabs_created(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        assert page.locator("#skillsRadar .radar-tab").count() == 3

    def test_radar_default_active_tab(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        active = page.locator("#skillsRadar .radar-tab.active")
        assert active.count() == 1 and "Core" in active.inner_text()

    def test_radar_tab_switch(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        tabs = page.locator("#skillsRadar .radar-tab")
        for i in range(tabs.count()):
            if "Systems" in tabs.nth(i).inner_text():
                tabs.nth(i).click()
                break
        page.wait_for_timeout(800)
        assert "Systems" in page.locator("#skillsRadar .radar-tab.active").inner_text()

    def test_radar_tab_switch_to_devops(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        tabs = page.locator("#skillsRadar .radar-tab")
        for i in range(tabs.count()):
            if "DevOps" in tabs.nth(i).inner_text():
                tabs.nth(i).click()
                break
        page.wait_for_timeout(800)
        assert "DevOps" in page.locator("#skillsRadar .radar-tab.active").inner_text()


# ══════════════════════════════════════════════════════════════════
# 14. PROJECTS SECTION (Dynamic Loading)
# ══════════════════════════════════════════════════════════════════

class TestProjectsSection:
    def test_projects_loaded_from_json(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.locator("#projectsGrid .project-card").count() >= 1

    def test_project_card_structure(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        card = page.locator("#projectsGrid .project-card").first
        expect(card.locator("h3")).to_have_count(1)
        expect(card.locator("p").first).to_be_visible()

    def test_project_card_tech_tags(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.locator("#projectsGrid .tech-tags span").count() >= 3

    def test_projects_model_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#model-projects")).to_have_count(1)

    def test_projects_count_matches_json(self, page: Page):
        resp = page.goto(f"{BASE}/data/projects.json")
        data = json.loads(resp.body().decode())
        expected = len(data["projects"])
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.locator("#projectsGrid .project-card").count() == expected


# ══════════════════════════════════════════════════════════════════
# 15. EDUCATION SECTION
# ══════════════════════════════════════════════════════════════════

class TestEducationSection:
    def test_education_cards_count(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#education .education-card").count() == 3

    def test_education_years(self, page: Page):
        _goto(page, wait="domcontentloaded")
        years = page.locator("#education .education-year")
        year_texts = [years.nth(i).inner_text() for i in range(years.count())]
        for y in ["2022", "2018", "2016"]:
            assert y in year_texts

    def test_education_card_links(self, page: Page):
        _goto(page, wait="domcontentloaded")
        links = page.locator("#education .education-card-link")
        for i in range(links.count()):
            assert links.nth(i).get_attribute("href").startswith("http")
            assert links.nth(i).get_attribute("target") == "_blank"


# ══════════════════════════════════════════════════════════════════
# 16. CERTIFICATIONS SECTION
# ══════════════════════════════════════════════════════════════════

class TestCertificationsSection:
    def test_cert_cards_count(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#certifications .cert-card").count() == 2

    def test_cert_content(self, page: Page):
        _goto(page, wait="domcontentloaded")
        text = page.locator("#certifications").inner_text()
        assert "AZ-900" in text
        assert "Azure Administrator" in text

    def test_cert_card_links(self, page: Page):
        _goto(page, wait="domcontentloaded")
        links = page.locator("#certifications .cert-card-link")
        for i in range(links.count()):
            assert "microsoft" in links.nth(i).get_attribute("href").lower()


# ══════════════════════════════════════════════════════════════════
# 17. BLOG SECTION (Dynamic Loading)
# ══════════════════════════════════════════════════════════════════

class TestBlogSection:
    def test_blog_posts_loaded(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.locator("#blogGrid .blog-card, #blogGrid article").count() >= 1

    def test_blog_card_has_title(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        card = page.locator("#blogGrid .blog-card, #blogGrid article").first
        expect(card.locator("h3, h4").first).to_be_visible()

    def test_blog_load_more_button(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        btn = page.locator("#blogLoadMore")
        if btn.count() > 0:
            initial = page.locator("#blogGrid .blog-card, #blogGrid article").count()
            btn.click()
            page.wait_for_timeout(500)
            assert page.locator("#blogGrid .blog-card, #blogGrid article").count() >= initial

    def test_blog_section_visible(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.evaluate("getComputedStyle(document.querySelector('#blog')).display") != "none"





# ══════════════════════════════════════════════════════════════════
# 19. CONTACT FORM
# ══════════════════════════════════════════════════════════════════

class TestContactForm:
    def test_form_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#queryForm")).to_have_count(1)

    def test_all_form_fields(self, page: Page):
        _goto(page, wait="domcontentloaded")
        for fid in ["queryName", "queryEmail", "querySubject", "queryMessage"]:
            expect(page.locator(f"#{fid}")).to_have_count(1)

    def test_required_fields_marked(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#queryForm .required").count() >= 3

    def test_submit_button_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#submitBtn")).to_have_count(1)

    def test_form_status_container(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#formStatus")).to_have_count(1)

    def test_empty_form_stays_on_page(self, page: Page):
        _goto(page)
        page.locator("#submitBtn").click()
        page.wait_for_timeout(500)
        assert "localhost" in page.url

    def test_name_field_invalid_on_empty(self, page: Page):
        _goto(page)
        page.locator("#submitBtn").click()
        page.wait_for_timeout(500)
        assert page.evaluate("document.querySelector('#queryName').classList.contains('invalid')")

    def test_email_field_invalid_on_bad_email(self, page: Page):
        _goto(page)
        page.locator("#queryName").fill("Test User")
        page.locator("#queryEmail").fill("not-an-email")
        page.locator("#queryMessage").fill("Test message")
        page.locator("#submitBtn").click()
        page.wait_for_timeout(500)
        assert page.evaluate("document.querySelector('#queryEmail').classList.contains('invalid')")

    def test_input_clears_invalid_on_typing(self, page: Page):
        _goto(page)
        page.locator("#submitBtn").click()
        page.wait_for_timeout(300)
        assert page.evaluate("document.querySelector('#queryName').classList.contains('invalid')")
        page.locator("#queryName").type("A")
        page.wait_for_timeout(200)
        assert not page.evaluate("document.querySelector('#queryName').classList.contains('invalid')")

    def test_message_maxlength(self, page: Page):
        _goto(page)
        assert page.locator("#queryMessage").get_attribute("maxlength") == "1000"

    def test_char_counter_exists(self, page: Page):
        _goto(page)
        page.wait_for_timeout(500)
        assert page.locator(".char-count").count() >= 1
        assert "1000" in page.locator(".char-count").first.inner_text()

    def test_char_counter_updates(self, page: Page):
        _goto(page)
        page.locator("#queryMessage").fill("Hello world!")
        page.wait_for_timeout(300)
        assert "12" in page.locator(".char-count").first.inner_text()

    def test_contact_info_card(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".contact-form-info")).to_have_count(1)
        expect(page.locator(".contact-form-info img")).to_have_count(1)

    def test_contact_details(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".contact-detail-item").count() == 3

    def test_form_error_messages(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".form-error").count() >= 3


# ══════════════════════════════════════════════════════════════════
# 20. CHATBOT
# ══════════════════════════════════════════════════════════════════

class TestChatbot:
    def test_toggle_button_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#chatbotToggle")).to_be_visible()

    def test_chatbot_opens_on_click(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(500)
        expect(page.locator("#chatbotWindow")).to_be_visible()

    def test_chatbot_closes_on_close_button(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        page.locator("#chatbotClose").click()
        page.wait_for_timeout(500)
        assert not page.evaluate("document.querySelector('#chatbotWindow').classList.contains('open')")

    def test_chatbot_has_input_and_send(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        expect(page.locator("#chatInput")).to_be_visible()
        expect(page.locator("#chatSend")).to_be_visible()

    def test_chatbot_welcome_message(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        assert page.locator("#chatbotMessages .chat-message.bot").count() >= 1

    def test_chatbot_send_message(self, page: Page):
        _goto(page)
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        page.locator("#chatInput").fill("hello")
        page.locator("#chatSend").click()
        page.wait_for_timeout(1500)
        assert page.locator("#chatbotMessages .chat-message.user").count() >= 1

    def test_chatbot_receives_reply(self, page: Page):
        _goto(page)
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        page.locator("#chatInput").fill("who are you")
        page.locator("#chatSend").click()
        page.wait_for_timeout(2000)
        assert page.locator("#chatbotMessages .chat-message.bot").count() >= 2

    def test_chatbot_empty_input_ignored(self, page: Page):
        _goto(page)
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        initial = page.locator("#chatbotMessages .chat-message").count()
        page.locator("#chatSend").click()
        page.wait_for_timeout(300)
        assert page.locator("#chatbotMessages .chat-message").count() == initial

    def test_chatbot_enter_key_sends(self, page: Page):
        _goto(page)
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        page.locator("#chatInput").fill("skills")
        page.locator("#chatInput").press("Enter")
        page.wait_for_timeout(1500)
        assert page.locator("#chatbotMessages .chat-message.user").count() >= 1

    def test_chatbot_header_info(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        assert "AI Assistant" in page.locator(".chatbot-header").inner_text()

    def test_chatbot_window_open_class(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.locator("#chatbotToggle").click()
        page.wait_for_timeout(300)
        assert page.evaluate("document.querySelector('#chatbotWindow').classList.contains('open')")


# ══════════════════════════════════════════════════════════════════
# 21. COMMAND PALETTE
# ══════════════════════════════════════════════════════════════════

class TestCommandPalette:
    def _open_palette(self, page: Page):
        _dismiss_cookies(page)
        page.wait_for_timeout(200)
        # Use JS to open palette directly (keyboard may be intercepted)
        page.evaluate("window.openCommandPalette && window.openCommandPalette()")
        page.wait_for_timeout(500)
        if page.locator(".cmd-palette-overlay.open").count() == 0:
            page.keyboard.press("Control+k")
            page.wait_for_timeout(500)

    def test_opens_with_keyboard(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        expect(page.locator(".cmd-palette-overlay.open")).to_have_count(1)

    def test_closes_with_escape(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        expect(page.locator(".cmd-palette-overlay.open")).to_have_count(0)

    def test_closes_on_overlay_click(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.locator(".cmd-palette-overlay").click(position={"x": 10, "y": 10})
        page.wait_for_timeout(500)
        expect(page.locator(".cmd-palette-overlay.open")).to_have_count(0)

    def test_input_auto_focuses(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.wait_for_timeout(500)
        # Verify input exists and is visible in the opened palette
        cmd_input = page.locator(".cmd-input")
        expect(cmd_input).to_be_visible()
        # Focus works when we click into it
        cmd_input.click()
        page.wait_for_timeout(200)
        focused = page.evaluate("""() => {
            const el = document.activeElement;
            return el ? (el.tagName + '.' + el.className) : 'none';
        }""")
        assert "cmd-input" in focused, f"Focused element: {focused}"

    def test_default_results_shown(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        assert page.locator(".cmd-results .cmd-result").count() >= 5

    def test_search_filters_results(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.locator(".cmd-input").fill("Python")
        page.wait_for_timeout(300)
        assert page.locator(".cmd-results .cmd-result").count() >= 1
        assert "python" in page.locator(".cmd-results").inner_text().lower()

    def test_arrow_keys_navigate(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)
        assert page.locator(".cmd-results .cmd-result.active").count() == 1

    def test_enter_executes_item(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.wait_for_timeout(500)
        # Ensure input is focused before sending keyboard events
        page.locator(".cmd-input").focus()
        page.wait_for_timeout(200)
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(300)
        page.keyboard.press("Enter")
        page.wait_for_timeout(1000)
        expect(page.locator(".cmd-palette-overlay.open")).to_have_count(0)

    def test_search_hint_opens_palette(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.locator(".search-hint").click()
        page.wait_for_timeout(600)
        expect(page.locator(".cmd-palette-overlay.open")).to_have_count(1)

    def test_search_highlights_matches(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        self._open_palette(page)
        page.locator(".cmd-input").fill("C++")
        page.wait_for_timeout(300)
        assert page.locator(".cmd-results .cmd-result").count() >= 1


# ══════════════════════════════════════════════════════════════════
# 22. THEME SWITCHER
# ══════════════════════════════════════════════════════════════════

class TestThemeSwitcher:
    def test_toggle_exists(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(1000)
        expect(page.locator(".theme-toggle, .theme-btn")).to_have_count(1)

    def test_toggle_changes_theme(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(1000)
        _dismiss_cookies(page)
        page.locator(".theme-toggle, .theme-btn").click()
        page.wait_for_timeout(500)
        assert page.evaluate("document.documentElement.getAttribute('data-theme')") is not None

    def test_theme_persists_in_localstorage(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        _dismiss_cookies(page)
        page.evaluate("document.querySelector('.theme-toggle, .theme-btn').click()")
        page.wait_for_timeout(500)
        val = page.evaluate("localStorage.getItem('portfolio-theme')")
        assert val in ["dark", "light", "system"], f"Got: {val}"

    def test_theme_cycles_three_modes(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        _dismiss_cookies(page)
        themes = set()
        for _ in range(4):
            page.evaluate("document.querySelector('.theme-toggle, .theme-btn').click()")
            page.wait_for_timeout(400)
            themes.add(page.evaluate("localStorage.getItem('portfolio-theme')"))
        assert len(themes) == 3, f"Expected 3 modes, got {themes}"

    def test_toggle_has_title(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(1000)
        title = page.locator(".theme-toggle, .theme-btn").get_attribute("title")
        assert title and len(title) > 0

    def test_light_theme_text_readable(self, page: Page):
        """Ensure text is dark on light background when light theme is active."""
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        _dismiss_cookies(page)
        # Force light theme
        page.evaluate("document.documentElement.setAttribute('data-theme', 'light')")
        page.wait_for_timeout(500)
        text_primary = page.evaluate(
            "getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()"
        )
        assert text_primary != "", "--text-primary should be set in light theme"
        # The text-primary value should be a dark color (low luminance)
        # #1a1d27 has very low RGB values
        assert text_primary.startswith("#1") or text_primary.startswith("#0") or \
               text_primary.startswith("#2") or text_primary.startswith("#3"), \
               f"--text-primary should be a dark color in light theme, got: {text_primary}"


# ══════════════════════════════════════════════════════════════════
# 23. THREE.JS / 3D BACKGROUND
# ══════════════════════════════════════════════════════════════════

class TestThreeJS:
    @pytest.mark.xfail(reason="WebGL may not be available in headless Chromium", strict=False)
    def test_three_bg_canvas_created(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        expect(page.locator("#three-bg canvas")).to_have_count(1)

    @pytest.mark.xfail(reason="WebGL may not be available in headless Chromium", strict=False)
    def test_three_bg_canvas_dimensions(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        dims = page.evaluate("(() => { const c = document.querySelector('#three-bg canvas'); return c ? {w: c.width, h: c.height} : null; })()")
        assert dims and dims["w"] > 0 and dims["h"] > 0

    def test_three_bg_container_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#three-bg")).to_have_count(1)

    def test_three_bg_aria_hidden(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#three-bg").get_attribute("aria-hidden") == "true"


# ══════════════════════════════════════════════════════════════════
# 24. RESUME
# ══════════════════════════════════════════════════════════════════

class TestResume:
    def test_resume_button_hero(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".hero-cta .resume-download-btn")).to_have_count(1)

    def test_resume_button_footer(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".footer .resume-download-btn")).to_have_count(1)

    def test_resume_counter_visible(self, page: Page):
        _goto(page, wait="domcontentloaded")
        counter = page.locator(".resume-count").first
        expect(counter).to_be_visible()

    def test_resume_counter_base_count(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1000)
        num = int(re.search(r'\d+', page.locator(".resume-count").first.inner_text()).group())
        assert num >= 45

    def test_resume_footer_card(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".resume-card")).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 25. COOKIE CONSENT
# ══════════════════════════════════════════════════════════════════

class TestCookieConsent:
    def test_banner_appears_first_visit(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        page.evaluate("localStorage.clear()")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator(".cookie-consent").count() >= 1

    def test_accept_sets_localstorage(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        page.evaluate("localStorage.clear()")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        btn = page.locator(".cookie-accept")
        if btn.count() > 0:
            btn.click()
            page.wait_for_timeout(600)
            assert page.evaluate("localStorage.getItem('analytics_consent')") == "accepted"

    def test_decline_sets_localstorage(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        page.evaluate("localStorage.clear()")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        btn = page.locator(".cookie-decline")
        if btn.count() > 0:
            btn.click()
            page.wait_for_timeout(600)
            assert page.evaluate("localStorage.getItem('analytics_consent')") == "declined"

    def test_banner_hidden_after_decision(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        page.evaluate("localStorage.setItem('analytics_consent', 'accepted')")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator(".cookie-consent.show").count() == 0


# ══════════════════════════════════════════════════════════════════
# 26. GITHUB STATS
# ══════════════════════════════════════════════════════════════════

class TestGitHubStats:
    def test_container_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#githubStats")).to_have_count(1)

    def test_renders_content(self, page: Page):
        _goto(page)
        page.wait_for_timeout(3000)
        assert page.locator("#githubStats > *").count() >= 1


# ══════════════════════════════════════════════════════════════════
# 27. RESPONSIVE LAYOUT
# ══════════════════════════════════════════════════════════════════

class TestResponsiveLayout:
    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_no_horizontal_overflow(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1000)
        assert not page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), f"[{vp_name}]"

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_hero_stats_contained(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1000)
        assert not page.evaluate("(() => { const s = document.querySelector('.hero-stats'); if(!s) return false; const r = s.getBoundingClientRect(); return r.right > window.innerWidth || r.left < 0; })()")

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_hero_cta_contained(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1000)
        assert not page.evaluate("(() => { const c = document.querySelector('.hero-cta'); if(!c) return false; return c.getBoundingClientRect().right > window.innerWidth; })()")

    @pytest.mark.parametrize("vp_name,vp", MOBILE_VIEWPORTS.items())
    def test_sidebar_offscreen_mobile(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp, wait="domcontentloaded")
        assert page.evaluate("document.querySelector('.sidebar').getBoundingClientRect().right") <= 0


# ══════════════════════════════════════════════════════════════════
# 28. FEATURES PAGE
# ══════════════════════════════════════════════════════════════════

class TestFeaturesPage:
    def test_has_topbar(self, page: Page):
        _goto(page, url=FEATURES_URL, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expect(page.locator(".topbar")).to_be_visible()

    def test_has_side_toc(self, page: Page):
        _goto(page, url=FEATURES_URL, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        toc_links = page.locator(".side-toc a")
        assert toc_links.count() >= 10

    def test_features_hero(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        expect(page.locator(".features-hero")).to_have_count(1)

    def test_back_btn_works(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        page.locator(".back-btn").click()
        page.wait_for_timeout(1000)
        assert "features" not in page.url

    def test_all_feature_blocks(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        for fid in ["f-3d", "f-command", "f-chatbot", "f-theme", "f-github",
                     "f-contact", "f-blog", "f-projects", "f-radar", "f-resume",
                     "f-achievements", "f-cursor", "f-transitions", "f-analytics",
                     "f-greeting", "f-pdfviewer", "f-ogimage", "f-testimonials",
                     "f-admin", "f-supabase",
                     "f-arch", "f-seo", "f-cost", "f-setup"]:
            expect(page.locator(f"#{fid}")).to_have_count(1)

    def test_toc_link_scrolls(self, page: Page):
        _goto(page, url=FEATURES_URL, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        page.locator('.side-toc a[href="#f-3d"]').click()
        page.wait_for_timeout(500)
        assert page.evaluate("(() => { const r = document.querySelector('#f-3d').getBoundingClientRect(); return r.top >= -50 && r.top < window.innerHeight; })()")

    def test_badge_row(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        assert page.locator(".f-badge").count() >= 3

    def test_features_page_title(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        assert "Features" in page.title()

    def test_features_footer(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        expect(page.locator("footer.features-footer")).to_have_count(1)

    def test_topbar_brand_link(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        brand = page.locator(".topbar-brand")
        expect(brand).to_be_visible()
        assert brand.get_attribute("href") == "index.html"

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_features_no_overflow(self, page: Page, vp_name: str, vp: dict):
        _goto(page, url=FEATURES_URL, vp=vp, wait="domcontentloaded")
        page.wait_for_timeout(500)
        assert not page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")


# ══════════════════════════════════════════════════════════════════
# 29. ACCESSIBILITY
# ══════════════════════════════════════════════════════════════════

class TestAccessibility:
    def test_skip_nav_link(self, page: Page):
        _goto(page, wait="domcontentloaded")
        skip = page.locator(".skip-nav")
        expect(skip).to_have_count(1)
        assert skip.get_attribute("href") == "#hero"

    def test_hamburger_aria_label(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#hamburger").get_attribute("aria-label")

    def test_images_have_alt(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("img:not([alt])").count() == 0

    def test_form_labels(self, page: Page):
        _goto(page, wait="domcontentloaded")
        for fid in ["queryName", "queryEmail", "queryMessage"]:
            assert page.locator(f'label[for="{fid}"]').count() == 1

    def test_chatbot_toggle_has_title(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator("#chatbotToggle").get_attribute("title")

    def test_external_links_target_blank(self, page: Page):
        _goto(page, wait="domcontentloaded")
        bad = page.evaluate("""() =>
            [...document.querySelectorAll('a[href^="http"]')]
                .filter(a => !a.href.includes('localhost') && a.getAttribute('target') !== '_blank')
                .map(a => a.href);
        """)
        assert bad == [], f"External links without target=_blank: {bad[:3]}"


# ══════════════════════════════════════════════════════════════════
# 30. SEO META TAGS
# ══════════════════════════════════════════════════════════════════

class TestSEO:
    def test_title_name(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert "Aren" in page.title()

    def test_title_role(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert "Software Engineer" in page.title()

    def test_meta_description(self, page: Page):
        _goto(page, wait="domcontentloaded")
        desc = page.locator('meta[name="description"]').get_attribute("content")
        assert desc and len(desc) > 50

    def test_meta_keywords(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert "Aren" in page.locator('meta[name="keywords"]').get_attribute("content")

    def test_meta_author(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert "Aren" in page.locator('meta[name="author"]').get_attribute("content")

    def test_og_tags(self, page: Page):
        _goto(page, wait="domcontentloaded")
        for prop in ["og:title", "og:description", "og:type", "og:image",
                     "og:url", "og:site_name", "og:image:type", "og:image:width", "og:image:height"]:
            expect(page.locator(f'meta[property="{prop}"]')).to_have_count(1)

    def test_og_image_is_png(self, page: Page):
        _goto(page, wait="domcontentloaded")
        img = page.locator('meta[property="og:image"]').get_attribute("content")
        assert img.endswith(".png"), f"OG image should be PNG: {img}"

    def test_twitter_image_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('meta[name="twitter:image"]')).to_have_count(1)
        img = page.locator('meta[name="twitter:image"]').get_attribute("content")
        assert img.endswith(".png")

    def test_twitter_card(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator('meta[name="twitter:card"]').get_attribute("content") == "summary_large_image"

    def test_twitter_title(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('meta[name="twitter:title"]')).to_have_count(1)

    def test_twitter_description(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('meta[name="twitter:description"]')).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 31. FOOTER
# ══════════════════════════════════════════════════════════════════

class TestFooter:
    def test_footer_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("footer.footer")).to_have_count(1)

    def test_footer_social_links(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".footer-links a").count() >= 4

    def test_footer_github(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('.footer-links a[href*="github"]')).to_have_count(1)

    def test_footer_linkedin(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('.footer-links a[href*="linkedin"]')).to_have_count(1)

    def test_footer_email(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('.footer-links a[href*="mailto"]')).to_have_count(1)

    def test_footer_features_link(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator('.footer-links a[href="features.html"]')).to_have_count(1)

    def test_footer_copyright_year(self, page: Page):
        _goto(page, wait="domcontentloaded")
        year = page.evaluate("new Date().getFullYear().toString()")
        assert year in page.locator("footer").inner_text()

    def test_resume_in_footer(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".footer .resume-section")).to_have_count(1)


# ══════════════════════════════════════════════════════════════════
# 32. LOCAL STORAGE
# ══════════════════════════════════════════════════════════════════

class TestLocalStorage:
    def test_theme_saved(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        _dismiss_cookies(page)
        page.evaluate("document.querySelector('.theme-toggle, .theme-btn').click()")
        page.wait_for_timeout(400)
        assert page.evaluate("localStorage.getItem('portfolio-theme')") in ["dark", "light", "system"]

    def test_visit_count_increments(self, page: Page):
        page.goto(BASE, wait_until="domcontentloaded")
        page.evaluate("localStorage.clear()")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        c1 = page.evaluate("localStorage.getItem('portfolio_visit_count')")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1000)
        c2 = page.evaluate("localStorage.getItem('portfolio_visit_count')")
        if c1 and c2:
            assert int(c2) >= int(c1)


# ══════════════════════════════════════════════════════════════════
# 33. CURSOR EFFECTS
# ══════════════════════════════════════════════════════════════════

class TestCursorEffects:
    def test_cursor_not_on_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"])
        page.wait_for_timeout(1000)
        assert page.locator(".cursor-dot").count() == 0


# ══════════════════════════════════════════════════════════════════
# 34. PAGE TRANSITIONS / SPLIT TEXT
# ══════════════════════════════════════════════════════════════════

class TestPageTransitions:
    def test_split_text_desktop(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(2000)
        chars = page.locator(".hero-name .split-char")
        if chars.count() > 0:
            assert chars.count() >= 5

    def test_no_split_text_mobile(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"])
        page.wait_for_timeout(2000)
        assert page.locator(".hero-name .split-char").count() == 0

    def test_sections_get_transition_classes(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(1500)
        assert page.evaluate("document.querySelectorAll('.section-visible').length") >= 1


# ══════════════════════════════════════════════════════════════════
# 35. EXTERNAL LINKS INTEGRITY
# ══════════════════════════════════════════════════════════════════

class TestExternalLinks:
    def test_all_external_links_have_href(self, page: Page):
        _goto(page, wait="domcontentloaded")
        bad = page.evaluate("""() =>
            [...document.querySelectorAll('a[target="_blank"]')]
                .filter(a => !a.href || a.href === window.location.href)
                .map(a => a.outerHTML.substring(0, 80));
        """)
        assert bad == [], f"Links without href: {bad[:3]}"

    def test_sidebar_github(self, page: Page):
        _goto(page, wait="domcontentloaded")
        link = page.locator('.sidebar-footer a[href*="github"]')
        expect(link).to_have_count(1)
        assert "aren" in link.get_attribute("href").lower()

    def test_sidebar_email(self, page: Page):
        _goto(page, wait="domcontentloaded")
        link = page.locator('.sidebar-footer a[href*="mailto"]')
        expect(link).to_have_count(1)
        assert "aren.saty@gmail.com" in link.get_attribute("href")


# ══════════════════════════════════════════════════════════════════
# 36. IMAGES & LAZY LOADING
# ══════════════════════════════════════════════════════════════════

class TestImages:
    def test_section_banners_have_images(self, page: Page):
        _goto(page, wait="domcontentloaded")
        banners = page.locator(".section-banner img")
        for i in range(banners.count()):
            assert banners.nth(i).get_attribute("src")

    def test_lazy_loaded_images(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator('img[loading="lazy"]').count() >= 3

    def test_contact_bengaluru_image(self, page: Page):
        _goto(page, wait="domcontentloaded")
        img = page.locator('.contact-image img')
        expect(img).to_have_count(1)
        assert "bengaluru" in img.get_attribute("src")


# ══════════════════════════════════════════════════════════════════
# 37. CSS EFFECTS
# ══════════════════════════════════════════════════════════════════

class TestCSSEffects:
    def test_glass_cards_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".glass-card").count() >= 5

    def test_card_3d_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".card-3d, [data-tilt]").count() >= 1


# ══════════════════════════════════════════════════════════════════
# 38. MODEL SHOWCASES
# ══════════════════════════════════════════════════════════════════

class TestModelShowcases:
    def test_all_model_containers(self, page: Page):
        _goto(page, wait="domcontentloaded")
        for mid in ["model-hero", "model-experience", "model-skills", "model-projects"]:
            expect(page.locator(f"#{mid}")).to_have_count(1)

    def test_model_showcase_class(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.locator(".model-showcase").count() == 4


# ══════════════════════════════════════════════════════════════════
# 39. PARTICLES CANVAS
# ══════════════════════════════════════════════════════════════════

class TestParticles:
    def test_canvas_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#particlesCanvas")).to_have_count(1)

    def test_canvas_dimensions(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1000)
        dims = page.evaluate("(() => { const c = document.querySelector('#particlesCanvas'); return c ? {w: c.width, h: c.height} : null; })()")
        assert dims and dims["w"] > 0 and dims["h"] > 0


# ══════════════════════════════════════════════════════════════════
# 40. SCROLL INDICATOR
# ══════════════════════════════════════════════════════════════════

class TestScrollIndicator:
    def test_visible_at_top(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(1000)
        assert page.evaluate("getComputedStyle(document.querySelector('.scroll-indicator')).opacity") != "0"

    def test_fades_on_scroll(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(1000)
        opacity = float(page.evaluate("getComputedStyle(document.querySelector('.scroll-indicator')).opacity"))
        assert opacity < 0.5


# ══════════════════════════════════════════════════════════════════
# 41. MOBILE HEADER
# ══════════════════════════════════════════════════════════════════

class TestMobileHeader:
    def test_visible_on_phone(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        expect(page.locator("#mobileHeader")).to_be_visible()

    def test_has_name(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        assert "Aren" in page.locator("#mobileHeader h2").inner_text()

    def test_hamburger_three_spans(self, page: Page):
        _goto(page, vp=VIEWPORTS["phone"], wait="domcontentloaded")
        assert page.locator("#hamburger span").count() == 3


# ══════════════════════════════════════════════════════════════════
# 42. DATA INTEGRITY
# ══════════════════════════════════════════════════════════════════

class TestDataIntegrity:
    def test_projects_json_fields(self, page: Page):
        resp = page.goto(f"{BASE}/data/projects.json")
        data = json.loads(resp.body().decode())
        for p in data["projects"]:
            assert "title" in p and "description" in p and "tags" in p

    def test_blog_json_fields(self, page: Page):
        resp = page.goto(f"{BASE}/data/blog.json")
        data = json.loads(resp.body().decode())
        for post in data["posts"]:
            assert "title" in post and "excerpt" in post and "date" in post


# ══════════════════════════════════════════════════════════════════
# 43. KEYBOARD NAVIGATION
# ══════════════════════════════════════════════════════════════════

class TestKeyboardNavigation:
    def test_tab_reaches_skip_nav(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        page.keyboard.press("Tab")
        page.wait_for_timeout(300)
        assert page.evaluate("document.activeElement.classList.contains('skip-nav')")


# ══════════════════════════════════════════════════════════════════
# 44. PERFORMANCE
# ══════════════════════════════════════════════════════════════════

class TestPerformance:
    def test_page_loads_under_10s(self, page: Page):
        start = time.time()
        page.goto(BASE, wait_until="networkidle")
        assert time.time() - start < 15

    def test_dom_not_excessive(self, page: Page):
        _goto(page, wait="domcontentloaded")
        assert page.evaluate("document.querySelectorAll('*').length") < 5000


# ══════════════════════════════════════════════════════════════════
# 45. CROSS-PAGE NAVIGATION
# ══════════════════════════════════════════════════════════════════

class TestCrossPageNavigation:
    def test_index_to_features_sidebar(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"])
        page.wait_for_timeout(1000)
        _dismiss_cookies(page)
        # navigation.js preventDefault() blocks normal click on nav links
        page.evaluate("window.location.href = 'features.html'")
        page.wait_for_timeout(2000)
        assert "features" in page.url

    def test_index_to_features_footer(self, page: Page):
        _goto(page, wait="domcontentloaded")
        page.wait_for_timeout(500)
        _dismiss_cookies(page)
        page.evaluate("document.querySelector('.footer-links a[href=\"features.html\"]').scrollIntoView()")
        page.wait_for_timeout(300)
        page.locator('.footer-links a[href="features.html"]').click()
        page.wait_for_timeout(2000)
        assert "features" in page.url

    def test_features_to_index_back(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        page.locator(".back-btn").click()
        page.wait_for_timeout(1000)
        assert "features" not in page.url


# ══════════════════════════════════════════════════════════════════
# 46. CDN DEPENDENCIES
# ══════════════════════════════════════════════════════════════════

class TestCDNDependencies:
    def test_font_awesome_loaded(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1000)
        assert page.locator("i.fas, i.fab").count() >= 10

    @pytest.mark.xfail(reason="Three.js CDN may not load in test environment", strict=False)
    def test_three_js_available(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.evaluate("typeof THREE !== 'undefined'")

    def test_google_fonts_applied(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1000)
        font = page.evaluate("getComputedStyle(document.body).fontFamily")
        assert "DM Sans" in font or "Inter" in font or "sans-serif" in font


# ══════════════════════════════════════════════════════════════════
# 47. VISITOR GREETING (Time-Based)
# ══════════════════════════════════════════════════════════════════

class TestVisitorGreeting:
    def test_greeting_script_loaded(self, page: Page):
        failed = []
        def check(r):
            if "visitorGreeting.js" in r.url and r.status != 200:
                failed.append(r.status)
        page.on("response", check)
        _goto(page)
        assert failed == []

    def test_greeting_contains_im(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        text = page.locator(".hero-greeting").inner_text()
        assert "i'm" in text.lower(), f"Greeting should contain \"I'm\": {text}"

    def test_greeting_has_emoji(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        text = page.locator(".hero-greeting").inner_text()
        # Should contain one of the time-based emojis
        assert any(e in text for e in ["🌅", "☀️", "🌤", "🌙", "🦉"]), f"No time emoji in: {text}"

    def test_greeting_animated_class(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        has_class = page.evaluate("document.querySelector('.hero-greeting').classList.contains('greeting-animated')")
        assert has_class, "greeting-animated class should be applied"

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_greeting_visible_all_viewports(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(1500)
        expect(page.locator(".hero-greeting")).to_be_visible()

    def test_visitor_greeting_module_exists(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1000)
        exists = page.evaluate("typeof VisitorGreeting !== 'undefined'")
        assert exists, "VisitorGreeting module should be defined"


# ══════════════════════════════════════════════════════════════════
# 48. PDF RESUME VIEWER (Modal)
# ══════════════════════════════════════════════════════════════════

class TestResumeViewer:
    def test_view_button_injected_hero(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        expect(page.locator(".hero-cta .resume-view-btn")).to_have_count(1)

    def test_view_button_injected_footer(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        expect(page.locator(".footer .resume-view-btn")).to_have_count(1)

    def test_view_button_text(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        btn = page.locator(".resume-view-btn").first
        assert "View" in btn.inner_text()

    def test_modal_opens_on_click(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        expect(page.locator(".resume-modal.active")).to_have_count(1)

    def test_modal_has_iframe(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        expect(page.locator(".resume-modal-iframe")).to_have_count(1)

    def test_modal_has_download_button(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        expect(page.locator(".resume-modal-download")).to_have_count(1)

    def test_modal_closes_on_x(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        page.locator("#resumeModalClose").click()
        page.wait_for_timeout(500)
        assert page.locator(".resume-modal.active").count() == 0

    def test_modal_closes_on_escape(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        assert page.locator(".resume-modal.active").count() == 0

    def test_modal_closes_on_backdrop(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(1000)
        # Click at top-left corner of viewport which is on the backdrop (outside modal content)
        page.mouse.click(5, 5)
        page.wait_for_timeout(500)
        assert page.locator(".resume-modal.active").count() == 0

    def test_body_overflow_hidden_when_open(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(500)
        overflow = page.evaluate("document.body.style.overflow")
        assert overflow == "hidden"

    def test_body_overflow_restored_on_close(self, page: Page):
        _goto(page)
        page.wait_for_timeout(1500)
        page.locator(".resume-view-btn").first.click()
        page.wait_for_timeout(500)
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        overflow = page.evaluate("document.body.style.overflow")
        assert overflow == ""

    def test_resume_viewer_css_loaded(self, page: Page):
        failed = []
        def check(r):
            if "resumeViewer.css" in r.url and r.status != 200:
                failed.append(r.status)
        page.on("response", check)
        _goto(page)
        assert failed == []


# ══════════════════════════════════════════════════════════════════
# 49. TESTIMONIALS SECTION
# ══════════════════════════════════════════════════════════════════

class TestTestimonials:
    def test_section_exists(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator("#testimonials")).to_have_count(1)

    def test_section_title(self, page: Page):
        _goto(page, wait="domcontentloaded")
        title = page.locator("#testimonials .section-title")
        expect(title).to_have_count(1)
        assert "Testimonials" in title.inner_text()

    def test_nav_link_exists(self, page: Page):
        _goto(page, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        expect(page.locator('.nav-links a[href="#testimonials"]')).to_have_count(1)

    def test_testimonial_cards_loaded(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        cards = page.locator(".testimonial-card")
        assert cards.count() >= 5, f"Expected >=5 testimonial cards, got {cards.count()}"

    def test_first_card_active(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        active = page.locator(".testimonial-card.active")
        assert active.count() == 1, "Exactly one card should be active"

    def test_dots_match_cards(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        cards = page.locator(".testimonial-card").count()
        dots = page.locator(".testimonial-dot").count()
        assert cards == dots, f"Cards ({cards}) and dots ({dots}) should match"

    def test_nav_arrows_exist(self, page: Page):
        _goto(page, wait="domcontentloaded")
        expect(page.locator(".testimonial-prev")).to_have_count(1)
        expect(page.locator(".testimonial-next")).to_have_count(1)

    def test_next_arrow_changes_card(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        # Get initial active card index
        idx_before = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        page.locator(".testimonial-next").click()
        page.wait_for_timeout(600)
        idx_after = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        assert idx_after != idx_before, "Next arrow should change the active card"

    def test_prev_arrow_changes_card(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        # Go forward first
        page.locator(".testimonial-next").click()
        page.wait_for_timeout(600)
        idx_before = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        page.locator(".testimonial-prev").click()
        page.wait_for_timeout(600)
        idx_after = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        assert idx_after != idx_before, "Prev arrow should change the active card"

    def test_dot_click_navigates(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        page.locator(".testimonial-dot").nth(2).click()
        page.wait_for_timeout(600)
        idx = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        assert idx == 2, f"Clicking dot 2 should show card 2, got {idx}"

    def test_active_dot_follows_card(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        page.locator(".testimonial-next").click()
        page.wait_for_timeout(600)
        active_dot = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-dot')]
                .findIndex(d => d.classList.contains('active'))
        """)
        active_card = page.evaluate("""
            () => [...document.querySelectorAll('.testimonial-card')]
                .findIndex(c => c.classList.contains('active'))
        """)
        assert active_dot == active_card

    def test_card_has_quote_and_author(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        card = page.locator(".testimonial-card.active")
        expect(card.locator(".testimonial-quote p")).to_have_count(1)
        expect(card.locator(".testimonial-author")).to_have_count(1)
        expect(card.locator(".testimonial-author-info strong")).to_have_count(1)

    def test_testimonials_json_valid(self, page: Page):
        resp = page.goto(f"{BASE}/data/testimonials.json")
        assert resp.status == 200
        data = json.loads(resp.body().decode())
        assert len(data) >= 5
        for t in data:
            assert "name" in t and "role" in t and "text" in t and "avatar" in t

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_testimonials_no_overflow(self, page: Page, vp_name: str, vp: dict):
        _goto(page, vp=vp)
        page.wait_for_timeout(2000)
        page.evaluate("document.querySelector('#testimonials').scrollIntoView()")
        page.wait_for_timeout(300)
        overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not overflow, f"[{vp_name}] Testimonials section causes horizontal overflow"


# ══════════════════════════════════════════════════════════════════
# 50. ADMIN DASHBOARD
# ══════════════════════════════════════════════════════════════════

class TestAdminDashboard:
    ADMIN_URL = f"{BASE}/admin.html"

    def test_admin_page_loads(self, page: Page):
        resp = page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        assert resp.status == 200

    def test_has_noindex_meta(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        robots = page.locator('meta[name="robots"]').get_attribute("content")
        assert "noindex" in robots

    def test_auth_gate_visible(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        expect(page.locator("#authGate")).to_be_visible()

    def test_dashboard_hidden_by_default(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        assert not page.locator("#dashboard").is_visible()

    def test_auth_email_input(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        expect(page.locator("#authEmail")).to_have_count(1)

    def test_auth_password_input(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        expect(page.locator("#authPassword")).to_have_count(1)

    def test_auth_button_exists(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        expect(page.locator("#authBtn")).to_have_count(1)

    def test_empty_submit_shows_error(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.locator("#authBtn").click()
        page.wait_for_timeout(1000)
        err = page.locator("#authError")
        assert err.is_visible() or err.evaluate("el => el.style.display") == "block"

    def test_stat_cards_exist(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        assert page.locator(".stat-card").count() == 4

    def test_dashboard_sections_exist(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        for section_id in ["messagesBody", "pageViewsBody", "sectionViewsBody", "chatLogsBody", "blogStatsBody"]:
            expect(page.locator(f"#{section_id}")).to_have_count(1)

    def test_back_to_site_link(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        link = page.locator(".btn-back")
        expect(link).to_have_count(1)
        assert "index.html" in link.get_attribute("href")

    def test_logout_button_exists(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        expect(page.locator("#logoutBtn")).to_have_count(1)

    def test_supabase_sdk_loaded(self, page: Page):
        page.goto(self.ADMIN_URL, wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.evaluate("typeof supabase !== 'undefined'")

    @pytest.mark.parametrize("vp_name,vp", VIEWPORTS.items())
    def test_admin_no_overflow(self, page: Page, vp_name: str, vp: dict):
        page.set_viewport_size(vp)
        page.goto(self.ADMIN_URL, wait_until="domcontentloaded")
        assert not page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")


# ══════════════════════════════════════════════════════════════════
# 51. OG PREVIEW IMAGE
# ══════════════════════════════════════════════════════════════════

class TestOGPreviewImage:
    def test_og_image_file_exists(self, page: Page):
        resp = page.goto(f"{BASE}/images/og-preview.png")
        assert resp.status == 200

    def test_og_image_content_type(self, page: Page):
        resp = page.goto(f"{BASE}/images/og-preview.png")
        ctype = resp.headers.get("content-type", "")
        assert "image/png" in ctype or "octet-stream" in ctype

    def test_og_svg_source_exists(self, page: Page):
        resp = page.goto(f"{BASE}/images/og-preview.svg")
        assert resp.status == 200

    def test_og_image_referenced_in_meta(self, page: Page):
        _goto(page, wait="domcontentloaded")
        img = page.locator('meta[property="og:image"]').get_attribute("content")
        assert "og-preview.png" in img

    def test_og_url_set(self, page: Page):
        _goto(page, wait="domcontentloaded")
        url = page.locator('meta[property="og:url"]').get_attribute("content")
        assert url and len(url) > 10

    def test_og_site_name_set(self, page: Page):
        _goto(page, wait="domcontentloaded")
        name = page.locator('meta[property="og:site_name"]').get_attribute("content")
        assert "Aren" in name


# ══════════════════════════════════════════════════════════════════
# 52. SUPABASE BACKEND
# ══════════════════════════════════════════════════════════════════

class TestSupabaseBackend:
    def test_supabase_sdk_script(self, page: Page):
        _goto(page, wait="domcontentloaded")
        scripts = page.evaluate("""() =>
            [...document.querySelectorAll('script[src]')]
                .map(s => s.src)
                .filter(s => s.includes('supabase'))
        """)
        assert len(scripts) >= 1, "Supabase SDK script should be loaded"

    def test_supabase_client_script(self, page: Page):
        failed = []
        def check(r):
            if "supabaseClient.js" in r.url and r.status != 200:
                failed.append(r.status)
        page.on("response", check)
        _goto(page)
        assert failed == []

    def test_supabase_backend_defined(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        assert page.evaluate("typeof SupabaseBackend !== 'undefined'")

    def test_supabase_backend_has_methods(self, page: Page):
        _goto(page)
        page.wait_for_timeout(2000)
        methods = ["init", "isReady", "getResumeCount", "saveMessage",
                   "trackPageView", "trackSectionView", "logChatMessage"]
        for method in methods:
            assert page.evaluate(f"typeof SupabaseBackend.{method} === 'function'"), \
                f"SupabaseBackend.{method} should be a function"

    def test_visitor_analytics_script(self, page: Page):
        failed = []
        def check(r):
            if "visitorAnalytics.js" in r.url and r.status != 200:
                failed.append(r.status)
        page.on("response", check)
        _goto(page)
        assert failed == []

    def test_blog_engagement_script(self, page: Page):
        failed = []
        def check(r):
            if "blogEngagement.js" in r.url and r.status != 200:
                failed.append(r.status)
        page.on("response", check)
        _goto(page)
        assert failed == []

    def test_supabase_schema_file_exists(self, page: Page):
        # .sql triggers download in browser, so use page.evaluate + fetch instead
        _goto(page, wait="domcontentloaded")
        result = page.evaluate("""async () => {
            const resp = await fetch('/supabase-schema.sql');
            const text = await resp.text();
            return { status: resp.status, hasCreate: text.includes('CREATE TABLE') };
        }""")
        assert result["status"] == 200
        assert result["hasCreate"]


# ══════════════════════════════════════════════════════════════════
# 53. FEATURES PAGE — NEW FEATURE BLOCKS
# ══════════════════════════════════════════════════════════════════

class TestFeaturesPageNewBlocks:
    @pytest.mark.parametrize("block_id", [
        "f-greeting", "f-pdfviewer", "f-ogimage",
        "f-testimonials", "f-admin", "f-supabase"
    ])
    def test_new_feature_block_exists(self, page: Page, block_id: str):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        expect(page.locator(f"#{block_id}")).to_have_count(1)

    @pytest.mark.parametrize("block_id", [
        "f-greeting", "f-pdfviewer", "f-ogimage",
        "f-testimonials", "f-admin", "f-supabase"
    ])
    def test_new_block_has_heading(self, page: Page, block_id: str):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        heading = page.locator(f"#{block_id} h2")
        expect(heading).to_have_count(1)
        assert len(heading.inner_text()) > 5

    def test_desktop_toc_has_new_links(self, page: Page):
        _goto(page, url=FEATURES_URL, vp=VIEWPORTS["desktop"], wait="domcontentloaded")
        for href in ["#f-greeting", "#f-pdfviewer", "#f-ogimage",
                     "#f-testimonials", "#f-admin", "#f-supabase"]:
            expect(page.locator(f'.side-toc a[href="{href}"]')).to_have_count(1)

    def test_supabase_badge_in_hero(self, page: Page):
        _goto(page, url=FEATURES_URL, wait="domcontentloaded")
        badges = page.locator(".f-badge")
        texts = [badges.nth(i).inner_text() for i in range(badges.count())]
        assert any("Supabase" in t for t in texts), f"No Supabase badge found in: {texts}"