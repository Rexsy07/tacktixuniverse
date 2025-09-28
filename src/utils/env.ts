// Environment variables utility
// Provides safe access to environment variables with fallbacks

// Get environment variable from either import.meta.env or window.__ENV
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try Vite's import.meta.env first
  const viteEnv = (import.meta as any)?.env?.[key];
  if (viteEnv) return viteEnv;
  
  // Fallback to window.__ENV (for public/env.js)
  const windowEnv = (globalThis as any).__ENV?.[key];
  if (windowEnv) return windowEnv;
  
  return fallback;
};

// Contact Information
export const SUPPORT_EMAIL = getEnvVar('VITE_SUPPORT_EMAIL', 'tacktixedgedispute@gmail.com');
export const SUPPORT_PHONE = getEnvVar('VITE_SUPPORT_PHONE', '08141826128');
export const COMPANY_LOCATION = getEnvVar('VITE_COMPANY_LOCATION', 'Lagos, Nigeria');

// Social Media URLs
export const DISCORD_URL = getEnvVar('VITE_DISCORD_URL', 'https://discord.gg/3ZRHggav');
export const WHATSAPP_URL = getEnvVar('VITE_WHATSAPP_URL', 'https://wa.me/08141826128');
export const INSTAGRAM_URL = getEnvVar('VITE_INSTAGRAM_URL', 'https://www.instagram.com/tacktixedge');
export const TELEGRAM_URL = getEnvVar('VITE_TELEGRAM_URL', 'https://t.me/tacktixedgechannel');
export const TIKTOK_URL = getEnvVar('VITE_TIKTOK_URL', 'https://tiktok.com/@tacktixedge');

// Company/Brand Information
export const COMPANY_NAME = getEnvVar('VITE_COMPANY_NAME', 'TacktixEdge');
export const COMPANY_TAGLINE = getEnvVar('VITE_COMPANY_TAGLINE', 'Nigeria\'s premier competitive gaming platform');

// Default values for development - these should be overridden by environment variables in production
export const ENV_CONFIG = {
  support: {
    email: SUPPORT_EMAIL,
    phone: SUPPORT_PHONE,
    location: COMPANY_LOCATION,
  },
  social: {
    discord: DISCORD_URL,
    whatsapp: WHATSAPP_URL,
    instagram: INSTAGRAM_URL,
    telegram: TELEGRAM_URL,
    tiktok: TIKTOK_URL,
  },
  company: {
    name: COMPANY_NAME,
    tagline: COMPANY_TAGLINE,
  }
};