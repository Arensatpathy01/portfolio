/* =============================================
   CONTACT FORM — Validation + EmailJS / mailto
   Uses EmailService if available, falls back to mailto.
   ============================================= */

const queryForm = document.getElementById('queryForm');
if (queryForm) {
    const nameInput = document.getElementById('queryName');
    const emailInput = document.getElementById('queryEmail');
    const messageInput = document.getElementById('queryMessage');
    const subjectInput = document.getElementById('querySubject');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Character counter for message
    if (messageInput) {
        const charCount = document.createElement('span');
        charCount.className = 'char-count';
        charCount.textContent = '0 / 1000';
        messageInput.parentElement.appendChild(charCount);
        messageInput.setAttribute('maxlength', '1000');
        messageInput.addEventListener('input', () => {
            const len = messageInput.value.length;
            charCount.textContent = `${len} / 1000`;
            charCount.classList.toggle('near-limit', len > 900);
        });
    }

    // Remove invalid state on input
    [nameInput, emailInput, messageInput].forEach(input => {
        if (input) input.addEventListener('input', () => input.classList.remove('invalid'));
    });

    // Rate limiting — prevent spam
    let lastSubmitTime = 0;
    const RATE_LIMIT_MS = 30000; // 30 seconds between submissions

    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Rate limit check
        const now = Date.now();
        if (now - lastSubmitTime < RATE_LIMIT_MS) {
            const wait = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
            showStatus('error', `<i class="fas fa-clock"></i> Please wait ${wait}s before sending another message.`);
            return;
        }

        let isValid = true;

        // Validate name
        if (!nameInput.value.trim()) {
            nameInput.classList.add('invalid');
            isValid = false;
        }

        // Validate email
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            emailInput.classList.add('invalid');
            isValid = false;
        }

        // Validate message
        if (!messageInput.value.trim()) {
            messageInput.classList.add('invalid');
            isValid = false;
        }

        if (!isValid) return;

        // Show sending state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectInput.value.trim() || 'Portfolio Query',
            message: messageInput.value.trim()
        };

        // Try EmailJS first, fall back to mailto
        let result;
        if (window.EmailService) {
            result = await window.EmailService.send(formData);
        } else {
            // Direct mailto fallback
            const subject = encodeURIComponent(formData.subject + ' - from ' + formData.name);
            const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
            window.location.href = `mailto:aren.saty@gmail.com?subject=${subject}&body=${body}`;
            result = { success: true, message: 'Your mail client has been opened. Send the email to complete your query!', fallback: true };
        }

        lastSubmitTime = Date.now();

        // Show result
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Query';

        if (result.success) {
            const icon = result.fallback ? 'fa-envelope-open' : 'fa-check-circle';
            showStatus('success', `<i class="fas ${icon}"></i> ${result.message}`);
            queryForm.reset();
            // Update char counter
            const cc = queryForm.querySelector('.char-count');
            if (cc) cc.textContent = '0 / 1000';
        } else {
            showStatus('error', `<i class="fas fa-exclamation-circle"></i> ${result.message || 'Something went wrong. Please try again.'}`);
        }
    });

    function showStatus(type, html) {
        formStatus.className = `form-status ${type}`;
        formStatus.innerHTML = html;
        formStatus.style.display = 'block';
        setTimeout(() => { formStatus.style.display = 'none'; }, 8000);
    }
}
