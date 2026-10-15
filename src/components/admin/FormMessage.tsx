import type { FormState } from "@/lib/validation/state";

export default function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`border p-3 text-sm ${state.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
      {state.message}
    </p>
  );
}
