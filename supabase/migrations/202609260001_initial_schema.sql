-- KAJORA initial relational model.
-- Payments and custody are deliberately outside the MVP.

create extension if not exists pgcrypto;

create type public.post_type as enum ('buying_intent', 'available_share');
create type public.post_state as enum (
  'open',
  'forming',
  'planning',
  'awaiting_confirmation',
  'confirmed',
  'completed',
  'closed',
  'expired',
  'removed'
);
create type public.participant_state as enum (
  'interested',
  'ready',
  'assigned',
  'confirmed',
  'declined',
  'withdrawn',
  'removed',
  'completed'
);
create type public.decision_state as enum ('not_discussed', 'discussing', 'suggested', 'agreed');
create type public.plan_state as enum ('draft', 'awaiting_confirmation', 'confirmed', 'superseded', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text,
  discovery_area text,
  phone_verified boolean not null default false,
  completed_groups integer not null default 0 check (completed_groups >= 0),
  account_state text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  type public.post_type not null default 'buying_intent',
  state public.post_state not null default 'open',
  category text not null,
  product text not null check (char_length(product) between 2 and 80),
  title text not null check (char_length(title) between 8 and 140),
  description text not null check (char_length(description) between 10 and 1200),
  desired_share text not null,
  timing_text text not null,
  budget_text text,
  location_label text not null,
  area_label text not null,
  latitude double precision,
  longitude double precision,
  desired_people integer check (desired_people is null or desired_people between 2 and 100),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  state public.participant_state not null default 'interested',
  desired_share text,
  budget_preference text,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.buying_groups (
  id uuid primary key default gen_random_uuid(),
  source_post_id uuid not null unique references public.posts(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  coordinator_id uuid references public.profiles(id) on delete set null,
  state public.post_state not null default 'forming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.buying_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  state public.participant_state not null default 'interested',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (group_id, user_id)
);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.buying_groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  moderation_state text not null default 'visible',
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.decision_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.buying_groups(id) on delete cascade,
  key text not null,
  label text not null,
  value text,
  state public.decision_state not null default 'not_discussed',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, key)
);

create table public.final_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.buying_groups(id) on delete cascade,
  version integer not null check (version > 0),
  state public.plan_state not null default 'draft',
  proposed_by uuid not null references public.profiles(id) on delete restrict,
  product_specification text not null,
  vendor_details jsonb not null default '{}'::jsonb,
  cost_breakdown jsonb not null default '{}'::jsonb,
  allocation_breakdown jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  fulfilment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, version)
);

