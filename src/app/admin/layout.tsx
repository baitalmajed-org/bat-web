import { Suspense } from "react";
import { ADMIN_METADATA } from "@/lib/seo/metadata";
import { ToastProvider } from "@/components/admin/ToastProvider";
import ToastUrlListener from "@/components/admin/ToastUrlListener";

export const metadata = ADMIN_METADATA;
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <ToastUrlListener />
      </Suspense>
      <div className="min-h-screen bg-steel-50">{children}</div>
    </ToastProvider>
  );
}
