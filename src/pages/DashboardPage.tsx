import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiExternalLink,
  FiLoader,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import { useGroups } from '../hooks/useGroups';
import { useExpenses } from '../hooks/useExpenses';
import { useSettlements } from '../hooks/useSettlements';
import { useSupabase } from '../providers/SupabaseProvider';

const parseCurrencyAmount = (input: unknown): number => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : 0;
  }
  if (typeof input === 'string') {
    const parsed = Number.parseFloat(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const formatNetStatus = (net: number, currency: string) => {
  const absolute = Math.abs(net);
  if (net > 0.005) {
    return {
      tone: 'positive' as const,
      label: `You are owed ${formatCurrency(absolute, currency)}`
    };
  }
  if (net < -0.005) {
    return {
      tone: 'negative' as const,
      label: `You owe ${formatCurrency(absolute, currency)}`
    };
  }
  return {
    tone: 'neutral' as const,
    label: 'You are settled'
  };
};

type MemberBalance = {
  memberId: string;
  paid: number;
  owed: number;
  net: number;
  displayName: string;
};

const DashboardPage = () => {
  const { user } = useSupabase();
  const userId = user?.id ?? null;
  const { groups, isLoading: groupsLoading, error: groupsError } = useGroups();
  const { expenses, isLoading: expensesLoading, error: expensesError } = useExpenses();
  const {
    settlements,
    isLoading: settlementsLoading,
    error: settlementsError
  } = useSettlements();
  const isLoading = groupsLoading || expensesLoading || settlementsLoading;

  const { groupSummaries, currencySummaries, topBalances, totalGroups, totalExpenses } = useMemo(() => {
    const summaries = groups.map((group) => {
      const currency = group.currency ?? 'USD';
      const members = group.group_members ?? [];
      const relevantExpenses = expenses.filter((expense) => expense.group_id === group.id);

      const profileById = new Map<string, { full_name?: string | null }>();
      members.forEach((member) => {
        if (member.profiles) {
          profileById.set(member.member_id, { full_name: member.profiles.full_name ?? null });
        }
      });

      const tracker = new Map<string, { paid: number; owed: number }>();
      const ensureTracker = (memberId: string) => {
        if (!tracker.has(memberId)) {
          tracker.set(memberId, { paid: 0, owed: 0 });
        }
        return tracker.get(memberId)!;
      };

      relevantExpenses.forEach((expense) => {
        if (expense.payer && expense.payer.id) {
          profileById.set(expense.payer.id, { full_name: expense.payer.full_name ?? null });
        }
        const amount = parseCurrencyAmount(expense.amount);
        if (expense.payer_id) {
          const record = ensureTracker(expense.payer_id);
          record.paid += amount;
        }

        (expense.expense_splits ?? []).forEach((split) => {
          const share = parseCurrencyAmount(split.share);
          const record = ensureTracker(split.member_id);
          record.owed += share;
          if (split.profiles && split.profiles.id) {
            profileById.set(split.profiles.id, { full_name: split.profiles.full_name ?? null });
          }
        });
      });

      members.forEach((member) => {
        ensureTracker(member.member_id);
      });

      const relevantSettlements = settlements.filter((settlement) => settlement.group_id === group.id);
      relevantSettlements.forEach((settlement) => {
        const amount = parseCurrencyAmount(settlement.amount);
        const payerRecord = ensureTracker(settlement.from_member);
        const receiverRecord = ensureTracker(settlement.to_member);
        payerRecord.owed -= amount;
        receiverRecord.paid -= amount;
        if (settlement.from_profile && settlement.from_profile.id) {
          profileById.set(settlement.from_profile.id, { full_name: settlement.from_profile.full_name ?? null });
        }
        if (settlement.to_profile && settlement.to_profile.id) {
          profileById.set(settlement.to_profile.id, { full_name: settlement.to_profile.full_name ?? null });
        }
      });

      const memberSummaries: MemberBalance[] = Array.from(tracker.entries()).map(([memberId, { paid, owed }]) => {
        const net = paid - owed;
        const profile = profileById.get(memberId);
        const displayName = memberId === userId ? 'You' : profile?.full_name ?? 'Member';
        return {
          memberId,
          paid,
          owed,
          net,
          displayName
        };
      });

      memberSummaries.sort((a, b) => b.net - a.net);

      const totalSpent = relevantExpenses.reduce((sum, expense) => sum + parseCurrencyAmount(expense.amount), 0);

      return {
        group,
        currency,
        totalSpent,
        members: memberSummaries
      };
    });

    const currencyTotals = new Map<string, { paid: number; owed: number; net: number }>();
    summaries.forEach((summary) => {
      if (!userId) return;
      const currentUser = summary.members.find((member) => member.memberId === userId);
      if (!currentUser) return;
      const entry = currencyTotals.get(summary.currency) ?? { paid: 0, owed: 0, net: 0 };
      entry.paid += currentUser.paid;
      entry.owed += currentUser.owed;
      entry.net += currentUser.net;
      currencyTotals.set(summary.currency, entry);
    });

    const currencySummaries = Array.from(currencyTotals.entries()).map(([currency, totals]) => ({
      currency,
      ...totals
    }));

    const balancesForUser = summaries
      .map((summary) => {
        const currentUser = userId ? summary.members.find((member) => member.memberId === userId) : null;
        return {
          summary,
          user: currentUser
        };
      })
      .filter((entry) => entry.user)
      .sort((a, b) => Math.abs((b.user?.net ?? 0)) - Math.abs((a.user?.net ?? 0)));

    return {
      groupSummaries: summaries,
      currencySummaries,
      topBalances: balancesForUser,
      totalGroups: groups.length,
      totalExpenses: expenses.length
    };
  }, [groups, expenses, settlements, userId]);

  const hasData = groupSummaries.length > 0 && totalExpenses > 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Keep an eye on group spending, outstanding balances, and where to settle up next.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Snapshot</p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
            {totalGroups} group{totalGroups === 1 ? '' : 's'} • {totalExpenses} expense{totalExpenses === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {groupsError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
          <FiAlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">We couldn&apos;t load your groups.</p>
            <p>{groupsError.message}</p>
          </div>
        </div>
      ) : null}

      {expensesError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
          <FiAlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">We couldn&apos;t load your expenses.</p>
            <p>{expensesError.message}</p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <FiLoader className="h-4 w-4 animate-spin" /> Crunching the numbers…
        </div>
      ) : null}

      {settlementsError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
          <FiAlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">We couldn&apos;t load settlements.</p>
            <p>{settlementsError.message}</p>
          </div>
        </div>
      ) : null}

      {!isLoading ? (
        <>
          {currencySummaries.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currencySummaries.map(({ currency, paid, owed, net }) => {
                const netStatus = formatNetStatus(net, currency);
                return (
                  <article
                    key={currency}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Currency</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{currency}</h2>
                      </div>
                      <FiTrendingUp className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                    </div>
                    <dl className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                          <FiArrowUpCircle className="h-4 w-4 text-emerald-500" /> You paid
                        </dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(paid, currency)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                          <FiArrowDownCircle className="h-4 w-4 text-rose-500" /> You owe
                        </dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(owed, currency)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="font-medium text-slate-500 dark:text-slate-400">Net balance</dt>
                        <dd
                          className={
                            netStatus.tone === 'positive'
                              ? 'font-semibold text-emerald-500'
                              : netStatus.tone === 'negative'
                              ? 'font-semibold text-rose-500'
                              : 'font-semibold text-slate-500 dark:text-slate-400'
                          }
                        >
                          {formatCurrency(net, currency)}
                        </dd>
                      </div>
                    </dl>
                    <p
                      className={
                        'mt-4 text-sm ' +
                        (netStatus.tone === 'positive'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : netStatus.tone === 'negative'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500 dark:text-slate-400')
                      }
                    >
                      {netStatus.label}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add your first expense</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Once expenses are flowing, you&apos;ll see who owes whom across every currency.
              </p>
            </div>
          )}

          {topBalances.length ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 px-6 py-5 shadow-sm dark:border-indigo-500/40 dark:bg-indigo-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500 dark:text-indigo-300">Attention</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {topBalances.slice(0, 4).map(({ summary, user: userBalance }) => {
                  if (!userBalance) return null;
                  const status = formatNetStatus(userBalance.net, summary.currency);
                  return (
                    <div key={summary.group.id} className="rounded-xl bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur dark:bg-slate-950/60">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{summary.group.name}</p>
                      <p
                        className={
                          status.tone === 'positive'
                            ? 'mt-1 text-emerald-600 dark:text-emerald-300'
                            : status.tone === 'negative'
                            ? 'mt-1 text-rose-600 dark:text-rose-300'
                            : 'mt-1 text-slate-500 dark:text-slate-300'
                        }
                      >
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {groupSummaries.length ? (
            <div className="space-y-4">
              {groupSummaries.map((summary) => {
                const memberCount = summary.group.group_members?.length ?? summary.members.length;
                const you = userId ? summary.members.find((member) => member.memberId === userId) : null;
                const topMembers = summary.members.slice(0, 3);

                const renderYourPosition = () => {
                  if (!you) {
                    return (
                      <div>
                        <dt className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Your position</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-600 dark:text-slate-300">Not available</dd>
                      </div>
                    );
                  }
                  const youStatus = formatNetStatus(you.net, summary.currency);
                  return (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Your position</dt>
                      <dd
                        className={
                          'mt-1 text-lg font-semibold ' +
                          (youStatus.tone === 'positive'
                            ? 'text-emerald-500'
                            : youStatus.tone === 'negative'
                            ? 'text-rose-500'
                            : 'text-slate-600 dark:text-slate-300')
                        }
                      >
                        {youStatus.label}
                      </dd>
                    </div>
                  );
                };

                return (
                  <article
                    key={summary.group.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{summary.group.name}</h2>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            {summary.currency}
                          </span>
                        </div>
                        {summary.group.description ? (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{summary.group.description}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <FiUsers className="h-4 w-4" /> {memberCount} member{memberCount === 1 ? '' : 's'}
                      </div>
                    </header>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Total spent</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(summary.totalSpent, summary.currency)}
                        </dd>
                      </div>
                      {renderYourPosition()}
                      <div className="flex flex-col gap-1">
                        <dt className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Quick actions</dt>
                        <Link
                          to="/expenses"
                          state={{ groupId: summary.group.id }}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                          View expenses <FiExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </dl>

                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Top balances</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {topMembers.map((member) => {
                          const memberStatus = formatNetStatus(member.net, summary.currency);
                          return (
                            <li key={member.memberId} className="flex items-center justify-between gap-3">
                              <span>{member.displayName}</span>
                              <span
                                className={
                                  memberStatus.tone === 'positive'
                                    ? 'font-semibold text-emerald-500'
                                    : memberStatus.tone === 'negative'
                                    ? 'font-semibold text-rose-500'
                                    : 'font-semibold text-slate-500 dark:text-slate-400'
                                }
                              >
                                {formatCurrency(member.net, summary.currency)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create your first group</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Groups keep everyone on the same page. Add one, invite members, and start tracking expenses.
              </p>
            </div>
          )}
        </>
      ) : null}

      {isLoading || hasData ? null : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ready when you are</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Add a group and your first expense to see balances right here.
          </p>
        </div>
      )}
    </section>
  );
};

export default DashboardPage;
