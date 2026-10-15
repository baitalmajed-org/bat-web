# Bait Al Majed Metal Works: Website and Admin CMS

Business website and secure admin panel for **Bait Al Majed Metal Works**, a steel fabrication and metal works company in Ajman, UAE.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS 3 · Supabase (Postgres, Auth, RLS) · Cloudinary · Brevo · Vercel

This is an inquiry-generation site, not a shop: there is no cart, checkout or payment.

---

## 1. What is in the project

| Area | What it does |
|---|---|
| Public site | `/`, `/about`, `/products`, `/products/[slug]`, `/services`, `/services/[slug]`, `/contact`. All content comes from Supabase and is edited in the admin panel. |
| Inquiry system | Server-validated form, saved to Supabase with a reference like `BAM-261015-NMHRCF`, Brevo emails to the admin and the customer, retry of failed emails from the admin. |
| Admin CMS | `/admin`: dashboard, products (with images, preview, publish), categories, services, inquiries (status, notes, follow-up, retry email), homepage sections, About page, media, site settings. |
| Security | Supabase Auth + an `admin_users` allow-list + Row Level Security. Every admin page and server action re-checks authorization on the server. |
| Media | Cloudinary upload with safe replace/cleanup workflow and reference counting. |
| SEO | Per-page metadata, canonical URLs, Open Graph, JSON-LD (LocalBusiness, Product, Breadcrumb), `sitemap.xml`, `robots.txt`. Admin is `noindex` and excluded. |

### Folder structure

```
src/app/(site)/          public pages          src/app/admin/        admin pages + server actions
src/components/          UI (layout, home, products, inquiry, admin)
src/lib/config/site.ts   company contact defaults + phone/WhatsApp link helpers
src/lib/supabase/        server, public (cacheable), browser clients, middleware, admin guard
src/lib/cloudinary/      upload, delete, URL builders, safe replace workflow
src/lib/brevo/           API client, email templates, idempotent notification sender
src/lib/validation/      zod schemas shared by forms and server actions
src/lib/data/            public (cached) and admin data access
supabase/migrations/     0001_schema.sql, 0002_functions.sql, 0003_rls.sql
supabase/seed.sql        editable starter content
tests/                   vitest unit tests
```

---

## 2. Local setup (Windows)

Requirements: **Node.js 20.9 or newer** (22 LTS recommended) and npm.

```bash
npm install
copy .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Without any credentials the site still starts: public pages show the company details from the business card (`src/lib/config/site.ts`) and a hero, but no products or services, and `/admin/login` explains that Supabase is not configured.

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (51) |
| `npm run check` | typecheck + lint + tests |
| `npm run build` / `npm start` | Production build / run |

---

## 3. Supabase setup

1. Create a project at <https://supabase.com> (free tier is fine).
2. **Project Settings → API**: copy the **Project URL** and the **anon / publishable key** into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No service-role key is needed or used.
3. Open **SQL Editor** and run these files **in order**, pasting each one and pressing Run:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_functions.sql`
   3. `supabase/migrations/0003_rls.sql`
   4. `supabase/seed.sql`
4. **Create the first administrator (no public signup exists):**
   1. **Authentication → Users → Add user → Create new user.** Enter an email and a strong password and tick *Auto Confirm User*.
   2. In the SQL Editor run (use your email):
      ```sql
      insert into public.admin_users (user_id)
      select id from auth.users where email = 'you@example.com';
      ```
   3. Sign in at `/admin/login`.
5. **Authentication → Sign In / Providers:** disable *Allow new users to sign up* so nobody else can create accounts. (Even if they could, they would not be administrators: access requires a row in `admin_users`.)

### Verify RLS

In the SQL Editor, test as an anonymous visitor:

```sql
set role anon;
select count(*) from public.inquiries;     -- must fail: permission denied
select count(*) from public.products;      -- only published products
reset role;
```

You can also open `https://YOUR-PROJECT.supabase.co/rest/v1/inquiries?select=*` with the anon key: it must be refused.

> The seed content is **sample data** (`is_sample = true`). Sample products and services show a notice on their public page. Replace, unpublish or delete them in the admin once you have verified details.

---

## 4. Cloudinary setup

1. Create an account at <https://cloudinary.com>.
2. **Dashboard → API Keys**: copy *Cloud name*, *API key*, *API secret* into `.env.local`:
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (same cloud name; only the name is public).
3. Restart `npm run dev`. The admin dashboard warns when Cloudinary is not configured.

How images are handled:

