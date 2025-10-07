# Copilot Instructions for SplitWisely

## Project Overview

SplitWisely is a modern expense sharing app built with React + TypeScript (frontend) and Supabase (backend for auth, data, and RLS policies). It helps groups track shared expenses, balances, and settlements.

## Architecture & Key Patterns

- **Frontend:**
  - Located in `src/`.
  - Major pages: `src/pages/` (Dashboard, Expenses, Groups, Settings, Settlements).
  - Forms and UI logic: `src/components/` (organized by domain: auth, expenses, groups, settlements).
  - State/data hooks: `src/hooks/` (e.g., `useGroups`, `useExpenses`).
  - Supabase integration: `src/lib/supabaseClient.ts` (initializes client), `src/providers/SupabaseProvider.tsx` (context provider).
- **Backend (Supabase):**
  - Database schema: `supabase/schema.sql`.
  - Migrations: `supabase/migrations/` (chronological, keep in sync with schema).
  - Helper functions: `is_group_member`, `is_group_admin` (used for RLS policies).

## Developer Workflows

- **Install:**
  - Node.js 20+ required.
  - `npm install` to set up dependencies.
- **Environment:**
  - Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Database:**
  - Use Supabase CLI: `supabase link --project-ref <project-ref>`.
  - Apply migrations: `npx supabase db push` (runs schema and migrations).
- **Run Dev Server:**
  - `npm run dev` (Vite, default at `http://localhost:5173`).
- **Build for Production:**
  - `npm run build` (uses Vite config, outputs static site).
- **Deploy:**
  - GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on `main` branch changes.
  - Ensure repo secrets for Supabase keys are set.

## Conventions & Patterns

- **Hooks:** Custom hooks for data access and state live in `src/hooks/`. Always use these for cross-component data.
- **Forms:** Domain-specific forms in `src/components/{domain}/`.
- **Supabase:** Only use anon keys in frontend. Never commit service-role keys.
- **Schema:** Canonical schema is `supabase/schema.sql`; always update migrations to match.
- **SPA Routing:** `index.html` is duplicated as `404.html` for GitHub Pages SPA support.

## Integration Points

- **Supabase:** All data/auth flows go through Supabase client and provider.
- **GitHub Actions:** Automated deploy pipeline; see `.github/workflows/deploy.yml`.

## Examples

- To add a new expense type, create a form in `src/components/expenses/`, update hooks in `src/hooks/useExpenses.ts`, and update schema/migrations as needed.
- For new RLS policies, update `supabase/schema.sql` and add a migration.

---

For questions or unclear patterns, review `README.md` and key files above, or ask for clarification.
