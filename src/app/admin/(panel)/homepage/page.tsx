import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { HomepageSection } from "@/types/db";
import PageHeader from "@/components/admin/PageHeader";
import HomepageManager from "@/components/admin/HomepageManager";

export default async function AdminHomepage() {
  await requireAdmin();
  const supabase = await createClient();
  const [sections, products, services] = await Promise.all([
    supabase.from("homepage_sections").select("*").order("sort_order"),
    supabase.from("products").select("id,name,is_featured,is_published").order("sort_order").order("name"),
    supabase.from("services").select("id,title,show_on_home,is_published").order("sort_order"),
  ]);
  const list = (sections.data ?? []) as HomepageSection[];

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Every section of the home page is editable in focused modal dialogs. Hidden sections do not appear on the website."
      />
      {sections.error ? (
        <p
          role="alert"
          className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          Could not load sections. Have the migrations and seed been applied?
        </p>
      ) : null}

      <HomepageManager
        sections={list}
        products={products.data ?? []}
        services={services.data ?? []}
      />
    </>
  );
}
