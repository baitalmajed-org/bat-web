"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import SubmitButton from "./SubmitButton";

type Props = {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  children?: React.ReactNode;
  compact?: boolean;
};

/** Accessible confirmation using the native <dialog> (focus trap + Escape for free). */
export default function ConfirmDialog({ triggerLabel, title, description, confirmLabel = "Delete", action, fields = {}, children, compact }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={compact ? "inline-flex items-center gap-1 text-sm text-red-700 hover:underline" : "btn-outline !border-red-300 !text-red-700 hover:!bg-red-50"}>
        <Trash2 className="h-4 w-4" aria-hidden /> {triggerLabel}
      </button>
      <dialog ref={ref} aria-labelledby="confirm-title" className="w-[min(28rem,92vw)] p-0 backdrop:bg-steel-900/60">
        <form action={action} className="space-y-4 p-6">
          <h2 id="confirm-title" className="text-lg">{title}</h2>
          <p className="text-sm text-steel-700">{description}</p>
          {Object.entries(fields).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v} />))}
          {children}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => ref.current?.close()} className="btn-outline">Cancel</button>
            <SubmitButton className="btn-danger" pendingLabel="Working...">{confirmLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
