"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import HomeSectionForm from "./HomeSectionForm";
import { sectionLabel } from "@/lib/homepage-sections";
import type { HomepageSection } from "@/types/db";

interface HomeSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: HomepageSection | null;
  onSuccess?: () => void;
}

export default function HomeSectionModal({
  isOpen,
  onClose,
  section,
  onSuccess,
}: HomeSectionModalProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
    }
  }, [isOpen, section]);

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
    onSuccess?.();
  };

  if (!section) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Section: ${sectionLabel(section.key)}`}
      description="Update copywriting, buttons, display order, imagery, and visibility for this homepage section."
      size="lg"
      isDirty={isDirty}
      dirtyConfirmMessage="You have unsaved changes in this homepage section. Are you sure you want to discard them?"
    >
      <HomeSectionForm
        key={section.key}
        section={section}
        isModal={true}
        onChange={() => setIsDirty(true)}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
