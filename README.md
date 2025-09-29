# SplitWisely

A modern expense sharing app that pairs a React + TypeScript frontend with a Supabase backend for authentication, data storage, and real-time policies. SplitWisely helps roommates, friends, and travel groups track shared expenses, keep balances transparent, and settle up quickly.

## ✅ Current Progress

- Migrated the legacy vanilla JS PWA to a **React 18 + Vite** codebase with TypeScript and Tailwind CSS
- Provisioned a **Supabase Postgres schema** (profiles, groups, group_members, expenses, expense_splits, settlements) with row-level security
- Implemented **Supabase email/password authentication** and session management via a custom provider
- Delivered a full **Groups management experience** (create, edit, delete, membership hydration) backed by Supabase services and hooks
- Built **Expense CRUD flows** with equal-split automation, modal forms, and group filtering
- Hardened Supabase policies to remove recursive checks and introduced helper functions (`is_group_member`, `is_group_admin`) for safe authorization
- Verified production builds (`npm run build`) and created migrations to keep remote databases in sync

## 🛠️ Tech Stack

- **React 18 + TypeScript** with Vite bundling
- **Tailwind CSS** for design system and theming
- **Supabase** (Postgres, Auth, Row-Level Security)
- **React Router** for SPA navigation
- **React Hook Form + Zod** for robust form handling and validation
- **ESLint + TypeScript** for static checks

## 🚧 Next Steps

- Apply the latest Supabase migrations to all environments to ensure the new RLS helpers are live
- Expand the expense module with custom split modes, receipt uploads, and richer summaries
- Implement the settlements workflow (record, edit, automate suggested payouts)
- Add automated tests (component/unit) and Supabase seed scripts for sample data
- Polish documentation (environment, deployment, troubleshooting) and wire up CI/CD for builds + migrations

## 🗂️ Project Structure

```
splitwisely/
├── src/
│   ├── components/        # UI building blocks (auth, groups, expenses)
│   ├── hooks/             # Custom hooks (useGroups, useExpenses, etc.)
│   ├── pages/             # Route pages (Dashboard, Groups, Expenses, Settlements, Settings)
│   ├── providers/         # Supabase provider and context
│   └── lib/               # Supabase client and generated types
├── supabase/
│   ├── schema.sql         # Canonical database definition
│   └── migrations/        # Versioned SQL migrations
├── public/                # Static assets (if any)
├── package.json
├── vite.config.ts
└── README.md
```

## ⚙️ Getting Started

### 1. Prerequisites

- Node.js 20+
- Supabase CLI (`npm install -g supabase`) or access to the Supabase SQL editor

### 2. Clone & Install

```bash
git clone https://github.com/ayushmishra206/splitwisely.git
cd splitwisely
npm install
```

### 3. Environment Variables

Create `.env.local` (or `.env`) at the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

The anon key is safe to expose in the browser. **Never** commit service-role keys.

### 4. Database Setup

1. Link your Supabase project (`supabase link --project-ref <project-ref>`) if you’re using the CLI.
2. Apply migrations:

   ```bash
   npx supabase db push
   ```

   This runs `supabase/schema.sql` and the migrations in chronological order, ensuring helper functions (`is_group_member`, `is_group_admin`) and policies are up to date.

### 5. Development

```bash
npm run dev
```

Visit the Vite dev server URL (default `http://localhost:5173`). Sign up with an email/password to create a Supabase profile and start building groups and expenses.

### 6. Production Build

```bash
npm run build
npm run preview   # Optional: serve the build locally
```

## 🧰 NPM Scripts

| Command             | Description                                      |
|---------------------|--------------------------------------------------|
| `npm run dev`       | Start Vite dev server with hot module reload     |
| `npm run build`     | Type-check then produce a production build       |
| `npm run preview`   | Serve the production build locally               |

## 🗄️ Database & Security

- The canonical schema lives in `supabase/schema.sql` and is mirrored in generated migrations under `supabase/migrations/`.
- Helper functions `is_group_member` and `is_group_admin` gate access to group-specific data without triggering recursive RLS.
- Policies enforce:
  - Authenticated read/write access scoped to group membership
  - Only owners (admins) can manage membership
  - Expense and settlement writes are restricted to group members
- Run `npx supabase db push` whenever migrations change to keep remote environments in sync.

## 🚀 Deploying to GitHub Pages

The repository includes `.github/workflows/deploy.yml`, which builds and deploys the site to GitHub Pages whenever `main` changes (or when triggered manually).

1. Enable GitHub Pages with the **GitHub Actions** source under *Settings → Pages*.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets so the build step can reach Supabase.
3. (Optional) Provide a `VITE_PUBLIC_PATH` secret if you need a sub-path (for example `/splitwisely/`). The workflow defaults to `/`, which is correct for a custom domain.
4. The workflow copies the root `CNAME` into the published artifact and duplicates `index.html` as `404.html`, ensuring your domain mapping and SPA routes continue working after deploy.

To reproduce the deployment locally:

```bash
VITE_PUBLIC_PATH=/ npm run build
cp CNAME dist/CNAME
cp dist/index.html dist/404.html
```

Then push the contents of `dist/` to your hosting provider or GitHub Pages manually.

## 🤝 Contributing

1. Fork the repository and create a feature branch
2. Run the Supabase migrations locally before making changes
3. Follow the existing TypeScript, Tailwind, and ESLint conventions
4. Add or update documentation/tests where relevant
5. Submit a pull request describing your changes and testing steps

## 📄 License

MIT License — see [`LICENSE`](LICENSE) for details.

---

Built with ❤️ using React, TypeScript, and Supabase.