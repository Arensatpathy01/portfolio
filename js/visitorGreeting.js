/* =============================================
   VISITOR GREETING — Time-based hero greeting
   Dynamically changes the hero greeting based on
   the visitor's local time of day.
   ============================================= */

const VisitorGreeting = (() => {
    const greetings = {
        earlyMorning: { text: "Up early? I'm", icon: "🌅" },       // 5-7
        morning:      { text: "Good morning! I'm", icon: "☀️" },    // 7-12
        afternoon:    { text: "Good afternoon! I'm", icon: "🌤️" },  // 12-17
        evening:      { text: "Good evening! I'm", icon: "🌙" },    // 17-21
        night:        { text: "Working late? I'm", icon: "🦉" }     // 21-5
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 7)   return greetings.earlyMorning;
        if (hour >= 7 && hour < 12)  return greetings.morning;
        if (hour >= 12 && hour < 17) return greetings.afternoon;
        if (hour >= 17 && hour < 21) return greetings.evening;
        return greetings.night;
    };

    const init = () => {
        const el = document.querySelector('.hero-greeting');
        if (!el) return;

        const { text, icon } = getGreeting();
        el.textContent = `${icon} ${text}`;
        el.classList.add('greeting-animated');
    };

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, getGreeting };
})();
