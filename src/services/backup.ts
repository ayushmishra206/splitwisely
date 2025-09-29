import { supabase } from '../lib/supabaseClient';
import type { Tables } from '../lib/database.types';

export interface ExportedExpense extends Tables<'expenses'> {
  expense_splits: Tables<'expense_splits'>[];
}

export interface ExportedGroup extends Tables<'groups'> {
  group_members: Tables<'group_members'>[];
  expenses: ExportedExpense[];
  settlements: Tables<'settlements'>[];
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  groups: ExportedGroup[];
}

export interface ImportResult {
  imported: number;
  skipped: { groupId: string; name: string; reason: string }[];
  errors: string[];
}

const BACKUP_VERSION = 1;

export const exportUserData = async (): Promise<BackupPayload> => {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to export data.');
  }

  const { data, error } = await supabase
    .from('groups')
    .select(
      `id, owner_id, name, description, currency, created_at, updated_at,
        group_members:group_members (group_id, member_id, role, joined_at),
        expenses:expenses (
          id, group_id, payer_id, description, amount, expense_date, notes, created_at, updated_at,
          expense_splits:expense_splits (id, expense_id, member_id, share)
        ),
        settlements:settlements (id, group_id, from_member, to_member, amount, settlement_date, notes, created_at)
      `
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const groups: ExportedGroup[] = (data ?? []).map((group) => ({
    ...group,
    group_members: (group.group_members ?? []) as Tables<'group_members'>[],
    expenses: (group.expenses ?? []).map((expense) => ({
      ...(expense as Tables<'expenses'>),
      expense_splits: ((expense as ExportedExpense).expense_splits ?? []) as Tables<'expense_splits'>[]
    })),
    settlements: (group.settlements ?? []) as Tables<'settlements'>[]
  }));

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    groups
  };
};

export const importUserData = async (payload: BackupPayload): Promise<ImportResult> => {
  const result: ImportResult = {
    imported: 0,
    skipped: [],
    errors: []
  };

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup payload.');
  }

  if (payload.version !== BACKUP_VERSION) {
    throw new Error('Backup version is not supported.');
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to import data.');
  }

  for (const group of payload.groups ?? []) {
    if (group.owner_id !== user.id) {
      result.skipped.push({
        groupId: group.id,
        name: group.name,
        reason: 'You can only restore groups you own.'
      });
      continue;
    }

    const { group_members, expenses, settlements, ...groupRecord } = group;

    const { error: groupError } = await supabase
      .from('groups')
      .upsert(groupRecord as Tables<'groups'>, { onConflict: 'id' });

    if (groupError) {
      result.errors.push(`Failed to restore group "${group.name}": ${groupError.message}`);
      continue;
    }

    if (group_members?.length) {
      const { error: membersError } = await supabase
        .from('group_members')
        .upsert(group_members as Tables<'group_members'>[], { onConflict: 'group_id,member_id' });

      if (membersError) {
        result.errors.push(`Group members for "${group.name}" could not be restored: ${membersError.message}`);
      }
    }

    if (expenses?.length) {
      const expenseRecords = expenses.map(({ expense_splits, ...rest }) => rest) as Tables<'expenses'>[];
      const { error: expenseError } = await supabase
        .from('expenses')
        .upsert(expenseRecords, { onConflict: 'id' });

      if (expenseError) {
        result.errors.push(`Expenses for "${group.name}" could not be restored: ${expenseError.message}`);
      } else {
        const splits = expenses.flatMap((expense) => expense.expense_splits ?? []);
        if (splits.length) {
          const { error: splitError } = await supabase
            .from('expense_splits')
            .upsert(splits as Tables<'expense_splits'>[], { onConflict: 'id' });

          if (splitError) {
            result.errors.push(`Expense splits for "${group.name}" could not be restored: ${splitError.message}`);
          }
        }
      }
    }

    if (settlements?.length) {
      const { error: settlementError } = await supabase
        .from('settlements')
        .upsert(settlements as Tables<'settlements'>[], { onConflict: 'id' });

      if (settlementError) {
        result.errors.push(`Settlements for "${group.name}" could not be restored: ${settlementError.message}`);
      }
    }

    result.imported += 1;
  }

  return result;
};
