"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions/content";
import { initialFormState } from "@/lib/validation/state";
import type { SiteSettings } from "@/types/db";
import Field from "./Field";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function SettingsForm({ s }: { s: SiteSettings }) {
  const [state, action] = useActionState(saveSettings, initialFormState);
  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  const t = (k: keyof SiteSettings, label: string, extra?: { hint?: string; type?: string }) => (
    <Field id={k} label={label} error={e[k]} hint={extra?.hint}>
      <input id={k} name={k} type={extra?.type ?? "text"} defaultValue={(s[k] as string | null) ?? ""} className={cls(k)} />
    </Field>
  );
  return (
    <form action={action} className="space-y-8">
      <FormMessage state={state} />
      <fieldset className="space-y-4"><legend className="mb-2 text-lg font-bold">Company</legend>
        <div className="grid gap-4 sm:grid-cols-2">{t("company_name", "Company name")}{t("tagline", "Tagline")}</div>
        <Field id="logo" label="Replace logo (optional)" hint="Leave empty to keep the current logo. The bundled official logo is used until you upload one."><input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="field" /></Field>
      </fieldset>
      <fieldset className="space-y-4"><legend className="mb-2 text-lg font-bold">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {t("main_phone", "Main telephone", { type: "tel" })}{t("whatsapp_number", "WhatsApp number", { type: "tel" })}
          {t("secondary_phone", "Secondary telephone", { type: "tel" })}{t("email", "Email", { type: "email" })}
          {t("address_text", "Location / address")}
        </div>
        <Field id="business_hours" label="Business hours" hint="Leave empty to hide. Shown on the footer and contact page.">
          <textarea id="business_hours" name="business_hours" rows={2} defaultValue={s.business_hours ?? ""} className={cls("business_hours")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {t("google_maps_url", "Google Maps link", { hint: "Verified https:// link to your location." })}
          {t("google_maps_embed_url", "Google Maps embed URL (optional)", { hint: "The src= value from Google Maps > Share > Embed." })}
        </div>
        {t("response_time_commitment", "Response-time statement (optional)", { hint: "Included in customer confirmation emails. Only enter a commitment you will keep." })}
      </fieldset>
      <fieldset className="space-y-4"><legend className="mb-2 text-lg font-bold">Social media</legend>
        <p className="text-sm text-steel-600">Only links you enter appear on the website.</p>
        <div className="grid gap-4 sm:grid-cols-2">{t("facebook_url", "Facebook URL")}{t("instagram_url", "Instagram URL")}{t("linkedin_url", "LinkedIn URL")}{t("youtube_url", "YouTube URL")}</div>
      </fieldset>
      <fieldset className="space-y-4"><legend className="mb-2 text-lg font-bold">SEO and footer</legend>
        {t("seo_default_title", "Default page title", { hint: "Up to 70 characters." })}
        {t("seo_default_description", "Default meta description", { hint: "Up to 170 characters." })}
        <Field id="footer_description" label="Footer description" error={e.footer_description}><textarea id="footer_description" name="footer_description" rows={3} defaultValue={s.footer_description ?? ""} className={cls("footer_description")} /></Field>
      </fieldset>
      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
