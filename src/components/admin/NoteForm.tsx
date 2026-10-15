"use client";

import { useActionState } from "react";
import { addInquiryNote } from "@/app/admin/actions/inquiries";
import { initialFormState } from "@/lib/validation/state";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

export default function NoteForm({ inquiryId }: { inquiryId: string }) {
  const [state, action] = useActionState(addInquiryNote.bind(null, inquiryId), initialFormState);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <label htmlFor="note" className="label">Internal note (never shown to the customer)</label>
      <textarea id="note" name="note" rows={3} required maxLength={4000} className="field" />
      <SubmitButton pendingLabel="Adding...">Add note</SubmitButton>
    </form>
  );
}
