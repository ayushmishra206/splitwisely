-- Migration: simplify profile policies to avoid recursion
-- Generated manually

drop policy if exists "Profiles visible to group members" on profiles;
drop policy if exists "Profiles readable to authenticated" on profiles;

drop function if exists public.shares_group_with(target_profile uuid);

drop function if exists public.is_group_owner(target_profile uuid);
drop function if exists public.is_group_admin(target_profile uuid);

create or replace function public.is_group_admin(target_group uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from group_members
    where group_id = target_group
      and member_id = auth.uid()
      and role = 'owner'
  );
end;
$$;

drop policy if exists "Members read groups" on groups;
create policy "Members read groups"
  on groups
  for select
  using (
    owner_id = auth.uid()
    or is_group_member(id)
  );

drop policy if exists "Members read group membership" on group_members;
create policy "Members read group membership"
  on group_members
  for select
  using (is_group_member(group_id));

drop policy if exists "Owners manage membership" on group_members;
create policy "Owners manage membership"
  on group_members
  for all
  using (is_group_admin(group_id))
  with check (is_group_admin(group_id));

create policy "Profiles readable to authenticated"
  on profiles
  for select
  using (auth.uid() is not null);
