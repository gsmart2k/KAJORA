-- Requests do not grant membership. Existing members retain their access.
begin;
alter table public.posts add column if not exists joining_closed boolean not null default false;

create or replace function public.express_interest(target_post uuid, interest_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare p public.posts; g uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into p from public.posts where id = target_post for update;
  if p.id is null or p.expires_at <= now() or p.state not in ('open','forming','planning') then
    raise exception 'This plan is not accepting requests';
  end if;
  if p.creator_id = auth.uid() then raise exception 'You started this plan'; end if;
  select id into g from public.buying_groups where source_post_id = target_post;
  if g is not null and public.is_group_member(g) then return g; end if;
  if p.joining_closed then raise exception 'Joining is closed'; end if;
  if p.desired_people is not null and
     (select count(*) from public.group_members where group_id = g and state not in ('withdrawn','removed')) >= p.desired_people
  then raise exception 'This group is full'; end if;
  insert into public.interests(post_id,user_id,note,state)
  values(target_post,auth.uid(),interest_note,'interested')
  on conflict(post_id,user_id) do update set state='interested', note=excluded.note, updated_at=now();
  return null;
end;
$$;

create or replace function public.review_join_request(target_post uuid, applicant uuid, approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.posts; g uuid;
begin
  select * into p from public.posts where id=target_post for update;
  if auth.uid() is null or p.creator_id is distinct from auth.uid() then raise exception 'Only the organiser can review requests'; end if;
  if not exists(select 1 from public.interests where post_id=target_post and user_id=applicant and state='interested')
    then raise exception 'Request is no longer pending'; end if;
  select id into g from public.buying_groups where source_post_id=target_post;
  if g is not null and public.is_group_member(g,applicant) then raise exception 'Already a member'; end if;
  if not approve then
    update public.interests set state='declined',updated_at=now() where post_id=target_post and user_id=applicant;
    return;
  end if;
  if p.joining_closed or p.expires_at <= now() or p.state not in ('open','forming','planning') then raise exception 'Joining is closed'; end if;
  insert into public.buying_groups(source_post_id,creator_id,coordinator_id,state)
    values(target_post,auth.uid(),auth.uid(),'forming')
    on conflict(source_post_id) do update set updated_at=now() returning id into g;
  insert into public.group_members(group_id,user_id,role,state)
    values(g,auth.uid(),'creator','ready') on conflict(group_id,user_id) do nothing;
  if p.desired_people is not null and
    (select count(*) from public.group_members where group_id=g and state not in ('withdrawn','removed')) >= p.desired_people
    then raise exception 'This group is full'; end if;
  insert into public.group_members(group_id,user_id,role,state) values(g,applicant,'member','ready')
    on conflict(group_id,user_id) do update set state='ready',left_at=null;
  update public.interests set state='ready',updated_at=now() where post_id=target_post and user_id=applicant;
  update public.posts set state=case when state='open' then 'forming'::public.post_state else state end where id=target_post;
end;
$$;

create or replace function public.set_joining_closed(target_post uuid, closed boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.posts set joining_closed=closed where id=target_post and creator_id=auth.uid();
  if not found then raise exception 'Only the organiser can change joining'; end if;
end;
$$;

-- Explicit organiser-only request list, excluding existing members.
create or replace function public.get_join_requests(target_post uuid)
returns table(user_id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select i.user_id, pr.display_name from public.interests i
  join public.posts p on p.id=i.post_id
  join public.profiles pr on pr.id=i.user_id
  where p.id=target_post and p.creator_id=auth.uid() and i.state='interested'
    and not exists(select 1 from public.buying_groups g join public.group_members m on m.group_id=g.id
      where g.source_post_id=p.id and m.user_id=i.user_id and m.state not in ('withdrawn','removed'));
$$;
revoke all on function public.review_join_request(uuid,uuid,boolean) from public,anon;
revoke all on function public.set_joining_closed(uuid,boolean) from public,anon;
revoke all on function public.get_join_requests(uuid) from public,anon;
grant execute on function public.review_join_request(uuid,uuid,boolean) to authenticated;
grant execute on function public.set_joining_closed(uuid,boolean) to authenticated;
grant execute on function public.get_join_requests(uuid) to authenticated;
commit;
