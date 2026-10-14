begin;

alter table public.plan_members add column if not exists response_note text;
drop policy if exists "Creators can update their own posts" on public.posts;
-- All plan writes go through version-aware, organiser/member checked functions.
drop policy if exists "Members can propose plans" on public.final_plans;
drop policy if exists "Users can respond to their assignment" on public.plan_members;

create table public.group_polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.buying_groups(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  question text not null check(char_length(question) between 3 and 180),
  options text[] not null check(cardinality(options) between 2 and 6),
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.poll_votes (
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  choice integer not null check(choice >= 0),
  primary key(poll_id,user_id)
);
create index group_polls_group_idx on public.group_polls(group_id,created_at);
alter table public.group_polls enable row level security;
alter table public.poll_votes enable row level security;
create policy "Members read polls" on public.group_polls for select to authenticated
  using(public.is_group_member(group_id));
create policy "Members read votes" on public.poll_votes for select to authenticated
  using(exists(select 1 from public.group_polls p where p.id=poll_id and public.is_group_member(p.group_id)));

-- Keep archived/expired intentions available to their own groups.
create policy "Members retain source posts" on public.posts for select to authenticated
  using(public.is_post_participant(id));

-- Shared locking order: post, then group. Not callable by clients.
create function public.lock_planning_group(target_group uuid)
returns public.buying_groups language plpgsql security definer set search_path='' as $$
declare g public.buying_groups; source_id uuid;
begin
  select source_post_id into source_id from public.buying_groups where id=target_group;
  perform 1 from public.posts where id=source_id for update;
  select * into g from public.buying_groups where id=target_group for update;
  if auth.uid() is null or g.id is null or not public.is_group_member(g.id) then
    raise exception 'Only approved members can access this group';
  end if;
  if g.state in ('completed','closed','removed','expired') then raise exception 'This group is closed'; end if;
  return g;
end; $$;
revoke all on function public.lock_planning_group(uuid) from public,anon,authenticated;

create function public.propose_group_plan(target_group uuid, expected_version integer, details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare g public.buying_groups; next_version integer; result_id uuid; field text; amount numeric;
begin
  g := public.lock_planning_group(target_group);
  if g.creator_id <> auth.uid() then raise exception 'Only the organiser can propose a plan'; end if;
  select coalesce(max(version),0) into next_version from public.final_plans where group_id=g.id;
  if expected_version is distinct from next_version then raise exception 'The plan changed. Refresh before editing.'; end if;
  foreach field in array array['product','supplier','total','allocation','pickup','date'] loop
    if nullif(btrim(details->>field),'') is null or char_length(details->>field)>1200 then
      raise exception 'Complete all plan fields (maximum 1200 characters each)';
    end if;
  end loop;
  if (details->>'total') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' then raise exception 'Enter a valid total in naira'; end if;
  amount := (details->>'total')::numeric;
  if amount <= 0 then raise exception 'Total must be greater than zero'; end if;
  update public.final_plans set state='superseded' where group_id=g.id and state not in ('superseded','closed');
  insert into public.final_plans(group_id,version,state,proposed_by,product_specification,vendor_details,cost_breakdown,allocation_breakdown,schedule,fulfilment)
  values(g.id,next_version+1,'awaiting_confirmation',auth.uid(),btrim(details->>'product'),
    jsonb_build_object('supplier',btrim(details->>'supplier')),jsonb_build_object('total',amount,'currency','NGN'),
    jsonb_build_object('description',btrim(details->>'allocation')),jsonb_build_object('date',btrim(details->>'date')),
    jsonb_build_object('pickup',btrim(details->>'pickup'))) returning id into result_id;
  insert into public.plan_members(plan_id,user_id,assigned_share,state)
    select result_id,user_id,btrim(details->>'allocation'),'assigned' from public.group_members
    where group_id=g.id and state not in ('withdrawn','removed');
  update public.buying_groups set state='awaiting_confirmation' where id=g.id;
  update public.posts set state='awaiting_confirmation',joining_closed=true where id=g.source_post_id;
  return result_id;
end; $$;

create function public.respond_group_plan(target_plan uuid, agrees boolean, note text default '')
returns void language plpgsql security definer set search_path='' as $$
declare p public.final_plans; g public.buying_groups; all_agreed boolean;
begin
  select * into p from public.final_plans where id=target_plan;
  g := public.lock_planning_group(p.group_id);
  select * into p from public.final_plans where id=target_plan;
  if p.state not in ('awaiting_confirmation','confirmed') or agrees is null then raise exception 'This plan is no longer current'; end if;
  if char_length(coalesce(note,''))>500 or (not agrees and nullif(btrim(note),'') is null) then raise exception 'Explain the requested change in 1–500 characters'; end if;
  update public.plan_members set state=case when agrees then 'confirmed'::public.participant_state else 'declined'::public.participant_state end,
    response_note=case when agrees then null else btrim(note) end,responded_at=now()
    where plan_id=p.id and user_id=auth.uid();
  if not found then raise exception 'The organiser must issue a plan for the current membership'; end if;
  select not exists(select 1 from public.group_members m where m.group_id=g.id and m.state not in ('withdrawn','removed')
    and not exists(select 1 from public.plan_members pm where pm.plan_id=p.id and pm.user_id=m.user_id and pm.state='confirmed')) into all_agreed;
  update public.final_plans set state=case when all_agreed then 'confirmed'::public.plan_state else 'awaiting_confirmation'::public.plan_state end where id=p.id;
  update public.buying_groups set state=case when all_agreed then 'confirmed'::public.post_state else 'awaiting_confirmation'::public.post_state end where id=g.id;
  update public.posts set state=case when all_agreed then 'confirmed'::public.post_state else 'awaiting_confirmation'::public.post_state end where id=g.source_post_id;
end; $$;

create function public.close_buying_group(target_group uuid, outcome text)
returns void language plpgsql security definer set search_path='' as $$
declare g public.buying_groups; p public.final_plans;
begin
  g := public.lock_planning_group(target_group);
  if g.creator_id<>auth.uid() then raise exception 'Only the organiser can close this purchase'; end if;
  if outcome is null or outcome not in ('completed','closed') then raise exception 'Invalid outcome'; end if;
  if outcome='completed' then
    select * into p from public.final_plans where group_id=g.id order by version desc limit 1;
    if p.id is null or p.state<>'confirmed' or exists(select 1 from public.group_members m
      where m.group_id=g.id and m.state not in ('withdrawn','removed') and not exists(select 1 from public.plan_members pm
        where pm.plan_id=p.id and pm.user_id=m.user_id and pm.state='confirmed')) then
      raise exception 'Every current member must confirm the latest plan first';
    end if;
  end if;
  update public.buying_groups set state=outcome::public.post_state where id=g.id;
  update public.posts set state=outcome::public.post_state,joining_closed=true where id=g.source_post_id;
  update public.interests set state='declined' where post_id=g.source_post_id and state='interested';
  if outcome='completed' then
    update public.profiles set completed_groups=completed_groups+1 where id in
      (select user_id from public.group_members where group_id=g.id and state not in ('withdrawn','removed'));
  end if;
  update public.group_polls set closed=true where group_id=g.id;
  update public.final_plans set state='closed' where group_id=g.id and state not in ('superseded','closed');
end; $$;

create or replace function public.set_joining_closed(target_post uuid, closed boolean)
returns void language plpgsql security definer set search_path='' as $$
declare p public.posts;
begin
  select * into p from public.posts where id=target_post for update;
  if auth.uid() is null or p.creator_id is distinct from auth.uid() then raise exception 'Only the organiser can change joining'; end if;
  if closed is null or (not closed and p.state not in ('open','forming','planning')) then
    raise exception 'Joining stays paused while confirming a plan or after closure';
  end if;
  update public.posts set joining_closed=closed where id=target_post;
end; $$;

-- Leaving a live plan invalidates it; nobody remains bound to an old allocation.
create or replace function public.withdraw_interest(target_post uuid)
returns void language plpgsql security definer set search_path='' as $$
declare p public.posts; g public.buying_groups; was_member boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into p from public.posts where id=target_post for update;
  if p.creator_id=auth.uid() then raise exception 'Organisers must cancel the purchase instead of leaving'; end if;
  select * into g from public.buying_groups where source_post_id=target_post for update;
  was_member := public.is_group_member(g.id);
  update public.interests set state='withdrawn' where post_id=target_post and user_id=auth.uid();
  update public.group_members set state='withdrawn',left_at=now() where group_id=g.id and user_id=auth.uid();
  if was_member and g.state in ('awaiting_confirmation','confirmed') then
    update public.final_plans set state='superseded' where group_id=g.id and state in ('awaiting_confirmation','confirmed');
    update public.buying_groups set state='planning' where id=g.id;
    update public.posts set state='planning',joining_closed=true where id=target_post;
  end if;
end; $$;

create function public.create_group_poll(target_group uuid, question_text text, choices text[])
returns uuid language plpgsql security definer set search_path='' as $$
declare g public.buying_groups; result_id uuid; cleaned text[];
begin
  g := public.lock_planning_group(target_group);
  select array_agg(btrim(value) order by ord) into cleaned from unnest(choices) with ordinality as t(value,ord);
  if question_text is null or char_length(btrim(question_text)) not between 3 and 180
    or cleaned is null or cardinality(cleaned) not between 2 and 6
    or exists(select 1 from unnest(cleaned) c where c is null or char_length(c) not between 1 and 100)
    or (select count(distinct lower(c)) from unnest(cleaned) c)<>cardinality(cleaned)
    then raise exception 'Use a question and 2–6 different options (100 characters each)'; end if;
  insert into public.group_polls(group_id,creator_id,question,options)
    values(g.id,auth.uid(),btrim(question_text),cleaned) returning id into result_id;
  return result_id;
end; $$;

create function public.vote_group_poll(target_poll uuid, option_index integer)
returns void language plpgsql security definer set search_path='' as $$
declare p public.group_polls; g public.buying_groups;
begin
  select * into p from public.group_polls where id=target_poll;
  g := public.lock_planning_group(p.group_id);
  select * into p from public.group_polls where id=target_poll for update;
  if p.closed or option_index is null or option_index<0 or option_index>=cardinality(p.options) then raise exception 'Poll closed or invalid option'; end if;
  insert into public.poll_votes(poll_id,user_id,choice) values(p.id,auth.uid(),option_index)
    on conflict(poll_id,user_id) do update set choice=excluded.choice;
end; $$;

create function public.close_group_poll(target_poll uuid)
returns void language plpgsql security definer set search_path='' as $$
declare p public.group_polls; g public.buying_groups;
begin
  select * into p from public.group_polls where id=target_poll;
  g := public.lock_planning_group(p.group_id);
  if auth.uid()<>p.creator_id and auth.uid()<>g.creator_id then raise exception 'Only the poll creator or organiser can close it'; end if;
  update public.group_polls set closed=true where id=p.id;
end; $$;

create function public.get_group_workspace(target_group uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_group_member(target_group) then raise exception 'Only approved members can access this group'; end if;
  select jsonb_build_object(
    'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',pr.display_name))
      from public.group_members m join public.profiles pr on pr.id=m.user_id where m.group_id=target_group and m.state not in ('withdrawn','removed')),'[]'::jsonb),
    'plan',(select to_jsonb(p) || jsonb_build_object('responses',coalesce((select jsonb_agg(to_jsonb(pm)) from public.plan_members pm where pm.plan_id=p.id),'[]'::jsonb))
      from public.final_plans p where p.group_id=target_group order by version desc limit 1),
    'polls',coalesce((select jsonb_agg(to_jsonb(p) || jsonb_build_object('votes',coalesce((select jsonb_agg(to_jsonb(v)) from public.poll_votes v where v.poll_id=p.id),'[]'::jsonb)) order by p.created_at desc)
      from public.group_polls p where p.group_id=target_group),'[]'::jsonb)
  ) into result;
  return result;
end; $$;

-- Closed groups remain readable but reject new messages, including direct API writes.
drop policy "Members can send group messages" on public.group_messages;
create policy "Members can send group messages" on public.group_messages for insert to authenticated
with check(author_id=auth.uid() and public.is_group_member(group_id) and exists(
  select 1 from public.buying_groups g where g.id=group_id and g.state not in ('completed','closed','removed','expired')));

revoke all on function public.propose_group_plan(uuid,integer,jsonb), public.respond_group_plan(uuid,boolean,text),
  public.close_buying_group(uuid,text),public.create_group_poll(uuid,text,text[]),public.vote_group_poll(uuid,integer),
  public.close_group_poll(uuid),public.get_group_workspace(uuid) from public,anon;
grant execute on function public.propose_group_plan(uuid,integer,jsonb), public.respond_group_plan(uuid,boolean,text),
  public.close_buying_group(uuid,text),public.create_group_poll(uuid,text,text[]),public.vote_group_poll(uuid,integer),
  public.close_group_poll(uuid),public.get_group_workspace(uuid) to authenticated;
commit;
