const TONES: Record<string, string> = {
  new: "bg-blue-100 text-blue-900 border border-blue-300 font-bold uppercase tracking-wider text-[11px]",
  read: "bg-steel-200 text-steel-700",
  marked: "bg-steel-200 text-steel-700",
  in_progress: "bg-amber-100 text-amber-900",
  replied: "bg-green-100 text-green-800",
  closed: "bg-steel-200 text-steel-700",
  sent: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-900",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-steel-200 text-steel-700",
  published: "bg-green-100 text-green-800",
  draft: "bg-steel-200 text-steel-700",
  active: "bg-green-100 text-green-800",
  inactive: "bg-steel-200 text-steel-700",
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const displayLabel = label ?? (status === "read" ? "Marked as read" : status === "marked" ? "Marked" : status.replace("_", " "));
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-sm ${TONES[status] ?? "bg-steel-100 text-steel-700"}`}>
      {displayLabel}
    </span>
  );
}
