-- Migration: enhance profile policies for group visibility
-- Generated manually to sync with schema.sql updates

create or replace function public.shares_group_with(target_profile uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from group_members gm_self
    join group_members gm_peer
      on gm_self.group_id = gm_peer.group_id
    where gm_self.member_id = auth.uid()
      and gm_peer.member_id = target_profile
  );
end;
$$;

drop policy if exists "Profiles are self-insertable" on profiles;
create policy "Profiles are self-insertable"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles visible to group members" on profiles;
create policy "Profiles visible to group members"
  on profiles
  for select
  using (
    auth.uid() = id
    or shares_group_with(id)
  );

drop policy if exists "Profiles are self-readable" on profiles;
create policy "Profiles are self-readable"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Profiles are self-updatable" on profiles;
create policy "Profiles are self-updatable"
  on profiles for update using (auth.uid() = id);
