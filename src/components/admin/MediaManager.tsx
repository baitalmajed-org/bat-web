"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Thumb } from "@/components/admin/ProductImages";
import MediaUploadModal from "@/components/admin/MediaUploadModal";
import { deleteMedia } from "@/app/admin/actions/content";
import type { MediaAsset } from "@/types/db";

interface MediaWithRefs extends MediaAsset {
  refs: number;
}

interface MediaManagerProps {
  rows: MediaWithRefs[];
  total: number;
}

export default function MediaManager({ rows, total }: MediaManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel-600 font-medium">
          {total} tracked image{total === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Upload className="h-4 w-4" aria-hidden="true" /> Upload image
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-steel-300 p-12 text-center text-steel-500">
          <p className="font-medium">No images found in library.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-outline mt-3 text-xs"
          >
            Upload your first image
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((m) => (
            <li key={m.id} className="border border-steel-200 bg-white">
              <Thumb publicId={m.public_id} alt={m.alt_text ?? ""} />
              <div className="space-y-2 p-3 text-xs">
                <p className="break-all font-mono text-steel-500">{m.public_id}</p>
                <p>
                  {m.width}×{m.height} · {m.bytes ? `${Math.round(m.bytes / 1024)} KB` : ""} · {m.purpose}
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    status={m.refs > 0 ? "active" : "pending"}
                    label={m.refs > 0 ? `In use (${m.refs})` : "Unused"}
                  />
                  {m.cleanup_status === "delete_failed" ? (
                    <StatusBadge status="failed" label="Delete failed" />
                  ) : null}
                </div>
                {m.cleanup_error ? (
                  <p className="text-red-700">{m.cleanup_error}</p>
                ) : null}
                {m.refs === 0 ? (
                  <ConfirmDialog
                    compact
                    triggerLabel={m.cleanup_status === "delete_failed" ? "Retry delete" : "Delete"}
                    title="Delete this image?"
                    description="It is not used anywhere. It will be permanently removed from Cloudinary."
                    action={deleteMedia}
                    fields={{ publicId: m.public_id }}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal Dialog for Media Upload */}
      <MediaUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
