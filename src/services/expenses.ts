import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

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

const computeEqualSplit = (amount: number, participantIds: string[]): string[] => {
  const participantCount = Math.max(participantIds.length, 1);
  const totalCents = Math.round(amount * 100);
  const baseShare = Math.floor(totalCents / participantCount);
  const remainder = totalCents - baseShare * participantCount;

  return participantIds.map((_, index) => {
    const shareCents = baseShare + (index < remainder ? 1 : 0);
    return (shareCents / 100).toFixed(2);
  });
};

export interface ExpenseFilters {
  groupId?: string;
}

export const fetchExpenses = async (filters: ExpenseFilters = {}): Promise<ExpenseWithRelations[]> => {
  let query = supabase.from('expenses').select(expenseSelect).order('expense_date', { ascending: false });

  if (filters.groupId) {
    query = query.eq('group_id', filters.groupId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ExpenseWithRelations[];
};

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  expenseDate: string;
  notes?: string | null;
}

export const createExpense = async (input: CreateExpenseInput): Promise<ExpenseWithRelations> => {
  if (!input.participantIds.length) {
    throw new Error('Select at least one participant');
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
  const splits = computeEqualSplit(input.amount, input.participantIds);

  const splitRows: TablesInsert<'expense_splits'>[] = input.participantIds.map((memberId, index) => ({
    expense_id: inserted.id,
    member_id: memberId,
    share: splits[index]
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
  participantIds: string[];
  expenseDate: string;
  notes?: string | null;
}

export const updateExpense = async (input: UpdateExpenseInput): Promise<ExpenseWithRelations> => {
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

  const splits = computeEqualSplit(input.amount, input.participantIds);
  const splitRows: TablesInsert<'expense_splits'>[] = input.participantIds.map((memberId, index) => ({
    expense_id: input.id,
    member_id: memberId,
    share: splits[index]
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
