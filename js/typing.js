/* =============================================
   TYPING — Typed text effect on hero section
   ============================================= */

const titles = [
    'Software Engineer 2 at NetApp',
    'Embedded C++ Developer',
    'Real-Time Systems Engineer',
    'DevOps & CI/CD Enthusiast'
];

let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typedEl = document.getElementById('typedText');

function typeEffect() {
    if (!typedEl) return;
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
        typedEl.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typedEl.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 35 : 65;

    if (!isDeleting && charIndex === currentTitle.length) {
        speed = 2000; // pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        speed = 400;
    }

    setTimeout(typeEffect, speed);
}

typeEffect();
