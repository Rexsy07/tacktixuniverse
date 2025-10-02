-- Enhanced Advertise & Earn Database Schema
-- Additional tables and functions to support the advertising system

-- 1) Payment tracking table
CREATE TABLE IF NOT EXISTS public.advertise_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_ids UUID[] NOT NULL, -- Array of submission IDs included in this payment
    total_views INTEGER NOT NULL DEFAULT 0,
    total_submissions INTEGER NOT NULL DEFAULT 0,
    amount_ngn NUMERIC NOT NULL DEFAULT 0,
    rate_per_1000 NUMERIC NOT NULL DEFAULT 500,
    payment_method TEXT DEFAULT 'bank_transfer',
    transaction_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
    payment_notes TEXT,
    paid_by UUID REFERENCES auth.users(id),
    paid_at TIMESTAMP WITH TIME ZONE,
    payout_week DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_adpay_user ON public.advertise_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_adpay_status ON public.advertise_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_adpay_week ON public.advertise_payments(payout_week);
CREATE INDEX IF NOT EXISTS idx_adpay_created ON public.advertise_payments(created_at DESC);

-- 2) Platform settings table
CREATE TABLE IF NOT EXISTS public.advertise_platforms (
    platform TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    rate_per_1000 NUMERIC NOT NULL DEFAULT 500,
    url_pattern TEXT, -- Regex pattern for URL validation
    min_views INTEGER NOT NULL DEFAULT 1000,
    max_views INTEGER DEFAULT 10000000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon_url TEXT,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO public.advertise_platforms (platform, display_name, url_pattern, min_views, icon_url) VALUES 
('YouTube', 'YouTube', '^https?://(www\.)?(youtube\.com|youtu\.be)/', 1000, '/youtube-icon.png'),
('TikTok', 'TikTok', '^https?://(www\.)?tiktok\.com/', 500, '/tiktok-icon.png'),
('Instagram', 'Instagram', '^https?://(www\.)?instagram\.com/', 500, '/instagram-icon.png'),
('Facebook', 'Facebook', '^https?://(www\.)?facebook\.com/', 1000, '/facebook-icon.png'),
('X', 'X (Twitter)', '^https?://(www\.)?(x\.com|twitter\.com)/', 200, '/x-icon.png'),
('Snapchat', 'Snapchat', '^https?://(www\.)?snapchat\.com/', 300, '/snapchat-icon.png'),
('Other', 'Other Platform', null, 500, '/other-icon.png')
ON CONFLICT (platform) DO NOTHING;

-- 3) Analytics/stats table for tracking performance
CREATE TABLE IF NOT EXISTS public.advertise_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT REFERENCES public.advertise_platforms(platform),
    total_submissions INTEGER NOT NULL DEFAULT 0,
    total_views INTEGER NOT NULL DEFAULT 0,
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    active_creators INTEGER NOT NULL DEFAULT 0,
    approved_submissions INTEGER NOT NULL DEFAULT 0,
    rejected_submissions INTEGER NOT NULL DEFAULT 0,
    pending_submissions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(date, platform)
);

CREATE INDEX IF NOT EXISTS idx_adanalytics_date ON public.advertise_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_adanalytics_platform ON public.advertise_analytics(platform);

-- 4) User earnings summary view
CREATE OR REPLACE VIEW public.user_advertise_summary AS
SELECT 
    s.user_id,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submissions,
    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_submissions,
    COUNT(CASE WHEN s.status = 'paid' THEN 1 END) as paid_submissions,
    SUM(s.views) as total_views,
    SUM(CASE WHEN s.status IN ('approved', 'paid') THEN s.views ELSE 0 END) as approved_views,
    SUM(CASE WHEN s.status IN ('approved', 'paid') THEN FLOOR(s.views / 1000) * s.rate_per_1000 ELSE 0 END) as total_earnings,
    SUM(CASE WHEN s.status = 'paid' THEN FLOOR(s.views / 1000) * s.rate_per_1000 ELSE 0 END) as paid_earnings,
    SUM(CASE WHEN s.status = 'approved' THEN FLOOR(s.views / 1000) * s.rate_per_1000 ELSE 0 END) as pending_payout,
    MIN(s.created_at) as first_submission,
    MAX(s.updated_at) as last_activity
