import type { Spec } from "@/types/db";

export default function SpecTable({ specs }: { specs: Spec[] }) {
  if (specs.length === 0) return null;
  return (
    <table className="w-full border border-steel-200 text-sm">
      <caption className="sr-only">Specifications</caption>
      <tbody>
        {specs.map((s) => (
          <tr key={s.label} className="border-b border-steel-200 last:border-0">
            <th scope="row" className="w-2/5 bg-steel-50 px-4 py-2.5 text-left font-medium">{s.label}</th>
            <td className="px-4 py-2.5">{s.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
