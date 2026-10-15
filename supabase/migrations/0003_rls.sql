-- 0003_rls.sql — Row Level Security. Everything is deny-by-default.

alter table public.admin_users enable row level security;       -- no policies: unreadable via API
alter table public.site_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.pages enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.services enable row level security;
alter table public.media_assets enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_notes enable row level security;

-- Public read of published content ------------------------------------------------
create policy "public reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "public reads visible homepage sections" on public.homepage_sections for select to anon, authenticated using (is_visible);
create policy "public reads pages" on public.pages for select to anon, authenticated using (true);
create policy "public reads active categories" on public.categories for select to anon, authenticated using (is_active);
create policy "public reads published products" on public.products for select to anon, authenticated using (is_published);
create policy "public reads images of published products" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));
create policy "public reads published services" on public.services for select to anon, authenticated using (is_published);

-- Administrators: full access --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_settings','homepage_sections','pages','categories','products','product_images','services','media_assets','inquiries','inquiry_notes']
  loop
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- inquiries / inquiry_notes / media_assets / admin_users have NO anon policy at all:
-- anonymous visitors can neither read nor write them. Inquiries are created only
-- through public.submit_inquiry().

-- Table privileges: defence in depth on top of RLS ------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.site_settings, public.homepage_sections, public.pages, public.categories,
  public.products, public.product_images, public.services to anon;
grant select, insert, update, delete on public.site_settings, public.homepage_sections, public.pages,
  public.categories, public.products, public.product_images, public.services, public.media_assets,
  public.inquiries, public.inquiry_notes to authenticated;
-- Authenticated visitors who are not admins pass the grant but fail every policy (is_admin()).
