begin;

create table public.moderators (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  note text not null check (char_length(note) between 5 and 1000),
  created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
alter table public.moderation_actions enable row level security;
revoke all on public.moderators, public.moderation_actions from anon, authenticated;
alter table public.reports add column subject_user_id uuid references public.profiles(id);
alter table public.reports add column post_id uuid references public.posts(id);
alter table public.reports add column snapshot jsonb not null default '{}'::jsonb;
alter table public.posts add column moderation_hidden boolean not null default false;
create index reports_queue_idx on public.reports(status, created_at desc);
create index reports_reporter_recent_idx on public.reports(reporter_id, created_at desc);

create function public.account_is_active() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and account_state='active');
$$;
create function public.is_moderator() returns boolean
language sql stable security definer set search_path='' as $$
  select public.account_is_active() and exists(select 1 from public.moderators where user_id=auth.uid());
$$;
create function public.require_active_account() returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.account_is_active() then raise exception 'Your account is suspended or unavailable. Contact the KAJORA organiser for review.'; end if;
end; $$;

-- Restrictive policies also protect direct REST access, not just our screens.
do $$ declare t text; begin
  foreach t in array array['posts','interests','buying_groups','group_members','group_messages','decision_items','final_plans','plan_members','notifications','reports','group_polls','poll_votes'] loop
    execute format('create policy "Active accounts only" on public.%I as restrictive for all to authenticated using (public.account_is_active()) with check (public.account_is_active())',t);
  end loop;
end; $$;
create policy "Active profile writes" on public.profiles as restrictive for update to authenticated
using(public.account_is_active()) with check(public.account_is_active());
create policy "Suspended users see only their own profile" on public.profiles as restrictive for select to authenticated
using(public.account_is_active() or id=auth.uid());
create policy "Own account status" on public.profiles for select to authenticated using(id=auth.uid());
create policy "Hidden intentions stay off discovery" on public.posts as restrictive for select to authenticated
using(not moderation_hidden or creator_id=auth.uid() or public.is_post_participant(id));
create policy "New intentions cannot set moderation flags" on public.posts as restrictive for insert to authenticated
with check(not moderation_hidden and state='open' and not joining_closed);
create policy "Active accounts use image storage" on storage.objects as restrictive for all to authenticated
using(bucket_id <> 'group-images' or public.account_is_active())
with check(bucket_id <> 'group-images' or public.account_is_active());

-- Protect privilege-bearing profile fields even if broad table grants exist.
create function public.protect_profile_status() returns trigger language plpgsql set search_path='' as $$
begin
  if current_user in ('authenticated','anon') and
    (new.account_state is distinct from old.account_state or new.phone_verified is distinct from old.phone_verified
     or new.completed_groups is distinct from old.completed_groups or new.id is distinct from old.id) then
    raise exception 'Only trusted server operations may change account status or verification';
  end if;
  return new;
end; $$;
create trigger protect_profile_status before update on public.profiles
for each row execute function public.protect_profile_status();

