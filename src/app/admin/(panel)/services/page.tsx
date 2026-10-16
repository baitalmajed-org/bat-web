import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { listAdminServices } from "@/lib/data/admin";
import PageHeader from "@/components/admin/PageHeader";
import ServicesManager from "@/components/admin/ServicesManager";

export default async function AdminServices() {
  await requireAdmin();
  const services = await listAdminServices();

  return (
    <>
      <PageHeader
        title="Services"
        description={`${services.length} total fabrication and engineering services.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/services/new"
              className="btn-outline !py-2 text-xs"
              title="Open full page service creator"
            >
              Full Page Editor
            </Link>
          </div>
        }
      />

      <ServicesManager services={services} />
    </>
  );
}
