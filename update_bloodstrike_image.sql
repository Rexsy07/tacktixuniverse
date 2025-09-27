-- Update all game images with the correct image paths
-- The paths should be relative to the public directory for web serving

-- Update Blood Strike
UPDATE public.games 
SET cover_image_url = '/Bloodstrike.PNG'
WHERE name = 'Blood Strike';

-- Update Call of Duty: Mobile
UPDATE public.games 
SET cover_image_url = '/Callofdutymobile.PNG'
WHERE name = 'Call of Duty: Mobile';

-- Update EA FC Mobile
UPDATE public.games 
SET cover_image_url = '/Eafcmobile.PNG'
WHERE name = 'EA FC Mobile';

-- Update Free Fire
UPDATE public.games 
SET cover_image_url = '/freefire.PNG'
WHERE name = 'Free Fire';

-- Update eFootball / PES Mobile
UPDATE public.games 
SET cover_image_url = '/pes.PNG'
WHERE name = 'eFootball / PES Mobile';

-- Update PUBG Mobile
UPDATE public.games 
SET cover_image_url = '/Pubgmobile.PNG'
WHERE name = 'PUBG Mobile';

-- Update Sniper Strike
UPDATE public.games 
SET cover_image_url = '/SniperStrike.PNG'
WHERE name = 'Sniper Strike';

-- Verify all updates
SELECT id, name, short_name, cover_image_url 
FROM public.games 
ORDER BY name;
