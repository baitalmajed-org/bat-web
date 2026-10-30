-- 0006_hero_mobile_image.sql — separate mobile background image for homepage hero section
alter table public.homepage_sections
  add column if not exists mobile_image_public_id text,
  add column if not exists mobile_image_alt text;

-- Update asset reference counting functions so mobile hero images are protected from accidental deletion
create or replace function public.count_asset_references(p_public_id text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare v_count integer;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select
    (select count(*) from public.site_settings where logo_public_id = p_public_id) +
    (select count(*) from public.homepage_sections where image_public_id = p_public_id) +
    (select count(*) from public.homepage_sections where mobile_image_public_id = p_public_id) +
    (select count(*) from public.pages where hero_image_public_id = p_public_id) +
    (select count(*) from public.categories where image_public_id = p_public_id) +
    (select count(*) from public.product_images where public_id = p_public_id) +
    (select count(*) from public.services where image_public_id = p_public_id)
  into v_count;
  return v_count;
end $$;

create or replace function public.asset_reference_counts()
returns table (public_id text, refs integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select u.pid, count(*)::integer from (
      select logo_public_id as pid from public.site_settings
      union all select image_public_id from public.homepage_sections
      union all select mobile_image_public_id from public.homepage_sections
      union all select hero_image_public_id from public.pages
      union all select image_public_id from public.categories
      union all select public_id from public.product_images
      union all select image_public_id from public.services
    ) u where u.pid is not null group by u.pid;
end $$;
