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

export function Check({
  id,
  name,
  label,
  defaultChecked,
  hint,
}: {
  id?: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-2 text-sm font-medium text-steel-900 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-0.5 h-4 w-4 accent-[#791A30] cursor-pointer"
        />
        <span>{label}</span>
      </label>
      {hint ? <p className="mt-1 text-xs text-steel-500 ml-6">{hint}</p> : null}
    </div>
  );
}
