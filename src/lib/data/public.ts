import "server-only";
import { COMPANY } from "@/lib/config/site";
import { createPublicClient } from "@/lib/supabase/public";
import type { AboutContent, Blog, Category, HomepageSection, PageRow, Product, ProductImage, Service, SiteSettings } from "@/types/db";
import { cachedRead } from "./cache";

export const PAGE_SIZE = 12;

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  company_name: COMPANY.name,
  tagline: COMPANY.tagline,
  logo_public_id: null,
  main_phone: COMPANY.mainPhone,
  whatsapp_number: COMPANY.whatsappNumber,
  secondary_phone: COMPANY.secondaryPhone,
  email: COMPANY.email,
  address_text: COMPANY.location,
  business_hours: null,
  google_maps_url: null,
  google_maps_embed_url: null,
  facebook_url: null,
  instagram_url: null,
  linkedin_url: null,
  youtube_url: null,
  x_url: null,
  announcement_enabled: false,
  announcement_text: null,
  announcement_link_url: null,
  announcement_link_label: null,
  announcement_link_new_tab: false,
  top_bar_enabled: true,
  top_contact_bar_enabled: true,
  seo_default_title: `${COMPANY.name} | Steel Fabrication in Ajman, UAE`,
  seo_default_description: "Industrial steel fabrication and metal works in Ajman, UAE.",
  footer_description: null,
  response_time_commitment: null,
};

const PRODUCT_CARD_COLUMNS =
  "id,name,slug,short_description,is_featured,is_sample,sort_order,categories(name,slug),product_images(id,public_id,alt_text,sort_order)";

export type ProductCard = Pick<Product, "id" | "name" | "slug" | "short_description" | "is_featured" | "is_sample" | "sort_order"> & {
  categories: { name: string; slug: string } | null;
  product_images: Pick<ProductImage, "id" | "public_id" | "alt_text" | "sort_order">[];
};

