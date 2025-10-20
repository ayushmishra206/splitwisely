import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';
import { fetchGroupIdsForUser, getCurrentUserId } from './groups';

export type ExpenseRecord = Tables<'expenses'>;
export type ExpenseSplitRecord = Tables<'expense_splits'> & {
  profiles?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'avatar_url'>;
};

export interface ExpenseWithRelations extends ExpenseRecord {
  group: Pick<Tables<'groups'>, 'id' | 'name' | 'currency'> | null;
  payer: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'avatar_url'> | null;
  expense_splits: ExpenseSplitRecord[];
}

const expenseSelect = `
  *,
  group:groups (id, name, currency),
  payer:profiles!expenses_payer_id_fkey (id, full_name, avatar_url),
  expense_splits (
    id,
    member_id,
    share,
    profiles:profiles!expense_splits_member_id_fkey (id, full_name, avatar_url)
  )
`;

const formatCurrency = (value: number) => value.toFixed(2);

export const computeEqualSplit = (amount: number, participantIds: string[]): number[] => {
  const participantCount = Math.max(participantIds.length, 1);
  const totalCents = Math.round(amount * 100);
  const baseShare = Math.floor(totalCents / participantCount);
  const remainder = totalCents - baseShare * participantCount;

  return participantIds.map((_, index) => {
    const shareCents = baseShare + (index < remainder ? 1 : 0);
    return shareCents / 100;
  });
};

export interface ExpenseFilters {
  groupId?: string;
}

export const fetchExpenses = async (filters: ExpenseFilters = {}): Promise<ExpenseWithRelations[]> => {
  const userId = await getCurrentUserId();
  const accessibleGroupIds = await fetchGroupIdsForUser(userId);

  if (!accessibleGroupIds.length) {
    return [];
  }

  const targetGroupIds = filters.groupId
    ? accessibleGroupIds.includes(filters.groupId)
      ? [filters.groupId]
      : []
    : accessibleGroupIds;

  if (!targetGroupIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(expenseSelect)
    .in('group_id', targetGroupIds)
    .order('expense_date', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ExpenseWithRelations[];
  return rows.filter((expense) => {
    const isPayer = expense.payer_id === userId;
    const isParticipant = (expense.expense_splits ?? []).some((split) => split.member_id === userId);
    return isPayer || isParticipant;
  });
};

export interface SplitShareInput {
  memberId: string;
  share: number;
}

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  expenseDate: string;
  splits: SplitShareInput[];
  notes?: string | null;
}

export const createExpense = async (input: CreateExpenseInput): Promise<ExpenseWithRelations> => {
  if (!input.splits.length) {
    throw new Error('Provide at least one split participant');
  }
  const totalSplit = input.splits.reduce((sum, split) => sum + split.share, 0);
  if (Math.abs(totalSplit - input.amount) > 0.01) {
    throw new Error('Split shares must add up to the total amount');
  }
  const payload: TablesInsert<'expenses'> = {
    group_id: input.groupId,
    description: input.description,
    amount: formatCurrency(input.amount),
    payer_id: input.payerId,
    expense_date: input.expenseDate,
    notes: input.notes ?? null
  };

  const { data, error } = await supabase.from('expenses').insert(payload).select(expenseSelect).single();

  if (error) {
    throw error;
  }

  const inserted = data as ExpenseWithRelations;
  const splitRows: TablesInsert<'expense_splits'>[] = input.splits.map((split) => ({
    expense_id: inserted.id,
    member_id: split.memberId,
    share: formatCurrency(split.share)
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitRows);

  if (splitsError) {
    throw splitsError;
  }

  const { data: hydrated, error: hydrateError } = await supabase
    .from('expenses')
    .select(expenseSelect)
    .eq('id', inserted.id)
    .single();

  if (hydrateError) {
    throw hydrateError;
  }

  return hydrated as ExpenseWithRelations;
};

export interface UpdateExpenseInput {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  expenseDate: string;
  splits: SplitShareInput[];
  notes?: string | null;
}

export const updateExpense = async (input: UpdateExpenseInput): Promise<ExpenseWithRelations> => {
  if (!input.splits.length) {
    throw new Error('Provide at least one split participant');
  }
  const totalSplit = input.splits.reduce((sum, split) => sum + split.share, 0);
  if (Math.abs(totalSplit - input.amount) > 0.01) {
    throw new Error('Split shares must add up to the total amount');
  }
  const payload: TablesUpdate<'expenses'> = {
    group_id: input.groupId,
    description: input.description,
    amount: formatCurrency(input.amount),
    payer_id: input.payerId,
    expense_date: input.expenseDate,
    notes: input.notes ?? null
  };

  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', input.id)
    .select(expenseSelect)
    .single();

  if (error) {
    throw error;
  }

  const { error: deleteError } = await supabase.from('expense_splits').delete().eq('expense_id', input.id);

  if (deleteError) {
    throw deleteError;
  }

  const splitRows: TablesInsert<'expense_splits'>[] = input.splits.map((split) => ({
    expense_id: input.id,
    member_id: split.memberId,
    share: formatCurrency(split.share)
  }));

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitRows);

  if (splitsError) {
    throw splitsError;
  }

  const { data: hydrated, error: hydrateError } = await supabase
    .from('expenses')
    .select(expenseSelect)
    .eq('id', input.id)
    .single();

  if (hydrateError) {
    throw hydrateError;
  }

  return hydrated as ExpenseWithRelations;
};

export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) {
    throw error;
  }
};