FROM public.advertise_submissions s
GROUP BY s.user_id;

-- 5) Weekly payout calculation function
CREATE OR REPLACE FUNCTION public.calculate_weekly_payout(target_week DATE)
RETURNS TABLE (
    user_id UUID,
    submission_count BIGINT,
    total_views BIGINT,
    total_earnings NUMERIC,
    submission_ids UUID[]
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.user_id,
        COUNT(s.id) as submission_count,
        SUM(s.views)::BIGINT as total_views,
        SUM(FLOOR(s.views / 1000) * s.rate_per_1000) as total_earnings,
        ARRAY_AGG(s.id) as submission_ids
    FROM public.advertise_submissions s
    WHERE s.status = 'approved'
    AND (s.payout_week = target_week OR (s.payout_week IS NULL AND DATE_TRUNC('week', s.updated_at)::DATE = target_week))
    GROUP BY s.user_id
    HAVING SUM(s.views) >= 1000; -- Only users with at least 1000 total views
END;
$$;

-- 6) Bulk payment processing function
CREATE OR REPLACE FUNCTION public.process_weekly_payments(target_week DATE, processed_by UUID)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    payment_record RECORD;
    payment_id UUID;
    processed_count INTEGER := 0;
BEGIN
    -- Create payments for all eligible users
    FOR payment_record IN 
        SELECT * FROM public.calculate_weekly_payout(target_week)
    LOOP
        -- Insert payment record
        INSERT INTO public.advertise_payments (
            user_id, submission_ids, total_views, total_submissions, 
            amount_ngn, payout_week, paid_by
        ) VALUES (
            payment_record.user_id,
            payment_record.submission_ids,
            payment_record.total_views,
            payment_record.submission_count,
            payment_record.total_earnings,
            target_week,
            processed_by
        ) RETURNING id INTO payment_id;

        -- Mark submissions as paid
        UPDATE public.advertise_submissions 
        SET status = 'paid', payout_week = target_week, reviewed_by = processed_by
        WHERE id = ANY(payment_record.submission_ids);

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$;

-- 7) Update trigger for payments table
CREATE OR REPLACE FUNCTION public.tg_touch_payment_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_adpay_touch_updated
BEFORE UPDATE ON public.advertise_payments
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_payment_updated_at();

-- 8) Update trigger for platforms table  
CREATE TRIGGER trg_adplatform_touch_updated
BEFORE UPDATE ON public.advertise_platforms
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_payment_updated_at();

-- 9) RLS Policies for new tables

-- Payments table policies
ALTER TABLE public.advertise_payments ENABLE ROW LEVEL SECURITY;

-- Users can see their own payments
CREATE POLICY adpay_select_own ON public.advertise_payments
FOR SELECT USING (user_id = auth.uid());

-- Admins can see all payments
CREATE POLICY adpay_select_admin ON public.advertise_payments  
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

-- Only admins can insert/update payments
CREATE POLICY adpay_insert_admin ON public.advertise_payments
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

CREATE POLICY adpay_update_admin ON public.advertise_payments
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Platforms table policies (read-only for users, full access for admins)
ALTER TABLE public.advertise_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY adplatform_select_all ON public.advertise_platforms
FOR SELECT USING (true); -- Everyone can read platform settings

CREATE POLICY adplatform_modify_admin ON public.advertise_platforms
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Analytics table policies (admin only)
ALTER TABLE public.advertise_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY adanalytics_admin_all ON public.advertise_analytics
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
) WITH CHECK (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.calculate_weekly_payout TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_weekly_payments TO authenticated;

COMMENT ON TABLE public.advertise_payments IS 'Tracks payment batches for advertise submissions';
COMMENT ON TABLE public.advertise_platforms IS 'Platform-specific settings and validation rules';
COMMENT ON TABLE public.advertise_analytics IS 'Daily analytics data for advertising performance';
COMMENT ON FUNCTION public.calculate_weekly_payout IS 'Calculates payout amounts for a specific week';
COMMENT ON FUNCTION public.process_weekly_payments IS 'Processes all payments for a week and marks submissions as paid';