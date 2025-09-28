// Environment variables will be injected here by the build process
// Do not commit actual credentials to this file
window.__ENV = {
  VITE_SUPABASE_PROJECT_ID: process.env.VITE_SUPABASE_PROJECT_ID || 'your_project_id',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'your_supabase_url',
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your_anon_key'
};
