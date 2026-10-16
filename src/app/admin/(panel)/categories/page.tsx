import { requireAdmin } from "@/lib/supabase/auth";
import { listAllCategories } from "@/lib/data/admin";
import PageHeader from "@/components/admin/PageHeader";
import CategoriesManager from "@/components/admin/CategoriesManager";

type SP = Promise<{ edit?: string; created?: string; deleted?: string; error?: string; n?: string }>;

export default async function AdminCategories({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await listAllCategories();

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise products for the catalog filters and website navigation."
      />

      <CategoriesManager
        categories={categories}
        initialEditId={sp.edit ?? null}
      />
    </>
  );
}
