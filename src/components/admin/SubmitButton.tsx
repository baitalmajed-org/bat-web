"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SubmitButton({ children, className = "btn-primary", pendingLabel = "Saving..." }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {pendingLabel}</> : children}
    </button>
  );
}
