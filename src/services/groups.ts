import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';

export type GroupRecord = Tables<'groups'>;
export type ProfileSummary = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'avatar_url'>;
export type GroupMemberRecord = Tables<'group_members'> & {
  profiles?: ProfileSummary | null;
};

export interface GroupWithMembers extends GroupRecord {
  owner_profile?: ProfileSummary | null;
  group_members: GroupMemberRecord[];
}

const groupSelect = `
  *,
  owner_profile:profiles!groups_owner_id_fkey (
    id,
    full_name,
    avatar_url
  ),
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

const profileSelect = 'id, full_name, avatar_url';

function collectMissingProfileIds(group: GroupWithMembers): string[] {
  const missing = new Set<string>();

  if (!group.owner_profile) {
    missing.add(group.owner_id);
  }

  (group.group_members ?? []).forEach((member) => {
    if (!member.profiles) {
      missing.add(member.member_id);
    }
  });

  return Array.from(missing);
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, ProfileSummary>> {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(profileSelect)
    .in('id', ids);

  if (error) {
    console.warn('Unable to fetch profile details', error);
    return new Map();
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile] as const));
}

function normalizeGroupMembers(group: GroupWithMembers, profileLookup: Map<string, ProfileSummary>): GroupWithMembers {
  const members = [...(group.group_members ?? [])];

  const hasOwnerMembership = members.some((member) => member.member_id === group.owner_id);
  const ownerProfile = group.owner_profile ?? profileLookup.get(group.owner_id) ?? null;

  if (!hasOwnerMembership) {
    members.push({
      group_id: group.id,
      member_id: group.owner_id,
      role: 'owner',
      joined_at: group.created_at,
      profiles: ownerProfile
    });
  }

  return {
    ...group,
    group_members: members.map((member) => ({
      ...member,
      profiles: member.profiles ?? (member.member_id === ownerProfile?.id ? ownerProfile : profileLookup.get(member.member_id) ?? member.profiles ?? null)
    }))
  };
}

export async function getCurrentUserId() {
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

export async function fetchGroupIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('member_id', userId);

  if (error) {
    throw error;
  }

  const uniqueIds = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.group_id) {
      uniqueIds.add(row.group_id);
    }
  });

  return Array.from(uniqueIds);
}

export async function fetchGroups(): Promise<GroupWithMembers[]> {
  const userId = await getCurrentUserId();
  const groupIds = await fetchGroupIdsForUser(userId);

  if (!groupIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('groups')
    .select(groupSelect)
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const groups = (data ?? []) as GroupWithMembers[];

  const missingProfileIds = new Set<string>();
  const ownerMembershipRows: TablesInsert<'group_members'>[] = [];

  groups.forEach((group) => {
    const members = group.group_members ?? [];
    const hasOwnerMembership = members.some((member) => member.member_id === group.owner_id);

    if (!hasOwnerMembership && group.owner_id === userId) {
      ownerMembershipRows.push({
        group_id: group.id,
        member_id: group.owner_id,
        role: 'owner' as const,
        joined_at: group.created_at
      });
    }

    collectMissingProfileIds(group).forEach((id) => missingProfileIds.add(id));
  });

  if (ownerMembershipRows.length) {
    const { error: ownerInsertError } = await supabase
      .from('group_members')
      .upsert(ownerMembershipRows, { onConflict: 'group_id,member_id' });

    if (ownerInsertError) {
      console.warn('Unable to backfill owner membership rows', ownerInsertError);
    }
  }

  const profileLookup = await fetchProfilesByIds(Array.from(missingProfileIds));

  return groups.map((group) => normalizeGroupMembers(group, profileLookup));
}

export type CreateGroupInput = Pick<TablesInsert<'groups'>, 'name' | 'description' | 'currency'> & {
  memberIds?: string[];
};

export async function createGroup(input: CreateGroupInput): Promise<GroupWithMembers> {
  const userId = await getCurrentUserId();
  const uniqueMemberIds = Array.from(
    new Set((input.memberIds ?? []).filter((memberId) => memberId && memberId !== userId))
  );
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

  const insertedGroupRaw = data as GroupWithMembers;

  const memberRows: TablesInsert<'group_members'>[] = [
    {
      group_id: insertedGroupRaw.id,
      member_id: userId,
      role: 'owner' as const
    },
    ...uniqueMemberIds.map((memberId) => ({
      group_id: insertedGroupRaw.id,
      member_id: memberId,
      role: 'member' as const
    }))
  ];

  if (memberRows.length) {
    const { error: membersError } = await supabase
      .from('group_members')
      .upsert(memberRows, { onConflict: 'group_id,member_id' });

    if (membersError) {
      throw membersError;
    }
  }

  const { data: hydrated, error: hydrateError } = await supabase
    .from('groups')
    .select(groupSelect)
    .eq('id', insertedGroupRaw.id)
    .single();

  if (!hydrateError && hydrated) {
    const hydratedGroup = hydrated as GroupWithMembers;
    const lookup = await fetchProfilesByIds(
      Array.from(new Set([...collectMissingProfileIds(hydratedGroup), ...uniqueMemberIds]))
    );
    return normalizeGroupMembers(hydratedGroup, lookup);
  }

  const insertedLookup = await fetchProfilesByIds(
    Array.from(new Set([...collectMissingProfileIds(insertedGroupRaw), ...uniqueMemberIds]))
  );
  return normalizeGroupMembers(insertedGroupRaw, insertedLookup);
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

export async function addGroupMember(groupId: string, memberId: string, role: GroupMemberRecord['role'] = 'member'): Promise<GroupMemberRecord> {
  const payload: TablesInsert<'group_members'> = {
    group_id: groupId,
    member_id: memberId,
    role
  };

  const { error } = await supabase.from('group_members').insert(payload);

  if (error) {
    if (error.code === '23505') {
      throw new Error('This person is already part of the group.');
    }
    throw error;
  }

  const profileLookup = await fetchProfilesByIds([memberId]);
  return {
    group_id: groupId,
    member_id: memberId,
    role,
    joined_at: new Date().toISOString(),
    profiles: profileLookup.get(memberId) ?? null
  };
}

export async function removeGroupMember(groupId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('member_id', memberId);

  if (error) {
    throw error;
  }
}

export async function searchProfiles(term: string, limit = 10): Promise<ProfileSummary[]> {
  const query = supabase
    .from('profiles')
    .select(profileSelect)
    .order('full_name', { ascending: true })
    .limit(limit);

  const trimmed = term.trim();
  let builder = query;

  if (trimmed) {
    builder = builder.ilike('full_name', `%${trimmed}%`);
  }

  const { data, error } = await builder;

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileSummary[];
}
