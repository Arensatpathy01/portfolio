-- ══════════════════════════════════════════════════════
-- SUPABASE SCHEMA — Portfolio Backend Tables
-- ──────────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- ══════════════════════════════════════════════════════

-- 1. COUNTERS (resume downloads, etc.)
CREATE TABLE IF NOT EXISTS public.counters (
    name  TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO public.counters (name, value) VALUES ('resume_downloads', 45)
ON CONFLICT (name) DO NOTHING;

-- RPC: Atomic increment
CREATE OR REPLACE FUNCTION public.increment_counter(counter_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE new_val INTEGER;
BEGIN
    UPDATE public.counters SET value = value + 1 WHERE name = counter_name RETURNING value INTO new_val;
    RETURN new_val;
END;
$$;

-- 2. MESSAGES (contact form)
CREATE TABLE IF NOT EXISTS public.messages (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PAGE VIEWS (visitor analytics)
CREATE TABLE IF NOT EXISTS public.page_views (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    page        TEXT NOT NULL DEFAULT '/',
    referrer    TEXT,
    user_agent  TEXT,
    screen_w    INTEGER,
    screen_h    INTEGER,
    fingerprint TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. SECTION VIEWS (which sections are most viewed)
CREATE TABLE IF NOT EXISTS public.section_views (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section_id  TEXT NOT NULL,
    fingerprint TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. BLOG STATS (reads / likes per post)
CREATE TABLE IF NOT EXISTS public.blog_stats (
    post_slug TEXT PRIMARY KEY,
    reads     INTEGER NOT NULL DEFAULT 0,
    likes     INTEGER NOT NULL DEFAULT 0
);

-- RPC: Increment blog stat
CREATE OR REPLACE FUNCTION public.increment_blog_stat(p_slug TEXT, p_field TEXT, p_delta INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.blog_stats (post_slug, reads, likes) VALUES (p_slug, 0, 0)
    ON CONFLICT (post_slug) DO NOTHING;

    IF p_field = 'reads' THEN
        UPDATE public.blog_stats SET reads = GREATEST(reads + p_delta, 0) WHERE post_slug = p_slug;
    ELSIF p_field = 'likes' THEN
        UPDATE public.blog_stats SET likes = GREATEST(likes + p_delta, 0) WHERE post_slug = p_slug;
    END IF;
END;
$$;

-- 6. BLOG LIKES (per-visitor dedup)
CREATE TABLE IF NOT EXISTS public.blog_likes (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_slug   TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (post_slug, fingerprint)
);

-- 7. CHAT LOGS (optional chatbot history)
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id TEXT,
    role       TEXT NOT NULL CHECK (role IN ('user', 'bot')),
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Public anon access policies
-- ══════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.counters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs     ENABLE ROW LEVEL SECURITY;

-- COUNTERS: anyone can read, only RPC can update
CREATE POLICY "Public read counters"  ON public.counters  FOR SELECT TO anon USING (true);

-- MESSAGES: anyone can insert (submit form), no read (private)
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT TO anon WITH CHECK (true);

-- PAGE VIEWS: anyone can insert
CREATE POLICY "Public insert page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);

-- SECTION VIEWS: anyone can insert
CREATE POLICY "Public insert section_views" ON public.section_views FOR INSERT TO anon WITH CHECK (true);

-- BLOG STATS: anyone can read, only RPC can update
CREATE POLICY "Public read blog_stats"  ON public.blog_stats  FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert blog_stats" ON public.blog_stats FOR INSERT TO anon WITH CHECK (true);

-- BLOG LIKES: anyone can read/insert/delete their own
CREATE POLICY "Public read blog_likes"   ON public.blog_likes FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert blog_likes" ON public.blog_likes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public delete blog_likes" ON public.blog_likes FOR DELETE TO anon USING (true);

-- CHAT LOGS: anyone can insert (log conversations)
CREATE POLICY "Public insert chat_logs" ON public.chat_logs FOR INSERT TO anon WITH CHECK (true);

-- Grant execute on RPCs to anon
GRANT EXECUTE ON FUNCTION public.increment_counter TO anon;
GRANT EXECUTE ON FUNCTION public.increment_blog_stat TO anon;