- Uploads happen server-side; the API secret never reaches the browser. JPEG/PNG/WebP up to 8 MB; originals are downscaled to 2400 px.
- The Cloudinary public ID is the file's SHA-1, so uploading the same picture twice reuses the existing asset.
- Delivery uses `f_auto,q_auto` with width presets chosen by Next's `sizes`, through a custom loader (Cloudinary resizes, not Vercel's optimizer).
- **Replacement workflow:** validate → upload new → record in `media_assets` → update the content record → *only then* release the old asset. If the database update fails, the new upload is cleaned up. The old image is never deleted first.
- **Release** deletes from Cloudinary only when `count_asset_references()` reports no remaining reference (logo, hero, product images, services, categories, About page). Failures are stored as `delete_failed` and can be retried from **Admin → Media**.

To verify: upload a product image, replace it, then check the Cloudinary Media Library: only the new asset remains; **Admin → Media** shows it as *In use*.

---

## 5. Brevo setup

1. Create an account at <https://www.brevo.com>.
2. **SMTP & API → API Keys**: create a key and set `BREVO_API_KEY`.
3. **Senders, Domains & Dedicated IPs**: add and verify the sender address you will use (`BREVO_SENDER_EMAIL`). For reliable delivery, authenticate your domain (SPF/DKIM) as Brevo instructs. Emails from an unverified sender are rejected.
4. Set `BREVO_SENDER_NAME` and `ADMIN_NOTIFICATION_EMAIL` (the inbox that receives new inquiries).
5. Submit a test inquiry on `/contact`. You should receive the admin notification, and the customer address should receive the confirmation.

Behavior:

- The inquiry is **saved first**. A Brevo failure never fails the customer's submission.
- Each channel (admin, customer) has its own status: `pending`, `sent` or `failed`. Retry from **Admin → Inquiries → (inquiry) → Retry failed emails**. Only channels that are not already `sent` are sent again, so delivered emails are never duplicated.
- If the Brevo variables are missing the app still runs; the status is recorded as `failed` with "not configured" and the dashboard shows a warning.
- Customer emails promise no response time unless you enter a statement in **Admin → Settings → Response-time statement**.

---

## 6. Deploying to Vercel

1. Push the project to GitHub (do **not** commit `.env.local`; it is git-ignored).
2. On <https://vercel.com>: **Add New → Project → import the repo**. Framework: Next.js (auto-detected).
3. **Settings → Environment Variables**: add every variable from `.env.example` (see the table below).
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://www.yourdomain.ae`) so canonical URLs, the sitemap and `robots.txt` are correct.
5. Deploy. Then: sign in at `/admin/login`, submit a test inquiry, replace a product image, and open `/sitemap.xml` and `/robots.txt`.
6. In Supabase **Authentication → URL Configuration**, set the Site URL to your production URL.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Public site URL, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | anon / publishable key (browser-safe, protected by RLS) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | for images | Cloud name (public) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | **Secret**, server only |
| `CLOUDINARY_FOLDER` | no | Folder prefix, default `bam` |
| `BREVO_API_KEY` | for email | **Secret**, server only |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | for email | Sender must be verified in Brevo |
| `ADMIN_NOTIFICATION_EMAIL` | for email | Receives inquiry notifications |

### Free-tier monitoring

Free-tier limits change, so check each provider's current pricing page rather than relying on figures here.

- **Vercel:** Dashboard → Usage (bandwidth, function invocations). Public pages are cached/ISR; content edits call `revalidateTag`, so no polling is used.
- **Supabase:** Dashboard → Reports / Usage (database size, egress, auth users). Public queries select only needed columns and are cached; admin lists are paginated.
- **Cloudinary:** Dashboard → Usage (storage, transformations, bandwidth). Uploads are downscaled and deduplicated; unused assets can be deleted from **Admin → Media**.
- **Brevo:** Statistics → Transactional (daily send cap). Each inquiry sends two emails.

---

## 7. Managing content

- **Contact details:** Admin → Settings. These feed the header, footer, contact page, WhatsApp/tel links, JSON-LD and emails. Fallback defaults from the business card live in `src/lib/config/site.ts`.
- **Homepage:** Admin → Homepage. Edit each section's text, buttons, image, visibility and order; choose featured products and homepage services. Button destinations accept `whatsapp`, `tel`, a `/path` or an `https://` URL.
- **Products / categories / services:** their own admin pages. Categories that still contain products cannot be deleted without choosing a category to move the products to.
- **About page:** optional facts (established year, team size, certifications, mission, vision) are **hidden until you enter verified information**. Social links and the map appear only when configured.
- **Preview:** each product and service has a **Preview** button that renders drafts before publishing.

