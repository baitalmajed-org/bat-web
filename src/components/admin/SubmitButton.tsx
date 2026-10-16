"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}

export default function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel = "Saving...",
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isBusy = pending || Boolean(disabled);

  return (
    <button type="submit" disabled={isBusy} className={className}>
      {isBusy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin inline-block mr-1.5" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
