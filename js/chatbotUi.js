/* =============================================
   CHATBOT UI — DOM interactions, toggle,
                message display, send logic
   ============================================= */

// DOM Elements
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatInputRow = document.getElementById('chatInputRow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Unique session ID for chat logging
const _chatSessionId = 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

// Guard: if any critical element is missing, bail out safely
if (!chatbotToggle || !chatbotWindow || !chatbotClose || !chatbotMessages || !chatInput || !chatSend) {
    console.warn('ChatbotUI: Missing DOM elements, skipping init.');
} else {

// Toggle chatbot window
chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('open');
    chatbotToggle.classList.toggle('hidden');
    chatInput.focus();
});

chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.remove('open');
    chatbotToggle.classList.remove('hidden');
});

// Send message
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    // Log to Supabase (non-blocking)
    if (window.SupabaseBackend && window.SupabaseBackend.isReady()) {
        window.SupabaseBackend.logChatMessage('user', text, _chatSessionId).catch(() => {});
    }
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;

    // Show typing indicator
    const typingId = showTyping();

    // If no API key, use local smart answers
    if (!window.CHATBOT_API.getKey()) {
        setTimeout(() => {
            removeTyping(typingId);
            const reply = window.getLocalAnswer(text);
            addMessage('bot', reply);
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }, 800);
        return;
    }

    try {
        const reply = await window.CHATBOT_API.callGeminiAPI(text);
        removeTyping(typingId);
        addMessage('bot', reply);
        if (window.SupabaseBackend && window.SupabaseBackend.isReady()) {
            window.SupabaseBackend.logChatMessage('bot', reply, _chatSessionId).catch(() => {});
        }
    } catch (error) {
        removeTyping(typingId);

        if (error.name === 'AbortError') {
            addMessage('bot', '⏱️ Request timed out. Here\'s an offline answer:');
        } else if (error.status === 400 || error.status === 403) {
            addMessage('bot', '❌ Invalid API key. Switching to offline mode.');
            window.CHATBOT_API.clearKey();
            localStorage.removeItem('gemini_api_key');
        } else if (error.status === 429) {
            addMessage('bot', '⚠️ Rate limit exceeded. Switching to offline mode for now.');
        } else {
            addMessage('bot', `⚠️ ${error.message || 'Network error'}. Here\'s an offline answer:`);
        }

        const offlineReply = window.getLocalAnswer(text);
        addMessage('bot', offlineReply);
    }

    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
}

// ===== HELPER FUNCTIONS =====

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `chat-message ${sender}`;
    div.innerHTML = `<div class="chat-bubble">${formatMessage(text)}</div>`;
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function formatMessage(text) {
    // Basic markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.id = id;
    div.innerHTML = `<div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>`;
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

} // end null guard
