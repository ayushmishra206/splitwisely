const SettingsPage = () => (
  <section className="space-y-6">
    <header>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Configure personal preferences, notifications, and export or import data.
      </p>
    </header>
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Theme</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Toggle dark mode in the header to update your viewing experience.
        </p>
      </div>
      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Data management</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Import, export, and reset data integrations will live here.
        </p>
      </div>
    </div>
  </section>
);

export default SettingsPage;
