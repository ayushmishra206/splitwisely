import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type GroupRecord = Tables<'groups'>;
export type GroupMemberRecord = Tables<'group_members'> & {
  profiles?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'avatar_url'>;
};

export interface GroupWithMembers extends GroupRecord {
  group_members: GroupMemberRecord[];
}

const groupSelect = `
  *,
  group_members (
    group_id,
    member_id,
    role,
    joined_at,
    profiles:profiles!group_members_member_id_fkey (
      id,
      full_name,
      avatar_url
    )
  )
`;

async function getCurrentUserId() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('No authenticated user found');
  }

  return user.id;
}

export async function fetchGroups(): Promise<GroupWithMembers[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(groupSelect)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as GroupWithMembers[];
}

export type CreateGroupInput = Pick<TablesInsert<'groups'>, 'name' | 'description' | 'currency'>;

export async function createGroup(input: CreateGroupInput): Promise<GroupWithMembers> {
  const userId = await getCurrentUserId();
  const payload: TablesInsert<'groups'> = {
    name: input.name,
    description: input.description ?? null,
    currency: input.currency ?? 'USD',
    owner_id: userId
  };

  const { data, error } = await supabase
    .from('groups')
    .insert(payload)
    .select(groupSelect)
    .single();

  if (error) {
    throw error;
  }

  const insertedGroup = data as GroupWithMembers;

  const { error: membersError } = await supabase.from('group_members').insert({
    group_id: insertedGroup.id,
    member_id: userId,
    role: 'owner'
  });

  if (membersError && membersError.code !== '23505') {
    // Ignore duplicate entry errors (23505) but surface others
    throw membersError;
  }

  if (!membersError) {
    const { data: hydrated, error: hydrateError } = await supabase
      .from('groups')
      .select(groupSelect)
      .eq('id', insertedGroup.id)
      .single();

    if (!hydrateError && hydrated) {
      return hydrated as GroupWithMembers;
    }
  }

  return insertedGroup;
}

export type UpdateGroupInput = Pick<TablesUpdate<'groups'>, 'id' | 'name' | 'description' | 'currency'> & {
  id: string;
};

export async function updateGroup({ id, ...changes }: UpdateGroupInput): Promise<GroupWithMembers> {
  const updates: TablesUpdate<'groups'> = {
    name: changes.name,
    description: changes.description ?? null
  };

  if (typeof changes.currency !== 'undefined' && changes.currency !== null) {
    updates.currency = changes.currency;
  }

  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', id)
    .select(groupSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as GroupWithMembers;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from('groups').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
