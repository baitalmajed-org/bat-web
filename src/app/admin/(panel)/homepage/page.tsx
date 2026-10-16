import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { removeHomeImage, saveFeaturedProducts, saveHomeServices } from "@/app/admin/actions/content";
import type { HomepageSection } from "@/types/db";
import PageHeader from "@/components/admin/PageHeader";
import HomeSectionForm from "@/components/admin/HomeSectionForm";
import { sectionLabel } from "@/lib/homepage-sections";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SubmitButton from "@/components/admin/SubmitButton";
import { Thumb } from "@/components/admin/ProductImages";

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
      <PageHeader title="Homepage" description="Every section of the home page is editable here. Hidden sections do not appear on the website." />
      {sections.error ? <p role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">Could not load sections. Have the migrations and seed been applied?</p> : null}

      <div className="space-y-8">
        {list.map((s) => (
          <section key={s.key} className="border border-steel-200 bg-white p-5" aria-labelledby={`h-${s.key}`}>
            <h2 id={`h-${s.key}`} className="mb-4 text-lg">{sectionLabel(s.key)}</h2>
            {s.image_public_id ? (
              <div className="mb-4 flex flex-wrap items-end gap-4"><div className="w-48"><Thumb publicId={s.image_public_id} alt={s.image_alt ?? ""} /></div>
                <ConfirmDialog compact triggerLabel="Remove image" confirmLabel="Remove" title="Remove this image?" description="The section falls back to the steel pattern background. The file is deleted from Cloudinary only if nothing else uses it." action={removeHomeImage} fields={{ key: s.key }} /></div>
            ) : null}
            <HomeSectionForm section={s} />
          </section>
        ))}

        <section className="border border-steel-200 bg-white p-5" aria-labelledby="feat">
          <h2 id="feat" className="mb-1 text-lg">Featured products</h2>
          <p className="mb-4 text-sm text-steel-600">Tick the products that appear in the homepage carousel (published products only show).</p>
          <form action={saveFeaturedProducts} className="space-y-3">
            <ul className="grid gap-2 sm:grid-cols-2">{(products.data ?? []).map((p) => (
              <li key={p.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" value={p.id} defaultChecked={p.is_featured} className="h-4 w-4 accent-[#791A30]" /> {p.name}{!p.is_published ? <span className="text-xs text-steel-500">(draft)</span> : null}</label></li>
            ))}</ul>
            <SubmitButton>Save featured products</SubmitButton>
          </form>
        </section>

        <section className="border border-steel-200 bg-white p-5" aria-labelledby="svc">
          <h2 id="svc" className="mb-1 text-lg">Services on homepage</h2>
          <p className="mb-4 text-sm text-steel-600">Up to six published services are displayed.</p>
          <form action={saveHomeServices} className="space-y-3">
            <ul className="grid gap-2 sm:grid-cols-2">{(services.data ?? []).map((s) => (
              <li key={s.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="services" value={s.id} defaultChecked={s.show_on_home} className="h-4 w-4 accent-[#791A30]" /> {s.title}{!s.is_published ? <span className="text-xs text-steel-500">(draft)</span> : null}</label></li>
            ))}</ul>
            <SubmitButton>Save homepage services</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
