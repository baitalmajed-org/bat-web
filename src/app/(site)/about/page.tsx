import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { DEFAULT_ABOUT, getAboutPage, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";
import ContactButtons from "@/components/ui/ContactButtons";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  return buildMetadata({
    title: page?.title ?? "About Us",
    description: page?.meta_description || "About Bait Al Majed Metal Works, a steel fabrication and metal works company in Ajman, UAE.",
    path: "/about",
  });
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (<li key={it} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />{it}</li>))}
      </ul>
    </section>
  );
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getAboutPage(), getSettings()]);
  const c = page?.content ?? DEFAULT_ABOUT;
  const facts = [
    { label: "Established", value: c.founded },
    { label: "Team", value: c.team_size },
  ].filter((f) => f.value);

  return (
    <>
      <section className="border-b border-steel-200 bg-steel-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About" }]} />
          <h1 className="mt-4 text-3xl sm:text-4xl">{page?.title ?? "About Us"}</h1>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-2">
        <div className="space-y-10">
          {c.overview ? <p className="whitespace-pre-line text-lg leading-relaxed text-steel-700">{c.overview}</p> : null}
          {c.mission ? <section><h2 className="text-2xl">Our mission</h2><p className="mt-3 whitespace-pre-line text-steel-700">{c.mission}</p></section> : null}
          {c.vision ? <section><h2 className="text-2xl">Our vision</h2><p className="mt-3 whitespace-pre-line text-steel-700">{c.vision}</p></section> : null}
          {c.quality ? <section><h2 className="text-2xl">Quality and reliability</h2><p className="mt-3 whitespace-pre-line text-steel-700">{c.quality}</p></section> : null}
        </div>
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden bg-steel-100">
            {page?.hero_image_public_id ? <CloudImage publicId={page.hero_image_public_id} alt="" preset="about" sizes="(min-width:1024px) 50vw, 100vw" priority /> : <Placeholder />}
          </div>
          {facts.length > 0 ? (
            <dl className="grid grid-cols-2 gap-px border border-steel-200 bg-steel-200">
              {facts.map((f) => (<div key={f.label} className="bg-white p-4"><dt className="text-xs uppercase tracking-wider text-steel-500">{f.label}</dt><dd className="mt-1 font-semibold">{f.value}</dd></div>))}
            </dl>
          ) : null}
        </div>
      </div>

      {c.capabilities.length + c.industries.length + c.strengths.length + c.certifications.length > 0 ? (
        <section className="bg-steel-50 py-12">
          <div className="container-page grid gap-10 md:grid-cols-2">
            <List title="Capabilities" items={c.capabilities} />
            <List title="Industry applications" items={c.industries} />
            <List title="Company strengths" items={c.strengths} />
            <List title="Certifications" items={c.certifications} />
          </div>
        </section>
      ) : null}

      <section className="steel-pattern text-white">
        <div className="container-page py-14">
          <h2 className="text-3xl !text-white">Need a custom steel solution?</h2>
          <p className="mt-3 max-w-xl text-steel-200">Tell us what you need built. We will review your requirement and get back to you.</p>
          <div className="mt-6"><ContactButtons phone={settings.main_phone} whatsapp={settings.whatsapp_number} /></div>
        </div>
      </section>
    </>
  );
}