export function firstImage(p: { product_images?: { public_id: string; alt_text: string | null; sort_order: number }[] }) {
  return [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
}

/** Strip characters that have meaning inside PostgREST filter strings. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export const getSettings = () =>
  cachedRead<SiteSettings>(
    ["settings"],
    ["settings"],
    async () => {
      const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return DEFAULT_SETTINGS;
      const topBar = (data as Record<string, unknown>).top_bar_enabled ?? (data as Record<string, unknown>).top_contact_bar_enabled ?? true;
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        top_bar_enabled: Boolean(topBar),
        top_contact_bar_enabled: Boolean(topBar),
      };
    },
    DEFAULT_SETTINGS,
  );

export const getHomepageSections = () =>
  cachedRead<Record<string, HomepageSection>>(
    ["homepage-sections"],
    ["homepage"],
    async () => {
      const { data, error } = await createPublicClient().from("homepage_sections").select("*").order("sort_order");
      if (error) throw new Error(error.message);
      return Object.fromEntries(((data ?? []) as HomepageSection[]).map((s) => [s.key, s]));
    },
    {},
  );

export const getFeaturedProducts = () =>
  cachedRead<ProductCard[]>(
    ["featured-products"],
    ["catalog"],
    async () => {
      const { data, error } = await createPublicClient()
        .from("products").select(PRODUCT_CARD_COLUMNS)
        .eq("is_published", true).eq("is_featured", true).order("sort_order").limit(12);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ProductCard[];
    },
    [],
  );

export const getCategories = () =>
  cachedRead<Category[]>(
    ["categories"],
    ["catalog"],
    async () => {
      const { data, error } = await createPublicClient()
        .from("categories").select("id,name,slug,description,image_public_id,image_alt,sort_order,is_active")
        .eq("is_active", true).order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    },
    [],
  );

export async function getProducts(opts: { category?: string; q?: string; page: number }): Promise<{ items: ProductCard[]; total: number; failed: boolean }> {
  try {
    const supabase = createPublicClient();
    let query = supabase.from("products").select(PRODUCT_CARD_COLUMNS + ",category_id", { count: "exact" }).eq("is_published", true);
    if (opts.category) {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).eq("is_active", true).maybeSingle();
      if (!cat) return { items: [], total: 0, failed: false };
      query = query.eq("category_id", cat.id);
    }
    const q = opts.q ? sanitizeSearch(opts.q) : "";
    if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`);
    const from = (opts.page - 1) * PAGE_SIZE;
    const { data, count, error } = await query.order("sort_order").order("name").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as ProductCard[], total: count ?? 0, failed: false };
  } catch (e) {
    console.error("[data] products read failed:", e instanceof Error ? e.message : e);
    return { items: [], total: 0, failed: true };
  }
}

export type ProductDetail = Product & { categories: { name: string; slug: string } | null; product_images: ProductImage[] };

export const getProductBySlug = (slug: string) =>
  cachedRead<ProductDetail | null>(
    ["product", slug],
    ["catalog"],
    async () => {
      const { data, error } = await createPublicClient()
        .from("products")
        .select("*,categories(name,slug),product_images(id,product_id,public_id,alt_text,sort_order)")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as ProductDetail | null) ?? null;
    },
    null,
    600,
  );

export const getRelatedProducts = (categoryId: string | null, excludeId: string) =>
  cachedRead<ProductCard[]>(
    ["related-products", categoryId ?? "none", excludeId],
    ["catalog"],
    async () => {
      if (!categoryId) return [];
      const { data, error } = await createPublicClient()
        .from("products").select(PRODUCT_CARD_COLUMNS)
        .eq("is_published", true).eq("category_id", categoryId).neq("id", excludeId).order("sort_order").limit(4);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ProductCard[];
    },
    [],
  );

const SERVICE_COLUMNS = "id,title,slug,short_description,icon,image_public_id,image_alt,show_on_home,is_sample,sort_order";
export type ServiceCard = Pick<Service, "id" | "title" | "slug" | "short_description" | "icon" | "image_public_id" | "image_alt" | "show_on_home" | "is_sample" | "sort_order">;

export const getServices = () =>
  cachedRead<ServiceCard[]>(
    ["services"],
    ["services"],
    async () => {
      const { data, error } = await createPublicClient().from("services").select(SERVICE_COLUMNS).eq("is_published", true).order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as ServiceCard[];
    },
    [],
  );

export const getServiceBySlug = (slug: string) =>
  cachedRead<Service | null>(
    ["service", slug],
    ["services"],
    async () => {
      const { data, error } = await createPublicClient().from("services").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Service | null) ?? null;
    },
    null,
    600,
  );

export const DEFAULT_ABOUT: AboutContent = {
  overview: "", mission: "", vision: "", capabilities: [], quality: "", industries: [], strengths: [],
  founded: "", team_size: "", certifications: [],
};

export const getAboutPage = () =>
  cachedRead<PageRow | null>(
    ["page-about"],
    ["pages"],
    async () => {
      const { data, error } = await createPublicClient().from("pages").select("*").eq("slug", "about").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return { ...(data as PageRow), content: { ...DEFAULT_ABOUT, ...(data as PageRow).content } };
    },
    null,
  );

export async function getSitemapSlugs(): Promise<{ products: { slug: string; updated_at: string }[]; services: { slug: string; updated_at: string }[]; blogs: { slug: string; updated_at: string }[] }> {
  try {
    const supabase = createPublicClient();
    const [p, s, b] = await Promise.all([
      supabase.from("products").select("slug,updated_at").eq("is_published", true),
      supabase.from("services").select("slug,updated_at").eq("is_published", true),
      supabase.from("blogs").select("slug,updated_at").eq("is_published", true),
    ]);
    return { products: p.data ?? [], services: s.data ?? [], blogs: b.data ?? [] };
  } catch {
    return { products: [], services: [], blogs: [] };
  }
}

export const listPublicBlogs = () =>
  cachedRead<Blog[]>(
    ["public-blogs"],
    ["blogs"],
    async () => {
      const { data, error } = await createPublicClient()
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Blog[];
    },
    [],
    300,
  );

export const getPublicBlogBySlug = (slug: string) =>
  cachedRead<Blog | null>(
    [`blog-${slug}`],
    ["blogs"],
    async () => {
      const { data, error } = await createPublicClient()
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Blog | null) ?? null;
    },
    null,
    600,
  );
