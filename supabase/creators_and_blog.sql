-- Creators of the Week and Blog System Schema
-- Run this SQL in Supabase to create the required tables

-- 1) Creators of the Week table
CREATE TABLE IF NOT EXISTS public.creators_of_week (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT, -- e.g., "Gaming Content Creator", "TikTok Influencer"
    bio TEXT NOT NULL,
    profile_image_url TEXT NOT NULL,
    cover_image_url TEXT,
    social_links JSONB DEFAULT '{}', -- Store multiple social media links
    stats JSONB DEFAULT '{}', -- Store follower counts, views etc.
    featured_from DATE NOT NULL DEFAULT CURRENT_DATE,
    featured_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for creators
CREATE INDEX IF NOT EXISTS idx_creators_featured ON public.creators_of_week(featured_from, featured_until);
CREATE INDEX IF NOT EXISTS idx_creators_active ON public.creators_of_week(is_active);
CREATE INDEX IF NOT EXISTS idx_creators_sort ON public.creators_of_week(sort_order);

-- 2) Blog categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Hex color for category
    icon TEXT, -- Icon name for category
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.blog_categories (name, slug, description, color, icon) VALUES 
('News', 'news', 'Latest news and announcements', '#ef4444', 'Newspaper'),
('Updates', 'updates', 'Platform updates and new features', '#3b82f6', 'Zap'),
('Tournaments', 'tournaments', 'Tournament news and highlights', '#f59e0b', 'Trophy'),
('Community', 'community', 'Community highlights and events', '#10b981', 'Users'),
('Tips & Tricks', 'tips-tricks', 'Gaming tips and strategies', '#8b5cf6', 'Lightbulb'),
('Events', 'events', 'Upcoming events and competitions', '#f97316', 'Calendar')
ON CONFLICT (slug) DO NOTHING;

-- 3) Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    category_id UUID REFERENCES public.blog_categories(id),
    author_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    tags TEXT[], -- Array of tags
    meta_title TEXT,
    meta_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_featured ON public.blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_posts(slug);

-- 4) Blog post views tracking
CREATE TABLE IF NOT EXISTS public.blog_post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    viewed_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Store just the date part
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id, viewed_date) -- Prevent multiple views per user per day
);

CREATE INDEX IF NOT EXISTS idx_blog_views_post ON public.blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_date ON public.blog_post_views(viewed_date);
CREATE INDEX IF NOT EXISTS idx_blog_views_timestamp ON public.blog_post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_blog_views_timestamp ON public.blog_post_views(viewed_at);

-- 5) Update triggers
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END; $$;

-- Apply triggers
CREATE TRIGGER trg_creators_touch_updated
BEFORE UPDATE ON public.creators_of_week
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_blog_posts_touch_updated
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 6) Function to increment blog post views
CREATE OR REPLACE FUNCTION public.increment_blog_post_views(post_slug TEXT, viewer_ip INET DEFAULT NULL, viewer_agent TEXT DEFAULT NULL, viewer_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    post_record RECORD;
BEGIN
    -- Get the post
    SELECT id INTO post_record FROM public.blog_posts WHERE slug = post_slug AND status = 'published';
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Insert view record (will be ignored if duplicate due to unique constraint)
    INSERT INTO public.blog_post_views (post_id, user_id, ip_address, user_agent, viewed_date)
    VALUES (post_record.id, viewer_id, viewer_ip, viewer_agent, CURRENT_DATE)
    ON CONFLICT (post_id, user_id, viewed_date) DO NOTHING;
    
    -- Update view count
    UPDATE public.blog_posts 
    SET views = (
        SELECT COUNT(*) FROM public.blog_post_views 
        WHERE post_id = post_record.id
    )
    WHERE id = post_record.id;
END; $$;

-- 7) Function to get current featured creators
CREATE OR REPLACE FUNCTION public.get_featured_creators()
RETURNS TABLE (
    id UUID,
    name TEXT,
    title TEXT,
    bio TEXT,
    profile_image_url TEXT,
    cover_image_url TEXT,
    social_links JSONB,
    stats JSONB,
    featured_from DATE,
    featured_until DATE,
    sort_order INTEGER
) LANGUAGE sql AS $$
    SELECT 
        id, name, title, bio, profile_image_url, cover_image_url,
        social_links, stats, featured_from, featured_until, sort_order
    FROM public.creators_of_week 
    WHERE is_active = true 
    AND featured_from <= CURRENT_DATE 
    AND featured_until >= CURRENT_DATE
    ORDER BY sort_order ASC, created_at DESC;
$$;

-- 8) RLS Policies

-- Creators table
ALTER TABLE public.creators_of_week ENABLE ROW LEVEL SECURITY;

-- Everyone can read active creators
CREATE POLICY creators_select_public ON public.creators_of_week
FOR SELECT USING (is_active = true);

-- Only admins can manage creators
CREATE POLICY creators_admin_all ON public.creators_of_week
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Blog categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_categories_select_public ON public.blog_categories
FOR SELECT USING (is_active = true);

CREATE POLICY blog_categories_admin_all ON public.blog_categories
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Blog posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published posts
CREATE POLICY blog_posts_select_published ON public.blog_posts
FOR SELECT USING (status = 'published');

-- Authors can manage their own posts
CREATE POLICY blog_posts_author_manage ON public.blog_posts
FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Admins can manage all posts
CREATE POLICY blog_posts_admin_all ON public.blog_posts
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Blog post views
ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY blog_views_insert_own ON public.blog_post_views
FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Admins can see all views
CREATE POLICY blog_views_admin_select ON public.blog_post_views
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_blog_post_views TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_featured_creators TO authenticated, anon;

COMMENT ON TABLE public.creators_of_week IS 'Featured content creators with social media links';
COMMENT ON TABLE public.blog_categories IS 'Categories for organizing blog posts';
COMMENT ON TABLE public.blog_posts IS 'Blog posts for news, updates, and announcements';
COMMENT ON TABLE public.blog_post_views IS 'Track views on blog posts with deduplication';