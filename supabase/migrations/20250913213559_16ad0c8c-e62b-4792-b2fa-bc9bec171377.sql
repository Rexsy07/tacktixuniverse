-- Fix RLS policy for user_stats to allow users to view their own stats
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;

CREATE POLICY "Users can view their own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also allow admin access
CREATE POLICY "Admins can view all user stats" 
ON public.user_stats 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));