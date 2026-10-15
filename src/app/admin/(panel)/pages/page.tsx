import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ABOUT } from "@/lib/data/public";
import type { PageRow } from "@/types/db";
import PageHeader from "@/components/admin/PageHeader";
import AboutForm from "@/components/admin/AboutForm";
import { Thumb } from "@/components/admin/ProductImages";

export default async function AdminPages() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").eq("slug", "about").maybeSingle();
  const page: PageRow = data
    ? { ...(data as PageRow), content: { ...DEFAULT_ABOUT, ...(data as PageRow).content } }
    : { slug: "about", title: "About Bait Al Majed Metal Works", meta_description: null, hero_image_public_id: null, content: DEFAULT_ABOUT };
  return (
    <>
      <PageHeader title="About page" description="Fields left empty are hidden on the website. Do not enter unverified facts." />
      {page.hero_image_public_id ? <div className="mb-4 w-56"><Thumb publicId={page.hero_image_public_id} alt="" /></div> : null}
      <div className="border border-steel-200 bg-white p-5"><AboutForm page={page} /></div>
    </>
  );
}
