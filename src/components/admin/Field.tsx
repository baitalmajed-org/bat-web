export default function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-steel-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#791A30]" /> {label}
    </label>
  );
}
