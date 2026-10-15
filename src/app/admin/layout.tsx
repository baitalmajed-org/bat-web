import { ADMIN_METADATA } from "@/lib/seo/metadata";

export const metadata = ADMIN_METADATA;
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-steel-50">{children}</div>;
}
