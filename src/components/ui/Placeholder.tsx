import { Factory } from "lucide-react";

/** Shown wherever no image has been uploaded yet. Not a product photo. */
export default function Placeholder({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`steel-pattern flex h-full w-full flex-col items-center justify-center gap-2 text-steel-300 ${className}`} role="img" aria-label={label ?? "No image available"}>
      <Factory className="h-8 w-8 opacity-70" aria-hidden />
      {label ? <span className="px-3 text-center text-xs opacity-80">{label}</span> : null}
    </div>
  );
}
