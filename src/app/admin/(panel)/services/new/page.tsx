import { requireAdmin } from "@/lib/supabase/auth";
import PageHeader from "@/components/admin/PageHeader";
import ServiceForm from "@/components/admin/ServiceForm";

export default async function NewService() {
  await requireAdmin();
  return (<><PageHeader title="New service" /><div className="border border-steel-200 bg-white p-5"><ServiceForm service={null} /></div></>);
}
