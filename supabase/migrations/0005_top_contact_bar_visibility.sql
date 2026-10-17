-- 0005_top_contact_bar_visibility.sql — top contact and social bar visibility toggle
alter table public.site_settings
  add column if not exists top_bar_enabled boolean not null default true,
  add column if not exists top_contact_bar_enabled boolean not null default true;
