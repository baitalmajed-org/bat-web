"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import LibraryUpload from "./LibraryUpload";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: MediaUploadModalProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
    }
  }, [isOpen]);

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
    onSuccess?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Media Asset"
      description="Upload an image to the media library. It can be linked across products, services, and homepage sections."
      size="md"
      isDirty={isDirty}
      dirtyConfirmMessage="You have selected a file that has not been uploaded yet. Discard?"
    >
      <LibraryUpload
        isModal={true}
        onChange={() => setIsDirty(true)}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
