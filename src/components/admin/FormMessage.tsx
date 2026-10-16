"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/validation/state";
import { useToast } from "./ToastProvider";

export function useFormStateToast(state: FormState) {
  const { toast } = useToast();
  const lastMessageRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!state?.message) return;
    if (lastMessageRef.current === state.message) return;
    lastMessageRef.current = state.message;

    if (state.ok) {
      if (
        state.message.toLowerCase().includes("warning") ||
        state.message.toLowerCase().includes("could not be removed")
      ) {
        toast.warning(state.message);
      } else {
        toast.success(state.message);
      }
    } else {
      toast.error(state.message);
    }
  }, [state, toast]);
}

export default function FormMessage({ state }: { state: FormState }) {
  useFormStateToast(state);
  return null;
}
