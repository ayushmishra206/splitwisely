import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateGroupInput,
  GroupWithMembers,
  GroupMemberRecord,
  deleteGroup as deleteGroupService,
  createGroup as createGroupService,
  fetchGroups,
  updateGroup as updateGroupService,
  addGroupMember as addGroupMemberService,
  removeGroupMember as removeGroupMemberService
} from '../services/groups';

interface UseGroupsState {
  groups: GroupWithMembers[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createGroup: (payload: CreateGroupInput) => Promise<GroupWithMembers>;
  updateGroup: (id: string, payload: Omit<CreateGroupInput, 'currency'> & { currency?: string }) => Promise<GroupWithMembers>;
  deleteGroup: (id: string) => Promise<void>;
  addMember: (groupId: string, memberId: string, role?: GroupMemberRecord['role']) => Promise<GroupMemberRecord>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
}

export const useGroups = (): UseGroupsState => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchGroups();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load groups'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(async (payload: CreateGroupInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await createGroupService(payload);
      await refresh();
      return created;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to create group');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleUpdate = useCallback(
    async (id: string, payload: Omit<CreateGroupInput, 'currency'> & { currency?: string }) => {
      try {
        setIsLoading(true);
        setError(null);
        const updated = await updateGroupService({ id, ...payload });
        await refresh();
        return updated;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to update group');
        setError(errorInstance);
        throw errorInstance;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteGroupService(id);
      await refresh();
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to delete group');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleAddMember = useCallback(
    async (groupId: string, memberId: string, role: GroupMemberRecord['role'] = 'member') => {
      try {
        setError(null);
        const newMember = await addGroupMemberService(groupId, memberId, role);
        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  group_members: [...(group.group_members ?? []).filter((member) => member.member_id !== newMember.member_id), newMember]
                }
              : group
          )
        );
        return newMember;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error('Failed to add member');
        setError(errorInstance);
        throw errorInstance;
      }
    },
    []
  );

  const handleRemoveMember = useCallback(async (groupId: string, memberId: string) => {
    try {
      setError(null);
      await removeGroupMemberService(groupId, memberId);
      setGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                group_members: (group.group_members ?? []).filter((member) => member.member_id !== memberId)
              }
            : group
        )
      );
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to remove member');
      setError(errorInstance);
      throw errorInstance;
    }
  }, []);

  return useMemo(
    () => ({
      groups,
      isLoading,
      error,
      refresh,
      createGroup: handleCreate,
      updateGroup: handleUpdate,
      deleteGroup: handleDelete,
      addMember: handleAddMember,
      removeMember: handleRemoveMember
    }),
    [groups, isLoading, error, refresh, handleCreate, handleUpdate, handleDelete, handleAddMember, handleRemoveMember]
  );
};
