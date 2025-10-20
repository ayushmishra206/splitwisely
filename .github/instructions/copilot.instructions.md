# Copilot Instructions for SplitWisely

## Project Overview

SplitWisely is a modern expense sharing application that enables groups to track shared expenses, manage balances, and settle debts efficiently.

**Tech Stack:**

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL database, authentication, Row Level Security)
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (static hosting)

**Core Features:**

- User authentication and profile management
- Group creation and member management
- Expense tracking with flexible split methods
- Balance calculation and settlement tracking
- Real-time updates across devices

---

## Architecture & Key Patterns

### Frontend Structure (`src/`)

```
src/
├── components/          # Organized by domain
│   ├── auth/           # Login, signup, password reset
│   ├── expenses/       # Expense forms, lists, details
│   ├── groups/         # Group creation, management
│   ├── settlements/    # Settlement tracking, history
│   └── ui/             # Reusable UI components
├── pages/              # Route-level components
│   ├── Dashboard.tsx
│   ├── Expenses.tsx
│   ├── Groups.tsx
│   ├── Settings.tsx
│   └── Settlements.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useGroups.ts
│   ├── useExpenses.ts
│   └── useSettlements.ts
├── lib/                # Utilities and configurations
│   ├── supabaseClient.ts
│   └── utils.ts
├── providers/          # React context providers
│   └── SupabaseProvider.tsx
└── types/              # TypeScript type definitions
```

### Backend Structure (Supabase)

```
supabase/
├── schema.sql          # Canonical database schema
├── migrations/         # Chronological migration files
│   └── YYYYMMDDHHMMSS_description.sql
└── config.toml         # Supabase project configuration
```

**Key Database Tables:**

- `profiles` - User profiles and settings
- `groups` - Expense sharing groups
- `group_members` - Group membership with roles
- `expenses` - Expense records
- `expense_splits` - Individual expense splits
- `settlements` - Payment settlements between users

**Helper Functions:**

- `is_group_member(user_id, group_id)` - Check group membership
- `is_group_admin(user_id, group_id)` - Check admin privileges

### Security Model

**Row Level Security (RLS) Policies:**

- All tables have RLS enabled
- Policies use helper functions for permission checks
- Users can only access data for groups they're members of
- Admin-only operations restricted via `is_group_admin`

---

## Developer Workflows

### Initial Setup

```bash
# Prerequisites: Node.js 20+ and npm

# 1. Clone and install
git clone <repository-url>
cd splitwisely
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to your project
supabase link --project-ref <your-project-ref>

# 3. Apply schema and migrations
npx supabase db push

# 4. Verify schema
npx supabase db diff
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Changes

**When modifying the database:**

1. **Update canonical schema:**

   ```bash
   # Edit supabase/schema.sql with your changes
   ```

2. **Create migration:**

   ```bash
   # Generate new migration file
   npx supabase migration new description_of_change

   # Copy relevant changes from schema.sql to migration
   ```

3. **Apply changes:**

   ```bash
   # Push to remote database
   npx supabase db push
   ```

4. **Verify:**
   ```bash
   # Check for drift
   npx supabase db diff
   ```

### Deployment

**Automated Deployment (GitHub Actions):**

- Triggered on push to `main` branch
- Workflow: `.github/workflows/deploy.yml`
- Builds and deploys to GitHub Pages
- Requires repository secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

**Manual Deployment:**

```bash
npm run build
# Deploy dist/ folder to hosting service
```

---

## Conventions & Best Practices

### Code Organization

**Custom Hooks:**

- Place in `src/hooks/`
- Name with `use` prefix: `useExpenses.ts`
- Handle data fetching, caching, and state management
- Return consistent interface: `{ data, loading, error, refetch }`

**Components:**

- Organize by domain in `src/components/{domain}/`
- Keep components focused and single-purpose
- Extract reusable UI to `src/components/ui/`
- Use TypeScript for all components

**Forms:**

- Domain-specific forms in `src/components/{domain}/`
- Use controlled components
- Implement proper validation
- Provide loading and error states

### Supabase Integration

**Security:**

- ⚠️ **NEVER** commit service-role keys
- Only use anon keys in frontend code
- Let RLS policies handle authorization
- Store keys in `.env.local` (gitignored)

**Data Access Pattern:**

```typescript
// Always use hooks for data access
const { groups, loading, error } = useGroups();

// Access Supabase client through context
const supabase = useSupabase();

// Respect RLS - queries filtered automatically
const { data } = await supabase
  .from("expenses")
  .select("*")
  .eq("group_id", groupId);
```

### TypeScript

- Define types in `src/types/`
- Use database types from Supabase CLI: `supabase gen types typescript`
- Avoid `any` - use `unknown` and type guards
- Export types from domain modules

### State Management

- Use React hooks for local state
- Supabase Realtime for cross-device sync
- Custom hooks for shared data access
- Context for app-wide state (auth, theme)

### Routing

- Client-side routing with React Router
- SPA support on GitHub Pages via `404.html` (copy of `index.html`)
- Protected routes require authentication

---

## Common Tasks

### Adding a New Feature

**Example: Adding expense categories**

1. **Update Database:**

   ```sql
   -- supabase/schema.sql
   ALTER TABLE expenses ADD COLUMN category TEXT;

   -- Create migration
   -- supabase/migrations/20240120000000_add_expense_categories.sql
   ALTER TABLE expenses ADD COLUMN category TEXT;
   ```

2. **Update Types:**

   ```typescript
   // src/types/expense.ts
   export interface Expense {
     // ... existing fields
     category?: string;
   }
   ```

3. **Update Hook:**

   ```typescript
   // src/hooks/useExpenses.ts
   // Add category to queries and mutations
   ```

4. **Update UI:**
   ```typescript
   // src/components/expenses/ExpenseForm.tsx
   // Add category input field
   ```

### Adding a New RLS Policy

```sql
-- supabase/schema.sql
CREATE POLICY "Users can view group expenses"
  ON expenses FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

-- Create corresponding migration
-- supabase/migrations/YYYYMMDDHHMMSS_add_expense_view_policy.sql
```

### Debugging Database Issues

```bash
# View current schema
npx supabase db dump --schema public

# Check RLS policies
npx supabase db dump --schema public --role-only

# Test as specific user
npx supabase db test

# View logs
npx supabase logs
```

---

## Integration Points

### Supabase

- **Authentication:** Handled by `SupabaseProvider` context
- **Database:** All queries through `supabaseClient`
- **Real-time:** Subscribe to changes via Supabase Realtime
- **Storage:** (Future) File uploads for receipts

### GitHub Actions

- **Workflow:** `.github/workflows/deploy.yml`
- **Triggers:** Push to `main` branch
- **Secrets:** Managed in repository settings
- **Output:** Deployed to `gh-pages` branch

---

## Troubleshooting

### Common Issues

**Build Errors:**

- Check Node.js version (requires 20+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Verify environment variables in `.env.local`

**Database Connection:**

- Verify Supabase URL and anon key
- Check project is not paused (free tier)
- Confirm RLS policies allow access

**Authentication Issues:**

- Clear browser localStorage
- Check Supabase Auth settings
- Verify redirect URLs in Supabase dashboard

**Deployment:**

- Ensure GitHub Pages is enabled
- Check repository secrets are set
- Verify base URL in `vite.config.ts`

---

## Resources

- **Project README:** See `README.md` for setup details
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

---

## Questions & Clarifications

For unclear patterns or missing documentation:

1. Check relevant source files in `src/`
2. Review `supabase/schema.sql` for data model
3. Examine existing implementations in similar features
4. Ask for clarification with specific context
