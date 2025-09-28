-- Ensure match_results table exists with proper structure for admin review
-- This script adds the admin_reviewed column if it doesn't exist

-- First, let's check if match_results table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.match_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    result_type text NOT NULL CHECK (result_type IN ('win', 'loss', 'dispute')),
    result_data jsonb DEFAULT '{}'::jsonb,
    screenshot_url text,
    uploaded_at timestamp with time zone DEFAULT now(),
    verified boolean DEFAULT false,
    admin_reviewed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add admin_reviewed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'match_results' 
        AND column_name = 'admin_reviewed'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.match_results ADD COLUMN admin_reviewed boolean DEFAULT false;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON public.match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_uploader_id ON public.match_results(uploader_id);
CREATE INDEX IF NOT EXISTS idx_match_results_uploaded_at ON public.match_results(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_results_admin_reviewed ON public.match_results(admin_reviewed) WHERE admin_reviewed = false;

-- Set up RLS (Row Level Security)
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own results and results of matches they're in
CREATE POLICY "Users can view match results for their matches" ON public.match_results
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.match_participants mp
        WHERE mp.match_id = match_results.match_id 
        AND mp.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_results.match_id 
        AND (m.creator_id = auth.uid() OR m.opponent_id = auth.uid())
    )
    OR uploader_id = auth.uid()
);

-- Policy for users to upload results for matches they're in
CREATE POLICY "Users can upload results for their matches" ON public.match_results
FOR INSERT WITH CHECK (
    uploader_id = auth.uid() 
    AND (
        EXISTS (
            SELECT 1 FROM public.match_participants mp
            WHERE mp.match_id = match_results.match_id 
            AND mp.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_results.match_id 
            AND (m.creator_id = auth.uid() OR m.opponent_id = auth.uid())
        )
    )
);

-- Policy for users to update their own uploaded results
CREATE POLICY "Users can update their own results" ON public.match_results
FOR UPDATE USING (uploader_id = auth.uid());

-- Policy for admins to see all results
CREATE POLICY "Admins can view all match results" ON public.match_results
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);

-- Policy for admins to update any result (for marking as reviewed)
CREATE POLICY "Admins can update any match result" ON public.match_results
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_match_results_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS tr_match_results_updated_at ON public.match_results;
CREATE TRIGGER tr_match_results_updated_at
    BEFORE UPDATE ON public.match_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_match_results_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.match_results TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create helpful function to get match results with team info
CREATE OR REPLACE FUNCTION public.get_match_results_with_teams(p_match_id uuid)
RETURNS TABLE(
    id uuid,
    match_id uuid,
    uploader_id uuid,
    uploader_username text,
    uploader_team text,
    result_type text,
    result_data jsonb,
    screenshot_url text,
    uploaded_at timestamp with time zone,
    verified boolean,
    admin_reviewed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        mr.match_id,
        mr.uploader_id,
        COALESCE(p.username, 'Unknown') as uploader_username,
        COALESCE(mp.team, 
            CASE 
                WHEN m.creator_id = mr.uploader_id THEN 'A'
                WHEN m.opponent_id = mr.uploader_id THEN 'B'
                ELSE 'Unknown'
            END
        ) as uploader_team,
        mr.result_type,
        mr.result_data,
        mr.screenshot_url,
        mr.uploaded_at,
        mr.verified,
        mr.admin_reviewed
    FROM public.match_results mr
    LEFT JOIN public.profiles p ON p.user_id = mr.uploader_id
    LEFT JOIN public.match_participants mp ON mp.match_id = mr.match_id AND mp.user_id = mr.uploader_id
    LEFT JOIN public.matches m ON m.id = mr.match_id
    WHERE mr.match_id = p_match_id
    ORDER BY mr.uploaded_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_match_results_with_teams(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.match_results IS 'Stores match results uploaded by participants';
COMMENT ON COLUMN public.match_results.result_type IS 'Type of result: win, loss, or dispute';
COMMENT ON COLUMN public.match_results.result_data IS 'Additional data like score, reason, etc.';
COMMENT ON COLUMN public.match_results.admin_reviewed IS 'Whether an admin has reviewed this result';
COMMENT ON FUNCTION public.get_match_results_with_teams(uuid) IS 'Get match results with team information for admin review';