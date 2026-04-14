/* =============================================
   SUPABASE CLIENT — Central backend integration
   ─────────────────────────────────────────────
   Free-tier Supabase project (500 MB, 50K req/mo).
   Only the developer creates an account; visitors
   use the public anon key — no signup required.

   SETUP INSTRUCTIONS:
   1. Go to https://supabase.com → Create free project
   2. Copy your project URL & anon key from Settings → API
   3. Paste them below
   4. Run the SQL in supabase-schema.sql in the SQL Editor
   ============================================= */

const SupabaseBackend = (() => {
    // ══════════════════════════════════════════
    // ⚠️  PASTE YOUR SUPABASE CREDENTIALS HERE
    // ══════════════════════════════════════════
    const SUPABASE_URL  = 'https://dhjjjymjqimedxaoaayq.supabase.co';
    const SUPABASE_ANON = 'sb_publishable_SgWVKje--EKn7-1oBaeaPw_rOc2ewmn';

    let _client = null;
    let _ready  = false;

    // ── Initialize ──
    const init = () => {
        if (!SUPABASE_URL || !SUPABASE_ANON) {
            console.info('SupabaseBackend: No credentials configured — running in offline/localStorage mode.');
            return false;
        }
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.warn('SupabaseBackend: Supabase JS library not loaded.');
            return false;
        }
        try {
            _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
                auth: { persistSession: false, autoRefreshToken: false }
            });
            _ready = true;
            console.info('SupabaseBackend: Connected ✓');
            return true;
        } catch (e) {
            console.warn('SupabaseBackend: Init failed', e);
            return false;
        }
    };

    const isReady = () => _ready;
    const client  = () => _client;

    // ────────────────────────────────────────
    // 1. RESUME DOWNLOAD COUNTER (global)
    // ────────────────────────────────────────
    const getResumeCount = async () => {
        if (!_ready) return null;
        try {
            const { data, error } = await _client
                .from('counters')
                .select('value')
                .eq('name', 'resume_downloads')
                .maybeSingle();
            if (error) throw error;
            return data ? data.value : null;
        } catch (e) {
            console.warn('SupabaseBackend: getResumeCount', e.message);
            return null;
        }
    };

    const incrementResumeCount = async () => {
        if (!_ready) return null;
        try {
            const { data, error } = await _client.rpc('increment_counter', {
                counter_name: 'resume_downloads'
            });
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('SupabaseBackend: incrementResumeCount', e.message);
            return null;
        }
    };

    // ────────────────────────────────────────
    // 2. CONTACT FORM MESSAGES
    // ────────────────────────────────────────
    const saveMessage = async ({ name, email, subject, message }) => {
        if (!_ready) return false;
        try {
            const { error } = await _client
                .from('messages')
                .insert({ name, email, subject, message });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('SupabaseBackend: saveMessage', e.message);
            return false;
        }
    };

    // ────────────────────────────────────────
    // 3. VISITOR ANALYTICS
    // ────────────────────────────────────────
    const trackPageView = async (page = '/') => {
        if (!_ready) return;
        try {
            const fingerprint = await getVisitorFingerprint();
            await _client.from('page_views').insert({
                page,
                referrer:   document.referrer || null,
                user_agent: navigator.userAgent.slice(0, 200),
                screen_w:   window.screen.width,
                screen_h:   window.screen.height,
                fingerprint
            });
        } catch (e) {
            console.warn('SupabaseBackend: trackPageView', e.message);
        }
    };

    const trackSectionView = async (sectionId) => {
        if (!_ready) return;
        try {
            await _client.from('section_views').insert({
                section_id: sectionId,
                fingerprint: await getVisitorFingerprint()
            });
        } catch (e) {
            // Silently fail — analytics should never break UX
        }
    };

    // Simple fingerprint (no PII, no cookies)
    const getVisitorFingerprint = async () => {
        const raw = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        // Use SubtleCrypto for a quick hash
        try {
            const msgBuffer = new TextEncoder().encode(raw);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
        } catch {
            // Fallback: simple hash
            let hash = 0;
            for (let i = 0; i < raw.length; i++) {
                hash = ((hash << 5) - hash) + raw.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash).toString(16).slice(0, 16);
        }
    };

    // ────────────────────────────────────────
    // 4. BLOG ENGAGEMENT (likes / reads)
    // ────────────────────────────────────────
    const trackBlogRead = async (postSlug) => {
        if (!_ready) return;
        try {
            await _client.rpc('increment_blog_stat', {
                p_slug: postSlug,
                p_field: 'reads'
            });
        } catch (e) {
            console.warn('SupabaseBackend: trackBlogRead', e.message);
        }
    };

    const toggleBlogLike = async (postSlug) => {
        if (!_ready) return null;
        try {
            const fp = await getVisitorFingerprint();
            const { data: existing } = await _client
                .from('blog_likes')
                .select('id')
                .eq('post_slug', postSlug)
                .eq('fingerprint', fp)
                .maybeSingle();

            if (existing) {
                // Unlike
                await _client.from('blog_likes').delete().eq('id', existing.id);
                await _client.rpc('increment_blog_stat', { p_slug: postSlug, p_field: 'likes', p_delta: -1 });
                return false; // unliked
            } else {
                // Like
                await _client.from('blog_likes').insert({ post_slug: postSlug, fingerprint: fp });
                await _client.rpc('increment_blog_stat', { p_slug: postSlug, p_field: 'likes', p_delta: 1 });
                return true; // liked
            }
        } catch (e) {
            console.warn('SupabaseBackend: toggleBlogLike', e.message);
            return null;
        }
    };

    const getBlogStats = async (postSlug) => {
        if (!_ready) return null;
        try {
            const { data, error } = await _client
                .from('blog_stats')
                .select('reads, likes')
                .eq('post_slug', postSlug)
                .maybeSingle();
            if (error) throw error;
            return data || { reads: 0, likes: 0 };
        } catch (e) {
            return { reads: 0, likes: 0 };
        }
    };

    const hasLiked = async (postSlug) => {
        if (!_ready) return false;
        try {
            const fp = await getVisitorFingerprint();
            const { data } = await _client
                .from('blog_likes')
                .select('id')
                .eq('post_slug', postSlug)
                .eq('fingerprint', fp)
                .maybeSingle();
            return !!data;
        } catch {
            return false;
        }
    };

    // ────────────────────────────────────────
    // 5. CHATBOT HISTORY (optional logging)
    // ────────────────────────────────────────
    const logChatMessage = async (role, text, sessionId) => {
        if (!_ready) return;
        try {
            await _client.from('chat_logs').insert({
                session_id: sessionId,
                role,
                message: text.slice(0, 2000) // cap to 2000 chars
            });
        } catch (e) {
            // Silent fail — chat logging should never interrupt UX
        }
    };

    return {
        init,
        isReady,
        client,
        // Resume
        getResumeCount,
        incrementResumeCount,
        // Contact
        saveMessage,
        // Analytics
        trackPageView,
        trackSectionView,
        getVisitorFingerprint,
        // Blog
        trackBlogRead,
        toggleBlogLike,
        getBlogStats,
        hasLiked,
        // Chat
        logChatMessage
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => SupabaseBackend.init());
window.SupabaseBackend = SupabaseBackend;
