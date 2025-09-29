import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCalendar,
  FiDollarSign,
  FiEdit2,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import { ExpenseForm, type ExpenseFormValues } from '../components/expenses/ExpenseForm';
import { useGroups } from '../hooks/useGroups';
import { useExpenses } from '../hooks/useExpenses';
import { computeEqualSplit, type ExpenseWithRelations, type SplitShareInput } from '../services/expenses';

interface LocationState {
  openCreate?: boolean;
  groupId?: string;
  description?: string;
  amount?: string;
  token?: number;
}

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ title, isOpen, onClose, children }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-transparent p-1 text-slate-500 transition hover:border-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="mt-6 max-h-[65vh] overflow-y-auto pr-1 sm:max-h-none sm:pr-0">{children}</div>
      </div>
    </div>
  );
};

const deriveSplits = (values: ExpenseFormValues): SplitShareInput[] => {
  const amount = Number.parseFloat((values.amount ?? '0').trim());
  if (!values.participantIds.length || Number.isNaN(amount) || amount <= 0) {
    return [];
  }

  if (values.splitMode === 'equal') {
    const evenShares = computeEqualSplit(amount, values.participantIds);
    return values.participantIds.map((memberId, index) => ({
      memberId,
      share: evenShares[index] ?? 0
    }));
  }

  return values.participantIds.map((memberId) => {
    const raw = (values.customSplits?.[memberId] ?? '0').trim();
    const parsed = Number.parseFloat(raw);
    return {
      memberId,
      share: Number.isNaN(parsed) ? 0 : parsed
    };
  });
};

const formatAmount = (amount: string, currency = 'USD') => {
  const numericAmount = Number.parseFloat(amount || '0');
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch (error) {
    return iso;
  }
};

const ExpensesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState) ?? null;
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExpenseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createPrefill, setCreatePrefill] = useState<Partial<ExpenseFormValues>>({});
  const [createKey, setCreateKey] = useState<number>(() => Date.now());
  const { groups, isLoading: isGroupsLoading, error: groupsError } = useGroups();
  const {
    expenses,
    isLoading: isExpensesLoading,
    error: expensesError,
    createExpense,
    updateExpense,
    deleteExpense
  } = useExpenses(selectedGroupId === 'all' ? {} : { groupId: selectedGroupId });

  useEffect(() => {
    if (!locationState) {
      return;
    }
    if (locationState.groupId) {
      setSelectedGroupId(locationState.groupId);
    }
    if (locationState.openCreate) {
      setIsCreateOpen(true);
    }
    if (locationState.groupId || locationState.description || locationState.amount) {
      setCreatePrefill((prev) => ({
        ...prev,
        ...(locationState.groupId ? { groupId: locationState.groupId } : {}),
        ...(locationState.description ? { description: locationState.description } : {}),
        ...(locationState.amount ? { amount: locationState.amount } : {})
      }));
    }
    if (locationState.token) {
      setCreateKey(locationState.token);
    }
    navigate(location.pathname, { replace: true });
  }, [location.pathname, locationState, navigate]);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const hasGroups = useMemo(() => groups.length > 0, [groups.length]);
  const hasExpenses = useMemo(() => expenses.length > 0, [expenses.length]);

  const closeAllModals = useCallback(() => {
    setIsCreateOpen(false);
    setEditingExpense(null);
    setPendingDelete(null);
    setCreatePrefill({});
  }, []);

  const handleCreate = useCallback(
    async (values: ExpenseFormValues) => {
      setIsSubmitting(true);
      try {
        const splits = deriveSplits(values);
        if (!splits.length) {
          throw new Error('Unable to calculate participant splits. Check the amount and selected members.');
        }
        await createExpense({
          groupId: values.groupId,
          description: values.description.trim(),
          amount: Number.parseFloat(values.amount),
          payerId: values.payerId,
          splits,
          expenseDate: values.expenseDate,
          notes: values.notes?.trim() ? values.notes.trim() : null
        });
        setStatus({ type: 'success', message: 'Expense recorded successfully.' });
        closeAllModals();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to save this expense right now. Please try again.';
        setStatus({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [createExpense, closeAllModals]
  );

  const handleUpdate = useCallback(
    async (values: ExpenseFormValues) => {
      if (!editingExpense) {
        return;
      }
      setIsSubmitting(true);
      try {
        const splits = deriveSplits(values);
        if (!splits.length) {
          throw new Error('Unable to calculate participant splits. Check the amount and selected members.');
        }
        await updateExpense({
          id: editingExpense.id,
          groupId: values.groupId,
          description: values.description.trim(),
          amount: Number.parseFloat(values.amount),
          payerId: values.payerId,
          splits,
          expenseDate: values.expenseDate,
          notes: values.notes?.trim() ? values.notes.trim() : null
        });
        setStatus({ type: 'success', message: 'Expense updated successfully.' });
        closeAllModals();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to update this expense right now. Please try again.';
        setStatus({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingExpense, updateExpense, closeAllModals]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteExpense(pendingDelete.id);
      setStatus({ type: 'success', message: 'Expense removed.' });
      closeAllModals();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete this expense right now. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, deleteExpense, closeAllModals]);

  const filterLabel = useMemo(() => {
    if (selectedGroupId === 'all') {
      return 'All groups';
    }
    const selectedGroup = groups.find((group) => group.id === selectedGroupId);
    return selectedGroup ? selectedGroup.name : 'Filtered group';
  }, [groups, selectedGroupId]);

  const renderedExpenses = useMemo(
    () =>
      expenses.map((expense) => {
        const participants = expense.expense_splits ?? [];
        const currency = expense.group?.currency ?? 'USD';
        const payerName = expense.payer?.full_name ?? 'Someone';
        const participantNames = participants
          .map((split) => {
            const name = split.profiles?.full_name ?? 'Member';
            const shareValue = typeof split.share === 'string' ? split.share : String(split.share ?? 0);
            return `${name} (${formatAmount(shareValue, currency)})`;
          })
          .filter(Boolean)
          .join(', ');

        return (
          <article
            key={expense.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                  {expense.group?.name ?? 'Ungrouped'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {expense.description}
                </h3>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <FiCalendar className="h-4 w-4" /> {formatDate(expense.expense_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-900/30 dark:text-indigo-200">
                <FiDollarSign className="h-4 w-4" /> {formatAmount(expense.amount, currency)}
              </div>
            </header>

            <dl className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                  <FiUser className="h-4 w-4" /> Paid by
                </dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{payerName}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                  <FiUsers className="h-4 w-4" /> Participants
                </dt>
                <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {participantNames.length ? participantNames : 'Split with group members'}
                </dd>
              </div>
              {expense.notes ? (
                <div>
                  <dt className="font-medium text-slate-500 dark:text-slate-400">Notes</dt>
                  <dd className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    {expense.notes}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(expense);
                  setStatus(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
              >
                <FiEdit2 className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(expense);
                  setStatus(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-900/30"
              >
                <FiTrash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </article>
        );
      }),
    [expenses]
  );

  const createDefaults = useMemo(() => createPrefill, [createPrefill]);

  const editingDefaults: Partial<ExpenseFormValues> | undefined = useMemo(() => {
    if (!editingExpense) {
      return undefined;
    }
    const splits = editingExpense.expense_splits ?? [];
    const participantIds = splits.map((split) => split.member_id);
    const amountNumeric = Number.parseFloat(editingExpense.amount ?? '0');
    const splitRecord = splits.reduce<Record<string, string>>((acc, split) => {
      acc[split.member_id] = typeof split.share === 'string' ? split.share : String(split.share ?? '0');
      return acc;
    }, {});

    const equalShares = participantIds.length ? computeEqualSplit(amountNumeric, participantIds) : [];
    const isEqualSplit =
      participantIds.length === equalShares.length &&
      participantIds.every((memberId, index) => {
        const shareValue = Number.parseFloat(splitRecord[memberId] ?? '0');
        return Math.abs(shareValue - (equalShares[index] ?? 0)) < 0.01;
      });

    return {
      groupId: editingExpense.group_id,
      description: editingExpense.description,
      amount: editingExpense.amount,
      payerId: editingExpense.payer_id ?? undefined,
      participantIds,
      splitMode: isEqualSplit ? 'equal' : 'custom',
      customSplits: splitRecord,
      expenseDate: editingExpense.expense_date?.slice(0, 10),
      notes: editingExpense.notes ?? ''
    };
  }, [editingExpense]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Expenses</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-300">
            Log what each person paid, keep tabs on balances, and stay transparent with your group.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!hasGroups) {
              setStatus({ type: 'error', message: 'Create a group before adding expenses.' });
              return;
            }
            setStatus(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <FiPlus className="h-4 w-4" /> New expense
        </button>
      </header>

      {status ? (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200'
          }`}
        >
          {status.type === 'success' ? '✅' : '⚠️'}
          <p>{status.message}</p>
        </div>
      ) : null}

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

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
              Viewing
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{filterLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedGroupId}
              onChange={(event) => {
                setSelectedGroupId(event.target.value);
                setStatus(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isGroupsLoading || isExpensesLoading ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <FiLoader className="h-4 w-4 animate-spin" /> Loading your data…
          </div>
        ) : null}

        {!hasGroups && !isGroupsLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/60">
              <FiUsers className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No groups yet</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Create a group first so you can log expenses against it. Head over to the Groups tab to get started.
            </p>
          </div>
        ) : null}

        {hasGroups && !hasExpenses && !isExpensesLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/60">
              <FiDollarSign className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No expenses recorded</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Track meals, utilities, travel, or anything else your group shares. Click “New expense” to begin.
            </p>
          </div>
        ) : null}

        {hasExpenses ? (
          <div className="grid gap-4 lg:grid-cols-2">{renderedExpenses}</div>
        ) : null}
      </div>

      <Modal title="Add expense" isOpen={isCreateOpen} onClose={closeAllModals}>
        <ExpenseForm
          key={createKey}
          groups={groups}
          onSubmit={handleCreate}
          defaultValues={createDefaults}
          isSubmitting={isSubmitting}
          onCancel={closeAllModals}
          submitLabel="Save expense"
        />
      </Modal>

      <Modal title="Edit expense" isOpen={Boolean(editingExpense)} onClose={closeAllModals}>
        {editingExpense ? (
          <ExpenseForm
            key={editingExpense.id}
            groups={groups}
            defaultValues={editingDefaults}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            onCancel={closeAllModals}
            submitLabel="Update expense"
          />
        ) : null}
      </Modal>

      <Modal title="Delete expense" isOpen={Boolean(pendingDelete)} onClose={closeAllModals}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDelete?.description}</span> and
            its splits. This action cannot be undone.
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAllModals}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              {isDeleting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />} Delete
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ExpensesPage;
