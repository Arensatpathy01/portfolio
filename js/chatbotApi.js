/* =============================================
   CHATBOT API — Gemini API integration
                 & system context
   ============================================= */

const SYSTEM_CONTEXT = `You are a helpful, friendly, and knowledgeable AI assistant embedded on Aren Satpathy's portfolio website.
You can answer any question on any topic — technology, science, programming, general knowledge, career advice, etc.
Be concise, accurate, and conversational. Use markdown formatting where helpful.
If you don't know something, say so honestly.

ABOUT THE PORTFOLIO OWNER — AREN SATPATHY:
- Current Role: Software Engineer 2 at NetApp, Bengaluru (Nov 2025 – Present) — Enterprise-grade storage solutions
- Previous: Embedded C++ Engineer at Boeing (Jun 2024 – Nov 2025) — Real-time data acquisition, WebSocket streaming, multi-threaded systems, protocol data processing (serial bus, GPS, CAN)
- Previous: Software Engineer at Cognizant (Jun 2022 – May 2024) — TechOps for Nike Converse, Feature Store development, test automation
- Education: B.Tech/B.E. from VSSUT Burla (2022), XIIth & Xth from KV Koliwada Mumbai (2018 & 2016)
- Skills: C++, Embedded C++, Python, SQL, STL, Embedded Systems, Operating Systems, Data Structures, OOPS, Multithreading, Jenkins, CI/CD, Docker, GitLab, Linux, WireShark, SDLC
- Certifications: Azure Fundamentals (AZ-900), Microsoft Certified Azure Administrator Associate
- Project: Brain Tumor Detection Using Deep Learning — ML/DL on MRI images for tumor prediction
- Languages: English, Hindi, Odia
- Location: Bengaluru, India
- Email: aren.saty@gmail.com
- LinkedIn: linkedin.com/in/aren-satpathy-84793897`;

// State
let geminiKey = localStorage.getItem('gemini_api_key') || '';
let chatHistory = [];

/**
 * Call Gemini API with user query.
 * Returns the reply string, or throws on error.
 */
async function callGeminiAPI(text) {
    chatHistory.push({ role: 'user', content: text });

    // Cap history to last 20 messages to prevent memory leak
    if (chatHistory.length > 20) {
        chatHistory = chatHistory.slice(-20);
    }

    // 15-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Build Gemini conversation format
    const geminiContents = [
        { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
        { role: 'model', parts: [{ text: 'Understood! I\'m ready to help with any questions.' }] },
        ...chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: geminiContents,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
            }
        }),
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const error = new Error(err.error?.message || 'Unknown error');
        error.status = response.status;
        chatHistory.pop();
        throw error;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
    chatHistory.push({ role: 'assistant', content: reply });
    return reply;
}

// Expose globally
window.CHATBOT_API = {
    callGeminiAPI,
    getKey: () => geminiKey,
    setKey: (key) => { geminiKey = key; },
    clearKey: () => { geminiKey = ''; chatHistory = []; },
    popHistory: () => chatHistory.pop()
};
