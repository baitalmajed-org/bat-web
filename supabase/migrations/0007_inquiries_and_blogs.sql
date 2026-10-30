-- 0007_inquiries_and_blogs.sql — Inquiries status update (new/read/marked) and Blogs management
-- 1. Inquiries: allow 'read' and 'marked' status
alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries add constraint inquiries_status_check
  check (status in ('new', 'read', 'marked', 'in_progress', 'replied', 'closed'));

-- 2. Blogs table
create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text check (char_length(excerpt) <= 500),
  content text not null check (char_length(content) >= 10),
  image_public_id text,
  image_alt text,
  is_published boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blogs_published_idx on public.blogs (is_published, published_at desc);
create index if not exists blogs_slug_idx on public.blogs (slug);

-- updated_at trigger
drop trigger if exists blogs_set_updated_at on public.blogs;
create trigger blogs_set_updated_at
  before update on public.blogs
  for each row execute function public.set_updated_at();

-- 3. Cloudinary reference counting: include blogs table
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
    (select count(*) from public.services where image_public_id = p_public_id) +
    (select count(*) from public.blogs where image_public_id = p_public_id)
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
      union all select image_public_id from public.blogs
    ) u where u.pid is not null group by u.pid;
end $$;

-- 4. Row Level Security for blogs
alter table public.blogs enable row level security;

drop policy if exists "public reads published blogs" on public.blogs;
create policy "public reads published blogs" on public.blogs
  for select to anon, authenticated using (is_published);

drop policy if exists "admin all blogs" on public.blogs;
create policy "admin all blogs" on public.blogs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. Privileges
grant select on public.blogs to anon;
grant select, insert, update, delete on public.blogs to authenticated;
