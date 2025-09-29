import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreateSettlementInput,
  SettlementFilters,
  SettlementWithRelations,
  UpdateSettlementInput,
  createSettlement as createSettlementService,
  deleteSettlement as deleteSettlementService,
  fetchSettlements,
  updateSettlement as updateSettlementService
} from '../services/settlements';

interface UseSettlementsState {
  settlements: SettlementWithRelations[];
  isLoading: boolean;
  error: Error | null;
  refresh: (filters?: SettlementFilters) => Promise<void>;
  createSettlement: (payload: CreateSettlementInput) => Promise<SettlementWithRelations>;
  updateSettlement: (payload: UpdateSettlementInput) => Promise<SettlementWithRelations>;
  deleteSettlement: (id: string) => Promise<void>;
}

export const useSettlements = (initialFilters: SettlementFilters = {}): UseSettlementsState => {
  const [settlements, setSettlements] = useState<SettlementWithRelations[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const filtersRef = useRef<SettlementFilters>(initialFilters);

  const refresh = useCallback(async (filters?: SettlementFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const nextFilters = filters ?? filtersRef.current;
      filtersRef.current = nextFilters;
      const data = await fetchSettlements(nextFilters);
      setSettlements(data);
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to load settlements');
      setError(errorInstance);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    filtersRef.current = initialFilters;
    void refresh(initialFilters);
  }, [refresh, initialFilters.groupId, initialFilters.limit]);

  const handleCreate = useCallback(async (payload: CreateSettlementInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await createSettlementService(payload);
      await refresh();
      return created;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to record settlement');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleUpdate = useCallback(async (payload: UpdateSettlementInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await updateSettlementService(payload);
      await refresh();
      return updated;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to update settlement');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteSettlementService(id);
      await refresh();
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to delete settlement');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  return useMemo(
    () => ({
      settlements,
      isLoading,
      error,
      refresh,
      createSettlement: handleCreate,
      updateSettlement: handleUpdate,
      deleteSettlement: handleDelete
    }),
    [settlements, isLoading, error, refresh, handleCreate, handleUpdate, handleDelete]
  );
};
