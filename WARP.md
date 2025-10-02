# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + Supabase
- Hosting: GitHub Pages (via Actions). Production base path is /tacktixuniverse
- Monorepo: No. Single web app under src/

Common commands
- Install (local)
  - npm i
  - CI uses npm ci (Node 20)
- Develop (Vite dev server at http://localhost:8080)
  - npm run dev
- Build
  - npm run build
  - Notes: postbuild copies dist/index.html to dist/404.html and adds dist/.nojekyll for GitHub Pages
- Preview built app locally
  - npm run preview
- Lint and formatting
  - Lint: npm run lint
  - Auto-fix: npm run lint:fix
  - Format: npm run format
- Deploy
  - On push to main, GitHub Actions builds and deploys to Pages (see .github/workflows/deploy.yml)
  - Manual (optional): npm run deploy (uses gh-pages to push dist to gh-pages); prefer CI unless you know you need this

Environment and configuration
- Supabase (required at runtime/build)
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
  - Where to set:
    - Local: create .env with the above VITE_ variables (Vite exposes them to client code)
    - CI: already provided via repository secrets in deploy.yml
  - Fallback: If VITE_SUPABASE_URL is not set, src/integrations/supabase/client.ts attempts to derive it from supabase/config.toml (project_id)
- Dev server
  - Port: 8080 (vite.config.ts sets strictPort: true)
  - Base path: “/” in dev; “/tacktixuniverse/” in production builds (aligned with BrowserRouter basename)

Notes on testing
- No test runner is configured in this project. There are currently no test scripts.

Architecture and code map (high level)
- App bootstrap (src/main.tsx, src/App.tsx)
  - Creates QueryClient (TanStack Query)
  - Wraps the app with QueryClientProvider, TooltipProvider, two Toasters (shadcn/sonner), and AuthProvider
  - BrowserRouter is configured with basename “/tacktixuniverse” in production to match GitHub Pages
- Routing (src/App.tsx)
  - Public routes: /, /games, /games/:slug, /tournaments, /tournaments/:id, /leaderboards, /how-it-works, /support, /signup, /login, password reset routes
  - User dashboard (protected): /profile, /wallet, /matches, /my-tournaments, /create-challenge, /matches/:matchId, /notifications
  - Admin (protected + role-gated): /admin and subroutes for users, wallet, matches, tournaments (create/detail/manage), analytics, notifications, settings
  - Protection is via <ProtectedRoute requireAdmin?>, which checks auth state and role
- Auth and roles (src/hooks/useAuth.tsx, src/components/ProtectedRoute.tsx)
  - AuthProvider tracks Supabase session/user and exposes signUp/signIn/signOut
  - Role resolution via supabase.from('user_roles').select('role').eq('user_id', user.id).single(); sets isAdmin
  - ProtectedRoute redirects unauthenticated users to /login; enforces isAdmin when requireAdmin is true
- Data layer
  - Supabase client (src/integrations/supabase/client.ts) is typed with Database (src/integrations/supabase/types.ts)
  - Domain hooks under src/hooks/ (e.g., useGames, useTournaments, useMatches, useLeaderboards, useProfile, useWalletHolds, etc.) typically pair TanStack Query with Supabase
- UI/system
  - shadcn/ui components live in src/components/ui/*; shared layout/components in src/components/*
  - Tailwind configured via tailwind.config.ts and postcss.config.js
  - Utility helpers in src/lib/utils.ts and domain constants in src/utils/gameFormats.ts
- Tournament features
  - See TEAM_TOURNAMENTS_README.md for schema changes, team registration UX, and bracket logic for team formats (2v2, 4v4, etc.)

Tooling and config highlights
- Vite (vite.config.ts)
  - Sets base dynamically by mode so GitHub Pages serves under /tacktixuniverse/
  - Aliases @ to ./src
- TypeScript (tsconfig.app.json, tsconfig.json)
  - Path alias @/* => ./src/*
- ESLint (eslint.config.js)
  - Flat config with @typescript-eslint, react-hooks, react-refresh; warns on any/no-unused-vars and disallows debugger
- CI/CD (.github/workflows/deploy.yml)
  - Triggers on push to main
  - Node 20, npm ci, npm run build
  - Injects VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (and VITE_SUPABASE_PROJECT_ID) from repo secrets
  - Uploads dist as Pages artifact and deploys to GitHub Pages

Operational tips for future agents
- Verify .env contains VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before starting the dev server, or ensure supabase/config.toml is present with a valid project_id so the URL can be derived
- When changing routes or GitHub Pages settings, keep vite.config.ts base and BrowserRouter basename in sync with the repository name used for Pages
- If adding data fetching, prefer creating/using hooks in src/hooks/* with TanStack Query, and use the typed Supabase client for queries