create table public.plan_members (
  plan_id uuid not null references public.final_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_share text not null,
  expected_amount numeric(14, 2) check (expected_amount is null or expected_amount >= 0),
  state public.participant_state not null default 'assigned',
  responded_at timestamptz,
  primary key (plan_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  subject_type text not null,
  subject_id uuid not null,
  category text not null,
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_discovery_idx on public.posts (state, category, area_label, created_at desc);
create index posts_creator_idx on public.posts (creator_id, created_at desc);
create index interests_post_idx on public.interests (post_id, state);
create index group_messages_group_idx on public.group_messages (group_id, created_at);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();
create trigger interests_set_updated_at before update on public.interests
for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.buying_groups
for each row execute function public.set_updated_at();
create trigger decisions_set_updated_at before update on public.decision_items
for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.final_plans
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, phone_verified)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New member'),
    new.phone_confirmed_at is not null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_group_member(target_group uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group
      and gm.user_id = target_user
      and gm.state not in ('withdrawn', 'removed')
  );
$$;

create or replace function public.is_post_participant(target_post uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.buying_groups g
    join public.group_members gm on gm.group_id = g.id
    where g.source_post_id = target_post
      and gm.user_id = target_user
      and gm.state not in ('withdrawn', 'removed')
  );
$$;

create or replace function public.express_interest(target_post uuid, interest_note text default null)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  result_group uuid;
  post_creator uuid;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;

  select p.creator_id into post_creator
  from public.posts p
  where p.id = target_post
    and p.state in ('open', 'forming', 'planning')
    and p.expires_at > now();

  if post_creator is null then
    raise exception 'Post is not accepting interest';
  end if;
  if post_creator = caller then
    raise exception 'Creator cannot express interest in own post';
  end if;

  insert into public.interests (post_id, user_id, note, state)
  values (target_post, caller, interest_note, 'interested')
  on conflict (post_id, user_id) do update
    set note = excluded.note, state = 'interested', updated_at = now();

  insert into public.buying_groups (source_post_id, creator_id, coordinator_id, state)
  values (target_post, post_creator, post_creator, 'forming')
  on conflict (source_post_id) do update set updated_at = now()
  returning id into result_group;

  insert into public.group_members (group_id, user_id, role, state)
  values
    (result_group, post_creator, 'creator', 'ready'),
    (result_group, caller, 'member', 'interested')
  on conflict (group_id, user_id) do update
    set state = excluded.state, left_at = null;

  update public.posts
  set state = case when state = 'open' then 'forming' else state end
  where id = target_post;

  return result_group;
end;
$$;

create or replace function public.withdraw_interest(target_post uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  target_group uuid;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;

  update public.interests
  set state = 'withdrawn', updated_at = now()
  where post_id = target_post and user_id = caller;

  select id into target_group from public.buying_groups where source_post_id = target_post;
  if target_group is not null then
    update public.group_members
    set state = 'withdrawn', left_at = now()
    where group_id = target_group and user_id = caller;
  end if;
end;
$$;

revoke all on function public.is_group_member(uuid, uuid) from public, anon;
revoke all on function public.is_post_participant(uuid, uuid) from public, anon;
revoke all on function public.express_interest(uuid, text) from public, anon;
revoke all on function public.withdraw_interest(uuid) from public, anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_post_participant(uuid, uuid) to authenticated;
grant execute on function public.express_interest(uuid, text) to authenticated;
grant execute on function public.withdraw_interest(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.interests enable row level security;
alter table public.buying_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.decision_items enable row level security;
alter table public.final_plans enable row level security;
alter table public.plan_members enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "Authenticated users can view public profiles"
on public.profiles for select to authenticated using (account_state = 'active');
create policy "Users can update their own profile"
on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Authenticated users can discover active posts"
on public.posts for select to authenticated
using (state not in ('removed') and expires_at > now());
create policy "Users can create their own posts"
on public.posts for insert to authenticated with check (creator_id = auth.uid());
create policy "Creators can update their own posts"
on public.posts for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

create policy "Participants can view relevant interests"
on public.interests for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.posts p where p.id = post_id and p.creator_id = auth.uid())
  or public.is_post_participant(post_id)
);

create policy "Members can view their groups"
on public.buying_groups for select to authenticated using (public.is_group_member(id));
create policy "Members can view group membership"
on public.group_members for select to authenticated using (public.is_group_member(group_id));

create policy "Members can view group messages"
on public.group_messages for select to authenticated using (public.is_group_member(group_id));
create policy "Members can send group messages"
on public.group_messages for insert to authenticated
with check (author_id = auth.uid() and public.is_group_member(group_id));

create policy "Members can view decisions"
on public.decision_items for select to authenticated using (public.is_group_member(group_id));
create policy "Members can add decisions"
on public.decision_items for insert to authenticated
with check (updated_by = auth.uid() and public.is_group_member(group_id));
create policy "Members can update decisions"
on public.decision_items for update to authenticated
using (public.is_group_member(group_id))
with check (updated_by = auth.uid() and public.is_group_member(group_id));

create policy "Members can view group plans"
on public.final_plans for select to authenticated using (public.is_group_member(group_id));
create policy "Members can propose plans"
on public.final_plans for insert to authenticated
with check (proposed_by = auth.uid() and public.is_group_member(group_id));

create policy "Members can view plan assignments"
on public.plan_members for select to authenticated
using (
  exists (
    select 1 from public.final_plans fp
    where fp.id = plan_id and public.is_group_member(fp.group_id)
  )
);
create policy "Users can respond to their assignment"
on public.plan_members for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can view their notifications"
on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "Users can mark their notifications read"
on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "Users can submit reports"
on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Users can view their reports"
on public.reports for select to authenticated using (reporter_id = auth.uid());

