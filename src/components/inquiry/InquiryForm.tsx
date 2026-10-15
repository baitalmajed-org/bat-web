"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitInquiry } from "@/app/actions/inquiry";
import { initialFormState } from "@/lib/validation/state";

type Props = {
  defaultType?: "product" | "service" | "custom_fabrication" | "general";
  productId?: string;
  serviceId?: string;
  relatedLabel?: string;
  defaultSubject?: string;
  heading?: string;
};

const TYPES = [
  { value: "product", label: "Product inquiry" },
  { value: "service", label: "Service inquiry" },
  { value: "custom_fabrication", label: "Custom fabrication requirement" },
  { value: "general", label: "General question" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
      {pending ? "Sending..." : "Send inquiry"}
    </button>
  );
}

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-steel-500">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}

export default function InquiryForm({ defaultType = "general", productId, serviceId, relatedLabel, defaultSubject, heading }: Props) {
  const [state, action] = useActionState(submitInquiry, initialFormState);
  const [type, setType] = useState<string>(state.values?.type ?? defaultType);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const cls = (k: string) => `field ${e[k] ? "field-error" : ""}`;
  const aria = (k: string) => ({ "aria-invalid": e[k] ? true : undefined, "aria-describedby": e[k] ? `${k}-error` : undefined });

  if (state.ok) {
    return (
      <div className="border border-green-700/30 bg-green-50 p-6" role="status">
        <p className="flex items-center gap-2 text-lg font-semibold text-green-800"><CheckCircle2 className="h-5 w-5" aria-hidden /> Inquiry received</p>
        <p className="mt-2 text-sm text-steel-800">{state.message}</p>
        {state.reference ? (
          <p className="mt-3 text-sm">Your reference: <strong className="font-mono text-brand">{state.reference}</strong>. Please quote it if you contact us again.</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-4" aria-label={heading ?? "Inquiry form"}>
      {state.message ? <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</p> : null}
      {relatedLabel ? <p className="bg-steel-50 p-3 text-sm">Inquiring about: <strong>{relatedLabel}</strong></p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Full name" error={e.name}>
          <input id="name" name="name" type="text" autoComplete="name" required defaultValue={v.name} className={cls("name")} {...aria("name")} />
        </Field>
        <Field id="company" label="Company (optional)" error={e.company}>
          <input id="company" name="company" type="text" autoComplete="organization" defaultValue={v.company} className={cls("company")} {...aria("company")} />
        </Field>
        <Field id="email" label="Email address" error={e.email}>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={v.email} className={cls("email")} {...aria("email")} />
        </Field>
        <Field id="phone" label="Phone number" error={e.phone} hint="Include country code, e.g. +971 50 123 4567">
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required defaultValue={v.phone} className={cls("phone")} {...aria("phone")} />
        </Field>
      </div>

      <Field id="type" label="What is your inquiry about?" error={e.type}>
        <select id="type" name="type" value={type} onChange={(ev) => setType(ev.target.value)} className={cls("type")} {...aria("type")}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      {productId && type === "product" ? <input type="hidden" name="productId" value={productId} /> : null}
      {serviceId && type === "service" ? <input type="hidden" name="serviceId" value={serviceId} /> : null}

      <Field id="subject" label="Subject" error={e.subject}>
        <input id="subject" name="subject" type="text" required defaultValue={v.subject ?? defaultSubject} className={cls("subject")} {...aria("subject")} />
      </Field>
      <Field id="message" label="Message" error={e.message} hint="Tell us what you need: quantities, sizes, materials, timeline.">
        <textarea id="message" name="message" rows={6} required defaultValue={v.message} className={cls("message")} {...aria("message")} />
      </Field>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-steel-700">
          <input type="checkbox" name="privacy" className="mt-1 h-4 w-4 accent-[#791A30]" required {...aria("privacy")} />
          <span>I agree that my details may be used to respond to this inquiry. They are not used for anything else.</span>
        </label>
        {e.privacy ? <p id="privacy-error" className="mt-1 text-sm text-red-700" role="alert">{e.privacy}</p> : null}
      </div>

      <Submit />
    </form>
  );
}
