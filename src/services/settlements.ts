import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';
import type { ProfileSummary } from './groups';

export type SettlementRecord = Tables<'settlements'>;

export interface SettlementWithRelations extends SettlementRecord {
  group?: {
    id: string;
    name: string;
    currency: string | null;
  } | null;
  from_profile?: ProfileSummary | null;
  to_profile?: ProfileSummary | null;
}

const settlementSelect = `
  *,
  group:groups (id, name, currency),
  from_profile:profiles!settlements_from_member_fkey (id, full_name, avatar_url),
  to_profile:profiles!settlements_to_member_fkey (id, full_name, avatar_url)
`;

const formatCurrency = (value: number) => value.toFixed(2);

export interface SettlementFilters {
  groupId?: string;
  limit?: number;
}

export const fetchSettlements = async (filters: SettlementFilters = {}): Promise<SettlementWithRelations[]> => {
  let query = supabase.from('settlements').select(settlementSelect).order('settlement_date', { ascending: false });

  if (filters.groupId) {
    query = query.eq('group_id', filters.groupId);
  }

  if (typeof filters.limit === 'number') {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as SettlementWithRelations[];
};

export interface CreateSettlementInput {
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  settlementDate?: string;
  notes?: string | null;
}

export const createSettlement = async (input: CreateSettlementInput): Promise<SettlementWithRelations> => {
  if (input.fromMemberId === input.toMemberId) {
    throw new Error('Members must be different for a settlement');
  }

  const payload: TablesInsert<'settlements'> = {
    group_id: input.groupId,
    from_member: input.fromMemberId,
    to_member: input.toMemberId,
    amount: formatCurrency(input.amount),
    settlement_date: input.settlementDate ?? new Date().toISOString().slice(0, 10),
    notes: input.notes ?? null
  };

  const { data, error } = await supabase.from('settlements').insert(payload).select(settlementSelect).single();

  if (error) {
    throw error;
  }

  return data as SettlementWithRelations;
};

export interface UpdateSettlementInput {
  id: string;
  groupId?: string;
  fromMemberId?: string;
  toMemberId?: string;
  amount?: number;
  settlementDate?: string;
  notes?: string | null;
}

export const updateSettlement = async (input: UpdateSettlementInput): Promise<SettlementWithRelations> => {
  const updates: TablesUpdate<'settlements'> = {};

  if (input.groupId) {
    updates.group_id = input.groupId;
  }
  if (input.fromMemberId) {
    updates.from_member = input.fromMemberId;
  }
  if (input.toMemberId) {
    updates.to_member = input.toMemberId;
  }
  if (typeof input.amount === 'number') {
    updates.amount = formatCurrency(input.amount);
  }
  if (input.settlementDate) {
    updates.settlement_date = input.settlementDate;
  }
  if (typeof input.notes !== 'undefined') {
    updates.notes = input.notes ?? null;
  }

  if (!Object.keys(updates).length) {
    const { data, error } = await supabase.from('settlements').select(settlementSelect).eq('id', input.id).single();
    if (error) {
      throw error;
    }
    return data as SettlementWithRelations;
  }

  const { data, error } = await supabase
    .from('settlements')
    .update(updates)
    .eq('id', input.id)
    .select(settlementSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as SettlementWithRelations;
};

export const deleteSettlement = async (id: string): Promise<void> => {
  const { error } = await supabase.from('settlements').delete().eq('id', id);
  if (error) {
    throw error;
  }
};
