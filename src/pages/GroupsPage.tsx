import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiEdit2,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiUsers
} from 'react-icons/fi';
import { GroupForm, GroupFormValues } from '../components/groups/GroupForm';
import { useGroups } from '../hooks/useGroups';
import type { GroupWithMembers } from '../services/groups';

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
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
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
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

const GroupsPage = () => {
  const { groups, isLoading, error, createGroup, updateGroup, deleteGroup } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithMembers | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GroupWithMembers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const closeAllModals = useCallback(() => {
    setIsCreateOpen(false);
    setEditingGroup(null);
    setPendingDelete(null);
  }, []);

  const handleCreate = useCallback(
    async (values: GroupFormValues) => {
      setIsSubmitting(true);
      try {
        await createGroup({
          name: values.name.trim(),
          description: values.description?.trim() ? values.description.trim() : null,
          currency: values.currency
        });
        setStatus({ type: 'success', message: 'Group created successfully.' });
        closeAllModals();
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : 'Unable to create group. Please try again.';
        setStatus({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [createGroup, closeAllModals]
  );

  const handleUpdate = useCallback(
    async (values: GroupFormValues) => {
      if (!editingGroup) {
        return;
      }
      setIsSubmitting(true);
      try {
        await updateGroup(editingGroup.id, {
          name: values.name.trim(),
          description: values.description?.trim() ? values.description.trim() : null,
          currency: values.currency
        });
        setStatus({ type: 'success', message: 'Group updated successfully.' });
        closeAllModals();
      } catch (updateError) {
        const message =
          updateError instanceof Error ? updateError.message : 'Unable to update group. Please try again.';
        setStatus({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingGroup, updateGroup, closeAllModals]
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteGroup(pendingDelete.id);
      setStatus({ type: 'success', message: 'Group removed.' });
      closeAllModals();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Unable to delete group right now.';
      setStatus({ type: 'error', message });
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, deleteGroup, closeAllModals]);

  const hasGroups = useMemo(() => groups.length > 0, [groups.length]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Groups</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-300">
            Create shared wallets for trips, roommates, or recurring expenses. Invite teammates and keep balances
            synced with Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <FiPlus className="h-4 w-4" />
          New group
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

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
          <FiAlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">We couldn&apos;t load your groups.</p>
            <p>{error.message}</p>
          </div>
        </div>
      ) : null}

      {!hasGroups && !isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/60">
            <FiUsers className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No groups yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Start by creating your first group. You can always come back to add members and track new expenses.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-900/40 dark:text-indigo-200"
            >
              <FiPlus className="h-4 w-4" />
              Create your first group
            </button>
          </div>
        </div>
      ) : null}

      {hasGroups ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const memberCount = group.group_members?.length ?? 0;
            const ownerProfile = group.group_members?.find((member) => member.role === 'owner')?.profiles;

            return (
              <article
                key={group.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <header className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{group.name}</h3>
                      {group.description ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{group.description}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {group.currency}
                    </span>
                  </div>
                </header>

                <dl className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                      <FiUsers className="h-4 w-4" /> Members
                    </dt>
                    <dd>{memberCount}</dd>
                  </div>
                  {ownerProfile ? (
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-500 dark:text-slate-400">Owner</dt>
                      <dd className="truncate text-right text-slate-700 dark:text-slate-200">
                        {ownerProfile.full_name ?? 'You'}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Created</dt>
                    <dd>{new Date(group.created_at).toLocaleDateString()}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(group);
                      setStatus(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  >
                    <FiEdit2 className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(group);
                      setStatus(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-900/30"
                  >
                    <FiTrash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {isLoading && groups.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <FiLoader className="h-4 w-4 animate-spin" /> Loading groups…
        </div>
      ) : null}

      <Modal title="Create a new group" isOpen={isCreateOpen} onClose={closeAllModals}>
        <GroupForm onSubmit={handleCreate} isSubmitting={isSubmitting} submitLabel="Create group" />
      </Modal>

      <Modal title="Edit group" isOpen={Boolean(editingGroup)} onClose={closeAllModals}>
        {editingGroup ? (
          <GroupForm
            defaultValues={{
              name: editingGroup.name,
              description: editingGroup.description ?? '',
              currency: editingGroup.currency ?? 'USD'
            }}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            submitLabel="Save changes"
            onCancel={closeAllModals}
          />
        ) : null}
      </Modal>

      <Modal title="Delete group" isOpen={Boolean(pendingDelete)} onClose={closeAllModals}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDelete?.name}</span> and all
            associated expenses and settlements. This action cannot be undone.
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

export default GroupsPage;
