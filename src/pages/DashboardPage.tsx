const DashboardPage = () => (
  <section className="space-y-6">
    <header>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Stay on top of recent activity, outstanding balances, and quick actions.
      </p>
    </header>
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Recent groups</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Once connected to Supabase, you&apos;ll see your newest groups here for quick access.
        </p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Balances</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Track how much you owe or are owed across all groups in real time.
        </p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Recent expenses</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Recent activity will appear here soon. You can add new expenses from the actions menu.
        </p>
      </article>
    </div>
  </section>
);

export default DashboardPage;
