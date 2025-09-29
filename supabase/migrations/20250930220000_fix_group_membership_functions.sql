-- Migration: fix group membership helpers so owners can manage new groups

create or replace function public.is_group_member(target_group uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from groups
    where id = target_group
      and owner_id = auth.uid()
  ) then
    return true;
  end if;

  return exists (
    select 1
    from group_members
    where group_id = target_group
      and member_id = auth.uid()
  );
end;
$$;

create or replace function public.is_group_admin(target_group uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from groups
    where id = target_group
      and owner_id = auth.uid()
  ) then
    return true;
  end if;

  return exists (
    select 1
    from group_members
    where group_id = target_group
      and member_id = auth.uid()
      and role = 'owner'
  );
end;
$$;
