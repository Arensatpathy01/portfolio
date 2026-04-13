/* =============================================
   EMAIL SERVICE — EmailJS Integration
   Sends contact form emails without a backend.
   Free tier: 200 emails/month.
   
   Setup: Create account at emailjs.com, then:
   1. Add an email service (Gmail, Outlook, etc.)
   2. Create an email template with variables:
      {{from_name}}, {{from_email}}, {{subject}}, {{message}}
   3. Replace the IDs below with your own.
   ============================================= */

const EmailService = (() => {
    // ── EmailJS Configuration ──
    // Replace these with your actual EmailJS credentials
    const CONFIG = {
        publicKey:  'YOUR_PUBLIC_KEY',    // EmailJS public key
        serviceId:  'YOUR_SERVICE_ID',    // EmailJS service ID
        templateId: 'YOUR_TEMPLATE_ID'    // EmailJS template ID
    };

    // Check if EmailJS is properly configured
    const isConfigured = () => {
        return CONFIG.publicKey !== 'YOUR_PUBLIC_KEY' &&
               CONFIG.serviceId !== 'YOUR_SERVICE_ID' &&
               CONFIG.templateId !== 'YOUR_TEMPLATE_ID';
    };

    // Initialize EmailJS
    const init = () => {
        if (typeof emailjs !== 'undefined' && isConfigured()) {
            emailjs.init(CONFIG.publicKey);
            console.log('📧 EmailJS initialized');
            return true;
        }
        return false;
    };

    /**
     * Send email via EmailJS
     * @param {Object} data - { name, email, subject, message }
     * @returns {Promise<{success: boolean, message: string}>}
     */
    const send = async (data) => {
        // Fallback to mailto if EmailJS not configured
        if (!isConfigured() || typeof emailjs === 'undefined') {
            return fallbackMailto(data);
        }

        try {
            const templateParams = {
                from_name:  data.name,
                from_email: data.email,
                subject:    data.subject || 'Portfolio Query',
                message:    data.message,
                to_name:    'Aren Satpathy'
            };

            const response = await emailjs.send(
                CONFIG.serviceId,
                CONFIG.templateId,
                templateParams
            );

            if (response.status === 200) {
                // Track successful sends for analytics
                trackFormSubmission('emailjs', true);
                return {
                    success: true,
                    message: 'Message sent successfully! I\'ll get back to you soon.'
                };
            }

            throw new Error('Unexpected response');
        } catch (error) {
            console.warn('EmailJS failed, falling back to mailto:', error);
            trackFormSubmission('emailjs', false);
            return fallbackMailto(data);
        }
    };

    // Fallback: open mailto link
    const fallbackMailto = (data) => {
        const subject = encodeURIComponent((data.subject || 'Portfolio Query') + ' - from ' + data.name);
        const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`);
        const mailtoLink = `mailto:aren.saty@gmail.com?subject=${subject}&body=${body}`;

        window.location.href = mailtoLink;

        return {
            success: true,
            message: 'Your mail client has been opened. Send the email to complete your query!',
            fallback: true
        };
    };

    // Simple analytics tracking
    const trackFormSubmission = (method, success) => {
        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
        submissions.push({
            method,
            success,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('formSubmissions', JSON.stringify(submissions));

        // Track with GA if available
        if (typeof gtag === 'function') {
            gtag('event', 'form_submission', {
                event_category: 'Contact',
                event_label: method,
                value: success ? 1 : 0
            });
        }
    };

    return { init, send, isConfigured };
})();

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => EmailService.init());

// Expose globally
window.EmailService = EmailService;
