import { requireAdmin } from "@/lib/supabase/auth";
import { listAllCategories } from "@/lib/data/admin";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProduct() {
  await requireAdmin();
  const categories = await listAllCategories();
  return (
    <>
      <PageHeader title="New product" description="Save the product first, then add images on the next screen." />
      <div className="border border-steel-200 bg-white p-5"><ProductForm product={null} categories={categories} /></div>
    </>
  );
}
