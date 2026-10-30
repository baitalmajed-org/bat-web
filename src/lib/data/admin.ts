import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Blog, Category, Inquiry, InquiryNote, MediaAsset, Product, ProductImage, Service } from "@/types/db";

export const ADMIN_PAGE_SIZE = 20;

export async function getDashboardCounts() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [published, drafts, services, fresh, marked, blogs] = await Promise.all([
    supabase.from("products").select("id", head).eq("is_published", true),
    supabase.from("products").select("id", head).eq("is_published", false),
    supabase.from("services").select("id", head).eq("is_published", true),
    supabase.from("inquiries").select("id", head).eq("status", "new"),
    supabase.from("inquiries").select("id", head).in("status", ["read", "marked"]),
    supabase.from("blogs").select("id", head).eq("is_published", true),
  ]);
  const err = [published, drafts, services, fresh, marked, blogs].find((r) => r.error);
  if (err?.error) throw new Error(err.error.message);
  return {
    publishedProducts: published.count ?? 0,
    draftProducts: drafts.count ?? 0,
    publishedServices: services.count ?? 0,
    newInquiries: fresh.count ?? 0,
    markedInquiries: marked.count ?? 0,
    publishedBlogs: blogs.count ?? 0,
  };
}

export async function listAdminProducts(page: number, q: string, status: string) {
  const supabase = await createClient();
  let query = supabase.from("products").select("id,name,slug,is_published,is_featured,is_sample,sort_order,categories(name),product_images(id)", { count: "exact" });
  if (status === "published") query = query.eq("is_published", true);
  if (status === "draft") query = query.eq("is_published", false);
  const term = q.replace(/[,()%*\\:"']/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.order("sort_order").order("name").range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as (Pick<Product, "id" | "name" | "slug" | "is_published" | "is_featured" | "is_sample" | "sort_order"> & { categories: { name: string } | null; product_images: { id: string }[] })[], total: count ?? 0 };
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*,product_images(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const p = data as unknown as Product & { product_images: ProductImage[] };
  p.product_images.sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export async function listAllCategories(): Promise<(Category & { product_count: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*,products(id)").order("sort_order").order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as (Category & { products: { id: string }[] })[]).map(({ products, ...c }) => ({ ...c, product_count: products.length }));
}

export async function listAdminServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("services").select("*").order("sort_order").order("title");
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

export async function getAdminService(id: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Service | null) ?? null;
}

export async function listInquiries(opts: { page: number; status?: string; type?: string; q?: string }) {
  const supabase = await createClient();
  let query = supabase.from("inquiries")
    .select("id,reference,customer_name,customer_email,customer_phone,inquiry_type,related_label,subject,status,created_at", { count: "exact" });
  if (opts.status === "new") {
    query = query.eq("status", "new");
  } else if (opts.status === "marked" || opts.status === "read") {
    query = query.in("status", ["read", "marked"]);
  } else if (opts.status) {
    query = query.eq("status", opts.status);
  }
  if (opts.type) query = query.eq("inquiry_type", opts.type);
  const term = (opts.q ?? "").replace(/[,()%*\\:"']/g, " ").trim();
  if (term) query = query.or(`reference.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,subject.ilike.%${term}%`);
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Pick<Inquiry, "id" | "reference" | "customer_name" | "customer_email" | "customer_phone" | "inquiry_type" | "related_label" | "subject" | "status" | "created_at">[], total: count ?? 0 };
}

export async function getInquiry(id: string): Promise<{ inquiry: Inquiry; notes: InquiryNote[] } | null> {
  const supabase = await createClient();
  const [i, n] = await Promise.all([
    supabase.from("inquiries").select("*").eq("id", id).maybeSingle(),
    supabase.from("inquiry_notes").select("id,inquiry_id,note,created_at").eq("inquiry_id", id).order("created_at", { ascending: false }),
  ]);
  if (i.error) throw new Error(i.error.message);
  if (!i.data) return null;
  return { inquiry: i.data as Inquiry, notes: (n.data ?? []) as InquiryNote[] };
}

export async function listAdminBlogs(opts: { page: number; q?: string; status?: string }) {
  const supabase = await createClient();
  let query = supabase.from("blogs").select("*", { count: "exact" });
  if (opts.status === "published") query = query.eq("is_published", true);
  if (opts.status === "draft") query = query.eq("is_published", false);
  const term = (opts.q ?? "").replace(/[,()%*\\:"']/g, " ").trim();
  if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Blog[], total: count ?? 0 };
}

export async function getAdminBlog(id: string): Promise<Blog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blogs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Blog | null) ?? null;
}

export async function listMedia(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * 24;
  const [{ data, count, error }, refs] = await Promise.all([
    supabase.from("media_assets").select("*", { count: "exact" }).neq("cleanup_status", "deleted").order("created_at", { ascending: false }).range(from, from + 23),
    supabase.rpc("asset_reference_counts"),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>(((refs.data ?? []) as { public_id: string; refs: number }[]).map((r) => [r.public_id, r.refs]));
  return {
    rows: ((data ?? []) as MediaAsset[]).map((m) => ({ ...m, refs: counts.get(m.public_id) ?? 0 })),
    total: count ?? 0,
  };
}
