import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiEdit2,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiUserMinus,
  FiUserPlus,
  FiUsers
} from 'react-icons/fi';
import { GroupForm, GroupFormValues } from '../components/groups/GroupForm';
import { useGroups } from '../hooks/useGroups';
import type { GroupWithMembers, ProfileSummary } from '../services/groups';
import { searchProfiles } from '../services/groups';
import { useSupabase } from '../providers/SupabaseProvider';

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

const GroupsPage = () => {
  const { user } = useSupabase();
  const { groups, isLoading, error, createGroup, updateGroup, deleteGroup, addMember, removeMember } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithMembers | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GroupWithMembers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createSelectedMembers, setCreateSelectedMembers] = useState<ProfileSummary[]>([]);
  const [createSearchTerm, setCreateSearchTerm] = useState('');
  const [createSuggestions, setCreateSuggestions] = useState<ProfileSummary[]>([]);
  const [isCreateSearching, setIsCreateSearching] = useState(false);
  const [createMemberError, setCreateMemberError] = useState<string | null>(null);
  const [memberManagerGroupId, setMemberManagerGroupId] = useState<string | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<ProfileSummary[]>([]);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);

  const activeMembersGroup = useMemo(
    () => groups.find((group) => group.id === memberManagerGroupId) ?? null,
    [groups, memberManagerGroupId]
  );

  const activeMemberIds = useMemo(() => {
    return new Set(activeMembersGroup?.group_members?.map((member) => member.member_id) ?? []);
  }, [activeMembersGroup]);

  const createSelectedIds = useMemo(
    () => new Set(createSelectedMembers.map((profile) => profile.id)),
    [createSelectedMembers]
  );

  useEffect(() => {
    if (!isCreateOpen) {
      setCreateSuggestions([]);
      setIsCreateSearching(false);
      setCreateMemberError(null);
      return;
    }

    const trimmed = createSearchTerm.trim();

    if (trimmed.length < 2) {
      setCreateSuggestions([]);
      setIsCreateSearching(false);
      return;
    }

    let isActive = true;
    setIsCreateSearching(true);
    setCreateMemberError(null);

    void (async () => {
      try {
        const results = await searchProfiles(trimmed, 12);
        if (!isActive) {
          return;
        }

        const filtered = results.filter((profile) => {
          if (profile.id === user?.id) {
            return false;
          }
          return !createSelectedIds.has(profile.id);
        });

        setCreateSuggestions(filtered);
      } catch (searchError) {
        if (!isActive) {
          return;
        }
        const message =
          searchError instanceof Error
            ? searchError.message
            : 'We were unable to look up profiles right now. Please try again later.';
        setCreateMemberError(message);
      } finally {
        if (isActive) {
          setIsCreateSearching(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [createSearchTerm, createSelectedIds, isCreateOpen, user?.id]);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!memberManagerGroupId) {
      setMemberSearchTerm('');
      setMemberSearchResults([]);
      setMemberError(null);
      setIsSearchingProfiles(false);
      return;
    }

    const trimmed = memberSearchTerm.trim();

    if (trimmed.length < 2) {
      setMemberSearchResults([]);
      setIsSearchingProfiles(false);
      return;
    }

    let isActive = true;
    setIsSearchingProfiles(true);
    setMemberError(null);

    void (async () => {
      try {
        const results = await searchProfiles(trimmed, 12);
        if (!isActive) {
          return;
        }
        setMemberSearchResults(results.filter((profile) => !activeMemberIds.has(profile.id)));
      } catch (searchError) {
        if (!isActive) {
          return;
        }
        const message =
          searchError instanceof Error
            ? searchError.message
            : 'We were unable to look up profiles right now. Please try again later.';
        setMemberError(message);
      } finally {
        if (isActive) {
          setIsSearchingProfiles(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [activeMemberIds, memberManagerGroupId, memberSearchTerm]);

  const closeAllModals = useCallback(() => {
  setIsCreateOpen(false);
  setCreateSelectedMembers([]);
  setCreateSearchTerm('');
  setCreateSuggestions([]);
  setCreateMemberError(null);
  setIsCreateSearching(false);
    setEditingGroup(null);
    setPendingDelete(null);
    setMemberManagerGroupId(null);
    setMemberSearchTerm('');
    setMemberSearchResults([]);
    setMemberError(null);
    setPendingMemberId(null);
    setPendingRemovalId(null);
    setIsSearchingProfiles(false);
  }, []);

  const handleCreate = useCallback(
    async (values: GroupFormValues) => {
      setIsSubmitting(true);
      try {
        await createGroup({
          name: values.name.trim(),
          description: values.description?.trim() ? values.description.trim() : null,
          currency: values.currency,
          memberIds: createSelectedMembers.map((profile) => profile.id)
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
    [createGroup, closeAllModals, createSelectedMembers]
  );

  const handleAddMemberDuringCreate = useCallback((profile: ProfileSummary) => {
    setCreateSelectedMembers((previous) => {
      if (previous.some((existing) => existing.id === profile.id)) {
        return previous;
      }
      return [...previous, profile];
    });
    setCreateSearchTerm('');
    setCreateSuggestions([]);
  }, []);

  const handleRemoveMemberDuringCreate = useCallback((profileId: string) => {
    setCreateSelectedMembers((previous) => previous.filter((profile) => profile.id !== profileId));
  }, []);

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

  const handleOpenMemberManager = useCallback((groupId: string) => {
    setStatus(null);
    setMemberManagerGroupId(groupId);
    setMemberSearchTerm('');
    setMemberSearchResults([]);
    setMemberError(null);
  }, []);

  const handleAddMemberToGroup = useCallback(
    async (profileId: string) => {
      if (!memberManagerGroupId) {
        return;
      }
      setPendingMemberId(profileId);
      setMemberError(null);
      try {
        await addMember(memberManagerGroupId, profileId);
        setStatus({ type: 'success', message: 'Member added to group.' });
        setMemberSearchTerm('');
        setMemberSearchResults([]);
      } catch (errorToHandle) {
        const message =
          errorToHandle instanceof Error
            ? errorToHandle.message
            : 'Unable to add that member right now. Please try again later.';
        setMemberError(message);
      } finally {
        setPendingMemberId(null);
      }
    },
    [addMember, memberManagerGroupId]
  );

  const handleRemoveMemberFromGroup = useCallback(
    async (memberId: string) => {
      if (!memberManagerGroupId) {
        return;
      }
      setPendingRemovalId(memberId);
      setMemberError(null);
      try {
        await removeMember(memberManagerGroupId, memberId);
        setStatus({ type: 'success', message: 'Member removed from group.' });
      } catch (errorToHandle) {
        const message =
          errorToHandle instanceof Error
            ? errorToHandle.message
            : 'Unable to remove that member right now. Please try again later.';
        setMemberError(message);
      } finally {
        setPendingRemovalId(null);
      }
    },
    [memberManagerGroupId, removeMember]
  );

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
          className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 md:inline-flex"
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
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg sm:p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <header className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{group.name}</h3>
                      {group.description ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{group.description}</p>
                      ) : null}
                    </div>
                    <span className="inline-flex w-max rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {group.currency}
                    </span>
                  </div>
                </header>

                <dl className="mt-5 grid gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                      <FiUsers className="h-4 w-4" /> Members
                    </dt>
                    <dd className="text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-right">{memberCount}</dd>
                  </div>
                  {ownerProfile ? (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <dt className="font-medium text-slate-500 dark:text-slate-400">Owner</dt>
                      <dd className="truncate text-slate-700 dark:text-slate-200 sm:text-right">
                        {ownerProfile.full_name ?? 'You'}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="text-slate-700 dark:text-slate-200 sm:text-right">
                      {new Date(group.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenMemberManager(group.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  >
                    <FiUserPlus className="h-4 w-4" /> Members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(group);
                      setStatus(null);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  >
                    <FiEdit2 className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(group);
                      setStatus(null);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 sm:w-auto dark:text-rose-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-900/30"
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
        <GroupForm
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          submitLabel="Create group"
          additionalContent={
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Invite members (optional)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You&apos;re added automatically as the owner. Search for teammates now or invite them later.
                </p>
                {createSelectedMembers.length ? (
                  <ul className="space-y-2">
                    {createSelectedMembers.map((profile) => (
                      <li
                        key={profile.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {profile.full_name ?? 'Unnamed profile'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">ID: {profile.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberDuringCreate(profile.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-300 dark:hover:border-rose-600 dark:hover:bg-rose-900/40"
                        >
                          <FiUserMinus className="h-4 w-4" />
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No extra members selected yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="create-member-search">
                  Search profiles
                </label>
                <input
                  id="create-member-search"
                  type="text"
                  value={createSearchTerm}
                  onChange={(event) => setCreateSearchTerm(event.target.value)}
                  placeholder="Start typing a name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {createSearchTerm.trim().length > 0 && createSearchTerm.trim().length < 2 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Type at least two characters to search.</p>
                ) : null}
                {isCreateSearching ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <FiLoader className="h-4 w-4 animate-spin" /> Searching profiles…
                  </div>
                ) : null}
                {createSuggestions.length ? (
                  <ul className="space-y-2">
                    {createSuggestions.map((profile) => (
                      <li
                        key={profile.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {profile.full_name ?? 'Unnamed profile'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">ID: {profile.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMemberDuringCreate(profile)}
                          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/40"
                        >
                          <FiUserPlus className="h-4 w-4" />
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : createSearchTerm.trim().length >= 2 && !isCreateSearching ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No profiles matched your search.</p>
                ) : null}
                {createMemberError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
                    {createMemberError}
                  </div>
                ) : null}
              </div>
            </div>
          }
        />
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

      <Modal
        title={activeMembersGroup ? `Manage members · ${activeMembersGroup.name}` : 'Manage members'}
        isOpen={Boolean(memberManagerGroupId)}
        onClose={closeAllModals}
      >
        {activeMembersGroup ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Current members
                </h3>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {activeMembersGroup.group_members?.length ?? 0}
                </span>
              </div>
              {activeMembersGroup.group_members?.length ? (
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {activeMembersGroup.group_members
                    .slice()
                    .sort((a, b) => {
                      const nameA = (a.profiles?.full_name ?? '').toLowerCase();
                      const nameB = (b.profiles?.full_name ?? '').toLowerCase();
                      if (nameA && nameB) {
                        return nameA.localeCompare(nameB);
                      }
                      if (nameA) {
                        return -1;
                      }
                      if (nameB) {
                        return 1;
                      }
                      return a.member_id.localeCompare(b.member_id);
                    })
                    .map((member) => {
                      const name = member.profiles?.full_name ?? 'Unknown member';
                      const isOwner = member.role === 'owner' || member.member_id === activeMembersGroup.owner_id;
                      const isSelf = member.member_id === user?.id;
                      const canRemove = !isOwner && !isSelf;
                      return (
                        <li key={`${member.member_id}-${member.role}`} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isOwner ? 'Owner' : 'Member'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromGroup(member.member_id)}
                            disabled={!canRemove || pendingRemovalId === member.member_id}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-rose-800/60 dark:text-rose-300 dark:hover:border-rose-600 dark:hover:bg-rose-900/40 disabled:dark:border-slate-700 disabled:dark:text-slate-500"
                          >
                            {pendingRemovalId === member.member_id ? (
                              <FiLoader className="h-4 w-4 animate-spin" />
                            ) : (
                              <FiUserMinus className="h-4 w-4" />
                            )}
                            Remove
                          </button>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                  No members yet. Add someone using the search below.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Add people
              </h3>
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(event) => setMemberSearchTerm(event.target.value)}
                placeholder="Search by name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {memberSearchTerm.trim().length > 0 && memberSearchTerm.trim().length < 2 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Type at least two characters to search.</p>
              ) : null}
              {isSearchingProfiles ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <FiLoader className="h-4 w-4 animate-spin" /> Searching profiles…
                </div>
              ) : null}
              {memberSearchResults.length ? (
                <ul className="space-y-2">
                  {memberSearchResults.map((profile) => (
                    <li
                      key={profile.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {profile.full_name ?? 'Unnamed profile'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {profile.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMemberToGroup(profile.id)}
                        disabled={pendingMemberId === profile.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-indigo-900/60 dark:text-indigo-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/40"
                      >
                        {pendingMemberId === profile.id ? (
                          <FiLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          <FiUserPlus className="h-4 w-4" />
                        )}
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              ) : memberSearchTerm.trim().length >= 2 && !isSearchingProfiles ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No profiles matched your search.</p>
              ) : null}
              {memberError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
                  {memberError}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <button
        type="button"
        onClick={() => {
          setStatus(null);
          setIsCreateOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 md:hidden"
        aria-label="Create group"
      >
        <FiPlus className="h-6 w-6" />
      </button>
    </section>
  );
};

export default GroupsPage;
