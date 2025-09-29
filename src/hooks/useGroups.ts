import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateGroupInput,
  GroupWithMembers,
  deleteGroup as deleteGroupService,
  createGroup as createGroupService,
  fetchGroups,
  updateGroup as updateGroupService
} from '../services/groups';

interface UseGroupsState {
  groups: GroupWithMembers[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createGroup: (payload: CreateGroupInput) => Promise<GroupWithMembers>;
  updateGroup: (id: string, payload: Omit<CreateGroupInput, 'currency'> & { currency?: string }) => Promise<GroupWithMembers>;
  deleteGroup: (id: string) => Promise<void>;
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

  return useMemo(
    () => ({
      groups,
      isLoading,
      error,
      refresh,
      createGroup: handleCreate,
      updateGroup: handleUpdate,
      deleteGroup: handleDelete
    }),
    [groups, isLoading, error, refresh, handleCreate, handleUpdate, handleDelete]
  );
};
