-- 0004_announcement_and_social.sql — announcement bar and X (Twitter) social link
alter table public.site_settings
  add column if not exists announcement_enabled boolean not null default false,
  add column if not exists announcement_text text,
  add column if not exists announcement_link_url text,
  add column if not exists announcement_link_label text,
  add column if not exists announcement_link_new_tab boolean not null default false,
  add column if not exists x_url text;
