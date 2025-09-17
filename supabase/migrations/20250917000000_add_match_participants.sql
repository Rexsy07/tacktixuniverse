-- Support team-based matches by tracking participants per match/side
CREATE TABLE IF NOT EXISTS public.match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('A','B')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain','member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

-- Basic RLS: users can see participants of matches they are in; admins can see all
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view participants of their matches"
ON public.match_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
      AND (m.creator_id = auth.uid() OR m.opponent_id = auth.uid())
  )
  OR user_id = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Users can insert themselves as participants"
ON public.match_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Users can remove themselves before start"
ON public.match_participants FOR DELETE
USING (
  user_id = auth.uid()
);


