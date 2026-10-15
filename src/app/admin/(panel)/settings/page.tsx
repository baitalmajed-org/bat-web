import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/lib/data/public";
import { resetLogo } from "@/app/admin/actions/content";
import type { SiteSettings } from "@/types/db";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Thumb } from "@/components/admin/ProductImages";

export default async function AdminSettings() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s = (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
  return (
    <>
      <PageHeader title="Site settings" description="Contact details here are used across the whole website, links and emails." />
      {s.logo_public_id ? (
        <div className="mb-4 flex flex-wrap items-end gap-4"><div className="w-48 bg-white"><Thumb publicId={s.logo_public_id} alt={s.company_name} /></div>
          <ConfirmDialog compact triggerLabel="Use official bundled logo" confirmLabel="Switch" title="Switch back to the bundled logo?" description="Your uploaded logo is removed from Cloudinary if nothing else uses it." action={resetLogo} /></div>
      ) : <p className="mb-4 text-sm text-steel-600">Currently using the bundled official logo.</p>}
      <div className="border border-steel-200 bg-white p-5"><SettingsForm s={s} /></div>
    </>
  );
}
