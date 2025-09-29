import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreateExpenseInput,
  ExpenseFilters,
  ExpenseWithRelations,
  UpdateExpenseInput,
  createExpense as createExpenseService,
  deleteExpense as deleteExpenseService,
  fetchExpenses,
  updateExpense as updateExpenseService
} from '../services/expenses';

interface UseExpensesState {
  expenses: ExpenseWithRelations[];
  isLoading: boolean;
  error: Error | null;
  refresh: (filters?: ExpenseFilters) => Promise<void>;
  createExpense: (payload: CreateExpenseInput) => Promise<ExpenseWithRelations>;
  updateExpense: (payload: UpdateExpenseInput) => Promise<ExpenseWithRelations>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenses = (initialFilters: ExpenseFilters = {}): UseExpensesState => {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilters, setActiveFilters] = useState<ExpenseFilters>(initialFilters);
  const filtersRef = useRef<ExpenseFilters>(initialFilters);

  const refresh = useCallback(async (filters?: ExpenseFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const nextFilters = filters ?? filtersRef.current;
      filtersRef.current = nextFilters;
      setActiveFilters(nextFilters);
      const data = await fetchExpenses(nextFilters);
      setExpenses(data);
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to load expenses');
      setError(errorInstance);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initialGroupId = initialFilters.groupId ?? null;

  useEffect(() => {
    filtersRef.current = initialFilters;
    setActiveFilters(initialFilters);
    void refresh(initialFilters);
  }, [refresh, initialGroupId]);

  const handleCreate = useCallback(async (payload: CreateExpenseInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await createExpenseService(payload);
      await refresh();
      return created;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to create expense');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleUpdate = useCallback(async (payload: UpdateExpenseInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await updateExpenseService(payload);
      await refresh();
      return updated;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to update expense');
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
      await deleteExpenseService(id);
      await refresh();
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to delete expense');
      setError(errorInstance);
      throw errorInstance;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  return useMemo(
    () => ({
      expenses,
      isLoading,
      error,
      refresh,
      createExpense: handleCreate,
      updateExpense: handleUpdate,
      deleteExpense: handleDelete
    }),
    [expenses, isLoading, error, refresh, handleCreate, handleUpdate, handleDelete]
  );
};
