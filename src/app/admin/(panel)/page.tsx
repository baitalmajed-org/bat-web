import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { getDashboardCounts } from "@/lib/data/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import PageHeader from "@/components/admin/PageHeader";

export default async function Dashboard() {
  await requireAdmin();
  let counts: Awaited<ReturnType<typeof getDashboardCounts>> | null = null;
  try {
    counts = await getDashboardCounts();
  } catch (e) {
    console.error("[admin] dashboard counts failed", e instanceof Error ? e.message : e);
  }

  const cards = counts ? [
    { label: "New inquiries", value: counts.newInquiries, href: "/admin/inquiries?status=new", alert: counts.newInquiries > 0 },
    { label: "Marked inquiries", value: counts.markedInquiries, href: "/admin/inquiries?status=read" },
    { label: "Published blogs", value: counts.publishedBlogs, href: "/admin/blogs" },
    { label: "Published products", value: counts.publishedProducts, href: "/admin/products?status=published" },
    { label: "Draft products", value: counts.draftProducts, href: "/admin/products?status=draft" },
    { label: "Published services", value: counts.publishedServices, href: "/admin/services" },
  ] : [];

  const warnings = [
    !isCloudinaryConfigured() && "Cloudinary is not configured: image uploads are disabled.",
  ].filter((w): w is string => Boolean(w));

  return (
    <>
      <PageHeader title="Dashboard" description="Live figures from your database." />
      {warnings.map((w) => (
        <p key={w} role="alert" className="mb-3 flex items-start gap-2 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {w}
        </p>
      ))}
      {!counts ? (
        <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Could not load figures. Check the Supabase connection and that all migrations have been applied.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.label}>
              <Link
                href={c.href}
                className={`block border bg-white p-5 transition-colors hover:border-brand ${
                  c.alert ? "border-blue-400 bg-blue-50/20" : "border-steel-200"
                }`}
              >
                <p className="text-sm text-steel-600">{c.label}</p>
                <p className={`mt-2 text-4xl font-bold ${c.alert ? "text-blue-700" : "text-steel-900"}`}>
                  {c.value}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
