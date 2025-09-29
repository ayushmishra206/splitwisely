-- Migration: resolve group_members recursion by using admin helper

-- Replace existing helper and policies

drop policy if exists "Members read group membership" on group_members;

drop policy if exists "Owners manage membership" on group_members;

drop function if exists public.is_group_admin(target_group uuid);
drop function if exists public.is_group_owner(target_group uuid);

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

create policy "Members read group membership"
  on group_members
  for select
  using (is_group_member(group_id));

create policy "Owners manage membership"
  on group_members
  for all
  using (is_group_admin(group_id))
  with check (is_group_admin(group_id));
