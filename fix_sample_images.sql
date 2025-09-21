-- ============================================================================
-- Fix sample data with working placeholder images
-- ============================================================================

-- Update existing games with working placeholder images
UPDATE public.games 
SET cover_image_url = CASE 
  WHEN name = 'Counter-Strike 2' THEN 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=CS2'
  WHEN name = 'Valorant' THEN 'https://via.placeholder.com/300x200/FF4655/FFFFFF?text=Valorant'
  WHEN name = 'League of Legends' THEN 'https://via.placeholder.com/300x200/C89B3C/FFFFFF?text=LoL'
  ELSE 'https://via.placeholder.com/300x200/6C63FF/FFFFFF?text=Game'
END
WHERE cover_image_url LIKE '%example.com%';

-- Alternative: Use actual game images (if you want real images)
-- UPDATE public.games 
-- SET cover_image_url = CASE 
--   WHEN name = 'Counter-Strike 2' THEN 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg'
--   WHEN name = 'Valorant' THEN 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5b6d5b5e4d9ec74c/5eb26f7e7c24a656b7c4ebb2/V_AGENTS_587x900.jpg'
--   WHEN name = 'League of Legends' THEN 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg'
--   ELSE cover_image_url
-- END
-- WHERE cover_image_url LIKE '%example.com%';

-- Check the updated games
SELECT id, name, short_name, cover_image_url 
FROM public.games 
ORDER BY created_at;