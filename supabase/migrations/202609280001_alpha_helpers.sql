-- Safe aggregate used by the discovery wall. It exposes counts, not participant identities.
create or replace function public.get_interest_counts()
returns table (post_id uuid, interested_count bigint)
language sql
stable
security definer set search_path = ''
as $$
  select i.post_id, count(*)::bigint
  from public.interests i
  join public.posts p on p.id = i.post_id
  where i.state in ('interested', 'ready', 'assigned', 'confirmed')
    and p.state not in ('removed', 'closed', 'expired')
    and p.expires_at > now()
  group by i.post_id;
$$;

revoke all on function public.get_interest_counts() from public, anon;
grant execute on function public.get_interest_counts() to authenticated;
