begin;
alter table public.group_messages add column image_path text;
alter table public.group_messages drop constraint group_messages_body_check;
alter table public.group_messages add constraint group_messages_content_check
  check(char_length(body)<=2000 and (char_length(btrim(body))>0 or image_path is not null));
create unique index group_messages_image_unique on public.group_messages(image_path) where image_path is not null;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('group-images','group-images',false,5242880,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg'];

-- Object keys: group UUID / uploader UUID / unique filename.jpg.
create policy "Group members read private images" on storage.objects for select to authenticated
using(bucket_id='group-images' and exists(select 1 from public.buying_groups g
  where g.id::text=split_part(name,'/',1) and public.is_group_member(g.id)));
create policy "Members upload their group images" on storage.objects for insert to authenticated
with check(bucket_id='group-images' and split_part(name,'/',2)=auth.uid()::text
  and name ~ '^[0-9a-f-]+/[0-9a-f-]+/[a-zA-Z0-9-]+\.jpg$'
  and exists(select 1 from public.buying_groups g where g.id::text=split_part(name,'/',1)
    and public.is_group_member(g.id) and g.state not in ('completed','closed','expired','removed')));
-- Protect direct REST inserts too: only the uploader can attach an existing object to its own group.
create function public.validate_chat_image()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.image_path is not null then
    if split_part(new.image_path,'/',1)<>new.group_id::text
      or split_part(new.image_path,'/',2)<>new.author_id::text
      or not exists(select 1 from storage.objects o where o.bucket_id='group-images' and o.name=new.image_path)
      then raise exception 'Upload the image to this group before sending'; end if;
  end if;
  return new;
end; $$;
revoke all on function public.validate_chat_image() from public,anon,authenticated;
create trigger validate_chat_image before insert or update on public.group_messages
for each row execute function public.validate_chat_image();

-- Retrying a send with the same uploaded object returns the original message.
create function public.send_group_image(target_group uuid, object_path text, caption text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.buying_groups; m public.group_messages; result jsonb;
begin
  if auth.uid() is null or not public.is_group_member(target_group) then raise exception 'Only approved members can send images'; end if;
  if object_path is null then raise exception 'Select an image'; end if;
  -- Serialise retries with sends/closure and retain original caption on retry.
  select * into g from public.buying_groups where id=target_group for update;
  if not public.is_group_member(target_group) then raise exception 'Only approved members can send images'; end if;
  select * into m from public.group_messages where image_path=object_path;
  if m.id is not null then
    if m.author_id<>auth.uid() or m.group_id<>target_group then raise exception 'This image belongs to another message'; end if;
  else
    if g.state in ('completed','closed','expired','removed') then raise exception 'This group is closed'; end if;
    insert into public.group_messages(group_id,author_id,body,image_path)
      values(target_group,auth.uid(),coalesce(btrim(caption),''),object_path) returning * into m;
  end if;
  select to_jsonb(m) || jsonb_build_object('author',jsonb_build_object('display_name',p.display_name)) into result
    from public.profiles p where p.id=m.author_id;
  return result;
end; $$;
revoke all on function public.send_group_image(uuid,text,text) from public,anon;
grant execute on function public.send_group_image(uuid,text,text) to authenticated;
commit;
