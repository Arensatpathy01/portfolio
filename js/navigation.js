/* =============================================
   NAVIGATION — Active link, mobile menu,
                smooth scroll
   ============================================= */

const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

// ===== ACTIVE NAV LINK ON SCROLL =====
function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveLink);

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
let overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

hamburger.addEventListener('click', toggleMobileMenu);
overlay.addEventListener('click', toggleMobileMenu);

// Close sidebar on nav link click (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleMobileMenu();
        }
    });
});

// ===== SMOOTH SCROLL FOR NAV LINKS =====
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            const offset = window.innerWidth <= 768 ? 70 : 0;
            const top = target.offsetTop - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});
