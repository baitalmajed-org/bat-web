"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Modal from "./Modal";
import ServiceForm from "./ServiceForm";
import StatusBadge from "./StatusBadge";
import type { Service } from "@/types/db";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSuccess?: () => void;
}

export default function ServiceModal({
  isOpen,
  onClose,
  service,
  onSuccess,
}: ServiceModalProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
    }
  }, [isOpen, service]);

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
    onSuccess?.();
  };

  const isEdit = Boolean(service);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit: ${service?.title}` : "New Service"}
      description={
        isEdit
          ? "Update service details, specifications, and presentation."
          : "Add a new metal fabrication or engineering service to the website."
      }
      size="xl"
      isDirty={isDirty}
      dirtyConfirmMessage="You have unsaved changes in this service form. Are you sure you want to discard them?"
    >
      <div className="space-y-4">
        {isEdit && service ? (
          <div className="flex items-center justify-between border-b border-steel-200 pb-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={service.is_published ? "published" : "draft"} />
              {service.show_on_home ? (
                <span className="text-xs bg-brand-50 text-brand border border-brand-200 px-2 py-0.5 rounded font-semibold">
                  Featured on Homepage
                </span>
              ) : null}
            </div>
            <Link
              href={`/admin/services/${service.id}/edit`}
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Full Editor Page
            </Link>
          </div>
        ) : null}

        <ServiceForm
          key={service?.id ?? "new"}
          service={service}
          isModal={true}
          onChange={() => setIsDirty(true)}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
}
