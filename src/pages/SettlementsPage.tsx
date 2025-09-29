import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCalendar,
  FiDollarSign,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiUsers
} from 'react-icons/fi';
import { useGroups } from '../hooks/useGroups';
import { useSettlements } from '../hooks/useSettlements';
import { SettlementForm, type SettlementFormValues } from '../components/settlements/SettlementForm';
import type { SettlementWithRelations } from '../services/settlements';

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
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
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

const formatAmount = (amount: string | number, currency = 'USD') => {
  const numeric = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number.isFinite(numeric) ? numeric : 0);
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch (error) {
    return iso;
  }
};

const SettlementsPage = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SettlementWithRelations | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { groups, isLoading: isGroupsLoading, error: groupsError } = useGroups();
  const {
    settlements,
    isLoading: isSettlementsLoading,
    error: settlementsError,
    createSettlement,
    deleteSettlement
  } = useSettlements(selectedGroupId === 'all' ? {} : { groupId: selectedGroupId });

  const hasGroups = useMemo(() => groups.length > 0, [groups.length]);
  const hasSettlements = useMemo(() => settlements.length > 0, [settlements.length]);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const closeModals = useCallback(() => {
    setIsCreateOpen(false);
    setPendingDelete(null);
  }, []);

  const handleCreate = useCallback(
    async (values: SettlementFormValues) => {
      setIsSubmitting(true);
      try {
        await createSettlement({
          groupId: values.groupId,
          fromMemberId: values.fromMemberId,
          toMemberId: values.toMemberId,
          amount: Number.parseFloat(values.amount),
          settlementDate: values.settlementDate,
          notes: values.notes?.trim() ? values.notes.trim() : null
        });
        setStatus({ type: 'success', message: 'Settlement recorded successfully.' });
        closeModals();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to record that settlement right now. Please try again.';
        setStatus({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSettlement, closeModals]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSettlement(pendingDelete.id);
      setStatus({ type: 'success', message: 'Settlement removed.' });
      closeModals();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete that settlement right now. Please try again later.';
      setStatus({ type: 'error', message });
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, deleteSettlement, closeModals]);

  const renderedSettlements = useMemo(
    () =>
      settlements.map((settlement) => {
        const groupName = settlement.group?.name ?? 'Group';
        const currency = settlement.group?.currency ?? 'USD';
        const fromName = settlement.from_profile?.full_name ?? 'Member';
        const toName = settlement.to_profile?.full_name ?? 'Member';

        return (
          <article
            key={settlement.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">{groupName}</p>
                <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <FiUsers className="h-4 w-4" /> {fromName}
                  <FiArrowRight className="h-4 w-4" />
                  {toName}
                </h3>
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <FiCalendar className="h-4 w-4" /> {formatDate(settlement.settlement_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-900/30 dark:text-indigo-200">
                <FiDollarSign className="h-4 w-4" /> {formatAmount(settlement.amount, currency)}
              </div>
            </header>

            {settlement.notes ? (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                {settlement.notes}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(settlement);
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
    [settlements]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settlements</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-300">
            Record repayments to keep balances accurate and see who&apos;s square with the group.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setIsCreateOpen(true);
              setStatus(null);
            }}
            disabled={!hasGroups}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400/60"
          >
            <FiPlus className="h-4 w-4" /> New settlement
          </button>
        </div>
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

      {settlementsError ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
          <FiAlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">We couldn&apos;t load settlements.</p>
            <p>{settlementsError.message}</p>
          </div>
        </div>
      ) : null}

      {!hasGroups && !isGroupsLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No groups yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Create a group first, then you can log repayments between members here.
          </p>
        </div>
      ) : null}

      {isSettlementsLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <FiLoader className="h-4 w-4 animate-spin" /> Loading settlements…
        </div>
      ) : null}

      {hasSettlements ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{renderedSettlements}</div>
      ) : !isSettlementsLoading && hasGroups ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No settlements yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            When someone pays back a share, record it here to keep balances accurate.
          </p>
        </div>
      ) : null}

      <Modal title="Record a settlement" isOpen={isCreateOpen} onClose={closeModals}>
        <SettlementForm
          groups={groups}
          onSubmit={handleCreate}
          onCancel={closeModals}
          isSubmitting={isSubmitting}
          submitLabel="Save settlement"
        />
      </Modal>

      <Modal title="Delete settlement" isOpen={Boolean(pendingDelete)} onClose={closeModals}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will remove the settlement between{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {pendingDelete?.from_profile?.full_name ?? 'Member'}
            </span>{' '}
            and{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {pendingDelete?.to_profile?.full_name ?? 'Member'}
            </span>{' '}
            for {formatAmount(pendingDelete?.amount ?? '0', pendingDelete?.group?.currency ?? 'USD')}. This action cannot be
            undone.
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModals}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
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

export default SettlementsPage;