---

## 8. Security notes

- Admin access = valid Supabase session **and** a row in `public.admin_users`. Checked by `requireAdmin()` on every admin page and `assertAdmin()` in every server action (a unit test enforces this).
- `middleware.ts` redirects anonymous visitors from `/admin/*` to the login page, but is only a convenience; the real checks are server-side.
- RLS is enabled on every table. Anonymous users can read only published/visible content and have **no** access to inquiries, notes, media records or admin users. Inquiries are created only through the `submit_inquiry()` function, which validates input, snapshots the related item and rate-limits per email (5 per hour).
- `record_notification_result()` can only update a channel that is still `pending`/`failed` and requires the inquiry's UUID **and** reference.
- Spam protection: honeypot field, per-IP in-memory limiter (best effort on serverless), per-email database limit. For heavier abuse, add a CAPTCHA (e.g. Cloudflare Turnstile) in front of `submitInquiry`.
- Admin routes send `X-Robots-Tag: noindex`, have `noindex` metadata, are disallowed in `robots.txt` and absent from the sitemap. They are not linked from the public site.
- User text in emails is HTML-escaped; JSON-LD is serialised safely.

---

## 9. Testing: what has and has not been verified

**Verified in development (no live accounts were available):**

- `npm run typecheck`, `npm run lint` and `npm run build` pass.
- 51 unit tests pass: phone/WhatsApp link building, validation schemas, slugs, rate limiter, email template escaping, migration structure, and static security checks (server-only modules, admin guards on every action/page, no admin links in public navigation, admin excluded from sitemap/robots).
- The three migrations and the seed were **executed on a local PostgreSQL 16** with a stand-in for Supabase's `auth` schema and roles. RLS behavior was tested as anonymous, signed-in non-admin and admin (see section 8 for what was confirmed).
- The production build was run against a mock REST server with sample rows: all public routes return 200, unknown product/service slugs return a real 404, the sitemap lists published items, product pages emit canonical URL and structured data, the carousel arrows scroll, category filter and search change the URL, the inquiry form validates and submits.
- Layouts were checked in headless Chromium at 320, 375, 414, 768, 1024 and 1440 px with no horizontal overflow; the mobile drawer opens, closes on navigation and on Escape.
- Client bundles were scanned: no Brevo/Cloudinary secrets present.

**Not verified (needs your real credentials):**

- Real Supabase Auth login and cookie session refresh.
- Live Cloudinary upload, replacement and deletion.
- Live Brevo delivery, sender verification and retry.
- The admin forms against a real database (they type-check and build, but were not clicked through end to end).
- Deployment on Vercel.
- Accessibility was built in (labels, focus states, dialog semantics, reduced motion) but no automated audit (Lighthouse/axe) was run.

Please walk through the checklist in sections 3 to 6 once your accounts are set up.

---

## 10. Opening in Antigravity IDE

1. Extract the ZIP; you get a single folder `bait-al-majed-metal-works`.
2. In Antigravity: **File → Open Folder…** and choose that folder.
3. Open a terminal in the project root and run `npm install`.
4. Copy `.env.example` to `.env.local` and fill in values (sections 3 to 5).
5. Run `npm run dev`, then `npm run check` before committing changes.

Where to change things:

- Colors: `tailwind.config.ts` (`brand` = logo burgundy `#791A30`, `steel` = grays) and `src/app/globals.css`.
- Company defaults: `src/lib/config/site.ts`.
- Database changes: add a new file `supabase/migrations/0004_*.sql` rather than editing existing ones.
- The official logo files are in `public/brand/` (`logo-on-white.png`, `logo.png`); favicon files are `src/app/icon.png` and `src/app/apple-icon.png`.

### Known limitations and ideas

- Fonts use the system font stack (Segoe UI / Roboto / Helvetica) to avoid runtime downloads; bundle a font with `next/font/local` if you want a specific typeface.
- The hero, product and About images are **not** included: upload your own photos in the admin. Until then, a steel-pattern placeholder is shown. No third-party photography is bundled.
- The per-IP rate limiter is in-memory (per serverless instance). The database limit per email is authoritative but can be sidestepped by varying the email address, so consider CAPTCHA if spam appears.
- Pages are cached for up to an hour and refreshed immediately when content is saved in the admin. If the database is unreachable during a build, the affected pages show empty states until they next revalidate.
- Admin lists are paginated, but there is no drag-and-drop reordering: use the numeric *Display order* fields.
