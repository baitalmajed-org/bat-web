-- 0001_schema.sql — core tables, constraints and indexes
create extension if not exists pgcrypto;

-- Generic updated_at trigger ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Administrators (single-company CMS; no public signup) ----------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Site settings (singleton row) ----------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default 'Bait Al Majed Metal Works',
  tagline text,
  logo_public_id text,
  main_phone text not null default '+971 54 716 7455',
  whatsapp_number text not null default '+971 54 716 7455',
  secondary_phone text default '00971 55 754 5936',
  email text not null default 'info@bammetaluae.com',
  address_text text default 'Ajman, United Arab Emirates',
  business_hours text,
  google_maps_url text,
  google_maps_embed_url text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  seo_default_title text default 'Bait Al Majed Metal Works | Steel Fabrication in Ajman, UAE',
  seo_default_description text default 'Industrial steel fabrication and metal works in Ajman, UAE. Custom welding and fabrication, material handling and construction equipment.',
  footer_description text,
  response_time_commitment text,
  updated_at timestamptz not null default now()
);

-- Homepage sections -----------------------------------------------------------
create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('hero','featured_products','services','about','trust','contact_cta')),
  eyebrow text,
  heading text,
  body text,
  image_public_id text,
  image_alt text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  items jsonb not null default '[]'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Static pages (About etc.) ----------------------------------------------------
create table public.pages (
  slug text primary key check (slug in ('about')),
  title text not null,
  meta_description text,
  hero_image_public_id text,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Categories -------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_public_id text,
  image_alt text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_active_sort_idx on public.categories (is_active, sort_order);

-- Products ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (char_length(short_description) <= 300),
  description text,
  specifications jsonb not null default '[]'::jsonb,   -- [{label, value}]
  applications text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_published_sort_idx on public.products (is_published, sort_order, name);
create index products_category_idx on public.products (category_id);
create index products_featured_idx on public.products (is_featured) where is_featured;
create index products_search_idx on public.products using gin (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,''))
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  public_id text not null,
  secure_url text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);
create index product_images_public_id_idx on public.product_images (public_id);

-- Services ---------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (char_length(short_description) <= 300),
  description text,
  icon text,                                   -- lucide icon key, see src/components/ui/ServiceIcon.tsx
  image_public_id text,
  image_alt text,
  specifications jsonb not null default '[]'::jsonb,
  applications text[] not null default '{}',
  show_on_home boolean not null default true,
  is_published boolean not null default false,
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_published_sort_idx on public.services (is_published, sort_order);

-- Media tracking (Cloudinary) ----------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  secure_url text not null,
  resource_type text not null default 'image',
  format text,
  bytes integer,
  width integer,
  height integer,
  alt_text text,
  purpose text,                                 -- product | service | homepage | logo | category | page
  cleanup_status text not null default 'active' check (cleanup_status in ('active','pending_delete','deleted','delete_failed')),
  cleanup_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index media_assets_status_idx on public.media_assets (cleanup_status);

-- Inquiries ----------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(customer_email) <= 254),
  customer_phone text not null check (char_length(customer_phone) between 6 and 30),
  company_name text check (char_length(company_name) <= 160),
  inquiry_type text not null check (inquiry_type in ('product','service','custom_fabrication','general')),
  product_id uuid references public.products (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  related_label text,                           -- snapshot of product/service name
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new','in_progress','replied','closed')),
  follow_up_at timestamptz,
  admin_email_status text not null default 'pending' check (admin_email_status in ('pending','sent','failed','skipped')),
  customer_email_status text not null default 'pending' check (customer_email_status in ('pending','sent','failed','skipped')),
  admin_email_error text,
  customer_email_error text,
  email_attempts integer not null default 0,
  last_email_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_created_idx on public.inquiries (created_at desc);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_type_idx on public.inquiries (inquiry_type);
create index inquiries_email_rate_idx on public.inquiries (lower(customer_email), created_at desc);
create index inquiries_email_failed_idx on public.inquiries (created_at desc)
  where admin_email_status = 'failed' or customer_email_status = 'failed';

create table public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  note text not null check (char_length(note) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at desc);

-- updated_at triggers -------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_settings','homepage_sections','pages','categories','products','services','media_assets','inquiries']
  loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
