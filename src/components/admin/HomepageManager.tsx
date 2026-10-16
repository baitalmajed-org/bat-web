"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Eye, EyeOff } from "lucide-react";
import HomeSectionModal from "@/components/admin/HomeSectionModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SubmitButton from "@/components/admin/SubmitButton";
import { Thumb } from "@/components/admin/ProductImages";
import { sectionLabel } from "@/lib/homepage-sections";
import { removeHomeImage, saveFeaturedProducts, saveHomeServices } from "@/app/admin/actions/content";
import type { HomepageSection } from "@/types/db";

interface HomepageManagerProps {
  sections: HomepageSection[];
  products: { id: string; name: string; is_featured: boolean; is_published: boolean }[];
  services: { id: string; title: string; show_on_home: boolean; is_published: boolean }[];
}

export default function HomepageManager({
  sections,
  products,
  services,
}: HomepageManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);

  const handleEditSection = (section: HomepageSection) => {
    setSelectedSection(section);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedSection(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Sections Overview Table */}
      <section className="border border-steel-200 bg-white p-5" aria-labelledby="sections-title">
        <div className="mb-4">
          <h2 id="sections-title" className="text-lg font-bold text-steel-900">
            Homepage Sections
          </h2>
          <p className="text-sm text-steel-600">
            Click &quot;Edit section&quot; to configure content, buttons, or imagery in a focused dialog.
          </p>
        </div>

        <div className="overflow-x-auto border border-steel-200">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
              <tr>
                <th className="p-3">Section</th>
                <th className="p-3">Summary / Heading</th>
                <th className="p-3">Order</th>
                <th className="p-3">Image</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr
                  key={s.key}
                  className="border-t border-steel-200 hover:bg-steel-50/50 transition-colors"
                >
                  <td className="p-3">
                    <p className="font-semibold text-steel-900">{sectionLabel(s.key)}</p>
                    <p className="text-xs text-steel-500 font-mono">key: {s.key}</p>
                  </td>
                  <td className="p-3 max-w-xs truncate text-steel-700">
                    {s.heading || (s.key === "trust" ? `${s.items.length} strength items` : "—")}
                  </td>
                  <td className="p-3 text-steel-700">{s.sort_order}</td>
                  <td className="p-3">
                    {s.image_public_id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-9 relative border border-steel-200 overflow-hidden">
                          <Thumb publicId={s.image_public_id} alt={s.image_alt ?? ""} />
                        </div>
                        <ConfirmDialog
                          compact
                          triggerLabel="Remove"
                          confirmLabel="Remove"
                          title="Remove this image?"
                          description="The section falls back to the steel pattern background. The file is deleted from Cloudinary only if nothing else uses it."
                          action={removeHomeImage}
                          fields={{ key: s.key }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-steel-400">Pattern bg</span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.is_visible ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        <Eye className="h-3 w-3" aria-hidden="true" /> Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-steel-500 bg-steel-100 px-2 py-0.5 rounded font-medium">
                        <EyeOff className="h-3 w-3" aria-hidden="true" /> Hidden
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEditSection(s)}
                      className="inline-flex items-center gap-1 text-brand font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded text-sm"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit section
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Featured Products on Homepage */}
      <section className="border border-steel-200 bg-white p-5" aria-labelledby="feat">
        <h2 id="feat" className="mb-1 text-lg font-bold text-steel-900">
          Featured products on homepage
        </h2>
        <p className="mb-4 text-sm text-steel-600">
          Tick the products that appear in the homepage carousel (published products only show).
        </p>
        <form action={saveFeaturedProducts} className="space-y-4">
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto p-2 border border-steel-200 bg-steel-50/50">
            {products.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    name="featured"
                    value={p.id}
                    defaultChecked={p.is_featured}
                    className="h-4 w-4 accent-[#791A30]"
                  />
                  <span className="text-steel-900 font-medium">{p.name}</span>
                  {!p.is_published ? (
                    <span className="text-xs text-steel-500">(draft)</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <SubmitButton pendingLabel="Saving featured products...">
            Save featured products
          </SubmitButton>
        </form>
      </section>

      {/* Services on Homepage */}
      <section className="border border-steel-200 bg-white p-5" aria-labelledby="svc">
        <h2 id="svc" className="mb-1 text-lg font-bold text-steel-900">
          Services on homepage
        </h2>
        <p className="mb-4 text-sm text-steel-600">
          Up to six published services are displayed in the homepage grid.
        </p>
        <form action={saveHomeServices} className="space-y-4">
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto p-2 border border-steel-200 bg-steel-50/50">
            {services.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    name="services"
                    value={s.id}
                    defaultChecked={s.show_on_home}
                    className="h-4 w-4 accent-[#791A30]"
                  />
                  <span className="text-steel-900 font-medium">{s.title}</span>
                  {!s.is_published ? (
                    <span className="text-xs text-steel-500">(draft)</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <SubmitButton pendingLabel="Saving homepage services...">
            Save homepage services
          </SubmitButton>
        </form>
      </section>

      {/* Home Section Modal */}
      <HomeSectionModal
        isOpen={modalOpen}
        onClose={handleClose}
        section={selectedSection}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
