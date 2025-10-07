import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiCheckCircle, FiFileText, FiLogOut, FiMoon, FiPlus, FiSettings, FiSun, FiUsers } from 'react-icons/fi';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import ExpensesPage from './pages/ExpensesPage';
import SettlementsPage from './pages/SettlementsPage';
import SettingsPage from './pages/SettingsPage';
import { useSupabase } from './providers/SupabaseProvider';
import { AuthView } from './components/auth/AuthView';

const sidebarNavItems = [
  { label: 'Dashboard', path: '/', icon: FiBarChart2 },
  { label: 'Groups', path: '/groups', icon: FiUsers },
  { label: 'Expenses', path: '/expenses', icon: FiFileText },
  { label: 'Settlements', path: '/settlements', icon: FiCheckCircle },
  { label: 'Settings', path: '/settings', icon: FiSettings }
];

const mobileNavItems = [
  { label: 'Dashboard', path: '/', icon: FiBarChart2 },
  { label: 'Groups', path: '/groups', icon: FiUsers },
  { label: 'Expenses', path: '/expenses', icon: FiFileText },
  { label: 'Settlements', path: '/settlements', icon: FiCheckCircle },
  { label: 'Settings', path: '/settings', icon: FiSettings }
];

const THEME_STORAGE_KEY = 'splitwisely:theme';

const readStoredTheme = (): boolean | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') {
      return true;
    }
    if (stored === 'light') {
      return false;
    }
  } catch (error) {
    console.warn('Unable to read the theme preference', error);
  }

  return null;
};

const persistTheme = (isDark: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch (error) {
    console.warn('Unable to persist the theme preference', error);
  }
};

const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, supabase } = useSupabase();
  const storedPreference = useRef(readStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => storedPreference.current ?? prefersDarkMode());
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(() => storedPreference.current !== null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (hasExplicitPreference) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setIsDark(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, [hasExplicitPreference]);

  const toggleTheme = () =>
    setIsDark((value) => {
      const next = !value;
      setHasExplicitPreference(true);
      persistTheme(next);
      return next;
    });
  const openQuickAddExpense = () => {
    navigate('/expenses', { state: { openCreate: true, token: Date.now() } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const activeTitle = useMemo(() => {
    const allNavItems = [...sidebarNavItems, ...mobileNavItems];
    const match = allNavItems.find((item) => item.path === location.pathname);
    return match?.label ?? 'Dashboard';
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <FiSun className="h-4 w-4 animate-spin" /> Loading SplitWisely…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-slate-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-5xl bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_60%)]" />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <AuthView />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-200 md:bg-white/90 md:shadow-2xl md:backdrop-blur dark:md:border-slate-800 dark:md:bg-slate-950/80">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <span className="text-lg font-semibold">SW</span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">SplitWisely</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plan. Split. Settle.</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {sidebarNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-3 border-t border-slate-200 px-6 py-6 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-600 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
            >
              {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800/80 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:border-rose-700"
            >
              <FiLogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="relative flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">{new Date().toLocaleDateString()}</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{activeTitle}</h1>
            </div>
            <div className="hidden items-center gap-4 lg:flex">
              <button
                type="button"
                onClick={openQuickAddExpense}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
              >
                <FiPlus className="h-4 w-4" /> Quick add expense
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
                  {user.email?.slice(0, 1).toUpperCase() ?? 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{user.user_metadata?.full_name ?? 'You'}</p>
                  <p className="text-slate-500 dark:text-slate-300">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={openQuickAddExpense}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500"
              >
                <FiPlus className="h-4 w-4" /> Add
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
              >
                {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800/80 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:border-rose-700"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {user.email?.slice(0, 1).toUpperCase() ?? 'U'}
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:pb-12">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="*"
              element={
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-700/70 dark:bg-slate-900/60">
                  <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Lost in the splits?</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    We couldn&apos;t find that page. Use the navigation to get back on track.
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
        <button
          type="button"
          onClick={openQuickAddExpense}
          className="fixed bottom-20 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 lg:hidden"
          aria-label="Quick add expense"
        >
          <FiPlus className="h-6 w-6" />
        </button>
        <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-3">
            {mobileNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
};

export default App;