-- Preserve existing business rules, but put an active-account check in front of
-- every public business RPC. Old implementations are no longer client-callable.
do $$ declare f record; args text; body text; begin
  for f in select p.oid,p.proname,p.proargnames,p.proargtypes,p.pronargs,p.proretset,p.prorettype,
      pg_get_function_arguments(p.oid) as decl,pg_get_function_identity_arguments(p.oid) as identity_args,
      pg_get_function_result(p.oid) as result_type
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
      and p.proname = any(array['express_interest','withdraw_interest','review_join_request','set_joining_closed','get_join_requests',
        'get_interest_counts','propose_group_plan','respond_group_plan','close_buying_group','create_group_poll','vote_group_poll',
        'close_group_poll','get_group_workspace','send_group_image'])
  loop
    select string_agg(format('$%s',i),',') into args from generate_series(1,f.pronargs) i;
    execute format('alter function public.%I(%s) rename to %I',f.proname,f.identity_args,f.proname || '_before_safety');
    execute format('revoke all on function public.%I(%s) from public,anon,authenticated',f.proname || '_before_safety',f.identity_args);
    body := case when f.proretset then 'return query select * from ' when f.prorettype='void'::regtype then 'perform ' else 'return ' end
      || format('public.%I(%s);',f.proname || '_before_safety',coalesce(args,''));
    execute format('create function public.%I(%s) returns %s language plpgsql security definer set search_path='''' as %L',
      f.proname,f.decl,f.result_type,'begin perform public.require_active_account(); ' || case when f.proname='express_interest' then 'if not exists(select 1 from public.posts p join public.profiles pr on pr.id=p.creator_id where p.id=$1 and pr.account_state=''active'' and not p.moderation_hidden) then raise exception ''This intention is unavailable''; end if; ' else '' end || body || ' end;');
    execute format('revoke all on function public.%I(%s) from public,anon',f.proname,f.identity_args);
    execute format('grant execute on function public.%I(%s) to authenticated',f.proname,f.identity_args);
  end loop;
end; $$;

-- No direct report inserts: validate access, take a server-side snapshot and rate limit.
drop policy "Users can submit reports" on public.reports;
create function public.submit_safety_report(kind text, target uuid, reason text, explanation text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare subject_user uuid; related_post uuid; evidence jsonb; existing uuid; result uuid; caller uuid:=auth.uid();
begin
  perform public.require_active_account();
  if reason is null or reason not in ('advance_payment','fake_intention','impersonation','harassment','other') then raise exception 'Choose a report reason'; end if;
  if explanation is null or char_length(trim(explanation)) not between 10 and 2000 then raise exception 'Describe what happened in 10 to 2000 characters'; end if;
  -- Serialise per-reporter submissions so retries and concurrent requests respect limits.
  perform 1 from public.profiles where id=caller for update;
  if kind='post' then
    select p.creator_id,p.id,jsonb_build_object('title',p.title,'description',p.description,'product',p.product)
      into subject_user,related_post,evidence from public.posts p
      where p.id=target and ((not p.moderation_hidden and p.expires_at>now()) or p.creator_id=caller or public.is_post_participant(p.id));
  elsif kind='message' then
    select m.author_id,g.source_post_id,jsonb_build_object('body',m.body,'image_path',m.image_path,'group_id',m.group_id)
      into subject_user,related_post,evidence from public.group_messages m join public.buying_groups g on g.id=m.group_id
      where m.id=target and public.is_group_member(m.group_id);
  else raise exception 'Unsupported report target'; end if;
  if subject_user is null then raise exception 'This content is not available to report'; end if;
  if subject_user=caller then raise exception 'You cannot report your own content'; end if;
  select id into existing from public.reports where reporter_id=caller and subject_type=kind and subject_id=target and status='open' limit 1;
  if existing is not null then return existing; end if;
  if (select count(*) from public.reports where reporter_id=caller and created_at>now()-interval '24 hours') >= 10 then
    raise exception 'You have reached the daily report limit. Please try again tomorrow.';
  end if;
  insert into public.reports(reporter_id,subject_type,subject_id,category,details,subject_user_id,post_id,snapshot)
    values(caller,kind,target,reason,trim(explanation),subject_user,related_post,evidence) returning id into result;
  return result;
end; $$;

create function public.list_safety_reports(queue_status text default 'open', page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_moderator() then raise exception 'Administrator access required'; end if;
  if queue_status not in ('open','resolved','dismissed','all') or page_offset<0 then raise exception 'Invalid queue filter'; end if;
  return coalesce((select jsonb_agg(to_jsonb(q)) from (
    select r.*,p.display_name as subject_name,p.account_state as subject_account_state,
      (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at),'[]'::jsonb) from public.moderation_actions a where a.report_id=r.id) as actions
    from public.reports r left join public.profiles p on p.id=r.subject_user_id
    where queue_status='all' or r.status=queue_status order by r.created_at desc,r.id limit 50 offset page_offset
  ) q),'[]'::jsonb);
end; $$;

create function public.review_safety_report(target_report uuid, decision text, review_note text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.reports; g uuid;
begin
  if not public.is_moderator() then raise exception 'Administrator access required'; end if;
  if review_note is null or char_length(trim(review_note)) not between 5 and 1000 then raise exception 'Add a review note (5 to 1000 characters)'; end if;
  if decision is null or decision not in ('resolve','dismiss','hide_intention','suspend_account','restore_account') then raise exception 'Unknown review action'; end if;
  select * into r from public.reports where id=target_report for update;
  if r.id is null then raise exception 'Report not found'; end if;
  if decision in ('suspend_account','restore_account') then
    if r.subject_user_id is null or r.subject_user_id=auth.uid() or exists(select 1 from public.moderators where user_id=r.subject_user_id) then
      raise exception 'This account cannot be moderated here';
    end if;
    update public.profiles set account_state=case when decision='suspend_account' then 'suspended' else 'active' end where id=r.subject_user_id;
  elsif decision='hide_intention' then
    if r.post_id is null then raise exception 'This report has no intention'; end if;
    -- Match the post -> group lock order used by the planning RPCs.
    perform 1 from public.posts where id=r.post_id for update;
    select id into g from public.buying_groups where source_post_id=r.post_id for update;
    update public.posts set moderation_hidden=true,joining_closed=true,state='closed' where id=r.post_id;
    update public.buying_groups set state='closed' where id=g;
    update public.final_plans set state='closed' where group_id=g and state in ('draft','awaiting_confirmation','confirmed');
  end if;
  update public.reports set status=case when decision='dismiss' then 'dismissed' else 'resolved' end where id=r.id;
  insert into public.moderation_actions(report_id,actor_id,action,note) values(r.id,auth.uid(),decision,trim(review_note));
end; $$;

revoke all on function public.account_is_active(),public.is_moderator(),public.require_active_account(),
  public.submit_safety_report(text,uuid,text,text),public.list_safety_reports(text,integer),public.review_safety_report(uuid,text,text)
  from public,anon;
grant execute on function public.account_is_active(),public.is_moderator(),public.require_active_account(),
  public.submit_safety_report(text,uuid,text,text),public.list_safety_reports(text,integer),public.review_safety_report(uuid,text,text)
  to authenticated;
revoke all on function public.protect_profile_status() from public,anon,authenticated;
-- Admin image access is limited to images attached to submitted message reports.
create function public.can_review_report_image(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.is_moderator() and exists(select 1 from public.reports where subject_type='message' and snapshot->>'image_path'=object_name);
$$;
revoke all on function public.can_review_report_image(text) from public,anon;
grant execute on function public.can_review_report_image(text) to authenticated;
create policy "Admins read reported image evidence" on storage.objects for select to authenticated
using(bucket_id='group-images' and public.can_review_report_image(name));
-- Suspended organisers cannot continue attracting new people; members retain context.
create policy "Suspended organisers leave discovery" on public.posts as restrictive for select to authenticated
using(exists(select 1 from public.profiles p where p.id=creator_id and p.account_state='active') or public.is_post_participant(id));
commit;
