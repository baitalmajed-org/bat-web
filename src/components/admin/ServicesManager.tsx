"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, ExternalLink } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ServiceModal from "@/components/admin/ServiceModal";
import { deleteService, setServicePublished } from "@/app/admin/actions/services";
import type { Service } from "@/types/db";

interface ServicesManagerProps {
  services: Service[];
}

export default function ServicesManager({ services }: ServicesManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-steel-600 font-medium">
          {services.length} total service{services.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New service
        </button>
      </div>

      <div className="overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-steel-100 text-left text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3">Service</th>
              <th className="p-3">Homepage</th>
              <th className="p-3">Order</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-steel-500">
                  No services yet. Click &quot;New service&quot; to create one.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-steel-200 hover:bg-steel-50/50 transition-colors"
                >
                  <td className="p-3">
                    <p className="font-semibold text-steel-900">{s.title}</p>
                    <p className="text-xs text-steel-500">
                      /{s.slug}
                      {s.is_sample ? " · sample" : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    {s.show_on_home ? (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        Shown
                      </span>
                    ) : (
                      <span className="text-xs text-steel-500">Hidden</span>
                    )}
                  </td>
                  <td className="p-3 text-steel-700">{s.sort_order}</td>
                  <td className="p-3">
                    <StatusBadge status={s.is_published ? "published" : "draft"} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="inline-flex items-center gap-1 text-brand font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                      </button>
                      <Link
                        href={`/admin/services/${s.id}/edit`}
                        title="Open full page editor"
                        className="inline-flex items-center gap-0.5 text-xs text-steel-500 hover:text-steel-800 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Page</span>
                      </Link>
                      <form action={setServicePublished}>
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={String(!s.is_published)}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-steel-700 hover:text-brand"
                        >
                          {s.is_published ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Publish
                            </>
                          )}
                        </button>
                      </form>
                      <ConfirmDialog
                        compact
                        triggerLabel="Delete"
                        title={`Delete ${s.title}?`}
                        description="This permanently deletes the service. This cannot be undone."
                        action={deleteService}
                        fields={{ id: s.id }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Services Add & Edit */}
      <ServiceModal
        isOpen={modalOpen}
        onClose={handleClose}
        service={selectedService}
        onSuccess={handleSuccess}
      />
    </>
  );
}
