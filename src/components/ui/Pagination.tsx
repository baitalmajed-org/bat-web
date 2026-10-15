import Link from "next/link";

export default function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link href={hrefFor(page - 1)} className="btn-outline" rel="prev">Previous</Link> : <span />}
      <span className="text-steel-600">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={hrefFor(page + 1)} className="btn-outline" rel="next">Next</Link> : <span />}
    </nav>
  );
}
