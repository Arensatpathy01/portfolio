/* =============================================
   CONTACT FORM — Validation & mailto submit
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

    // Remove invalid state on input
    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
        });
    });

    queryForm.addEventListener('submit', (e) => {
        e.preventDefault();
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

        // Build mailto link and send
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim() || 'Portfolio Query';
        const message = messageInput.value.trim();

        const mailBody = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${encodeURIComponent(message)}`;
        const mailtoLink = `mailto:aren.saty@gmail.com?subject=${encodeURIComponent(subject + ' - from ' + name)}&body=${mailBody}`;

        // Open mail client
        window.location.href = mailtoLink;

        // Show success
        setTimeout(() => {
            formStatus.className = 'form-status success';
            formStatus.innerHTML = '<i class="fas fa-check-circle"></i> Your mail client has been opened. Send the email to complete your query!';
            formStatus.style.display = 'block';

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Query';

            // Reset form
            queryForm.reset();
        }, 500);

        // Hide status after 8 seconds
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 8500);
    });
}
