const TONES: Record<string, string> = {
  new: "bg-brand-100 text-brand-800",
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
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${TONES[status] ?? "bg-steel-100 text-steel-700"}`}>{label ?? status.replace("_", " ")}</span>;
}
