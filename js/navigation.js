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

function openMobileMenu() {
    hamburger.classList.add('active');
    sidebar.classList.add('active');
    sidebar.classList.add('open');
    overlay.classList.add('active');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    hamburger.classList.remove('active');
    sidebar.classList.remove('active');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleMobileMenu() {
    if (sidebar.classList.contains('open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

hamburger.addEventListener('click', toggleMobileMenu);
overlay.addEventListener('click', closeMobileMenu);

// Close sidebar on nav link click (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeMobileMenu();
        }
    });
});

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
        closeMobileMenu();
    }
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
