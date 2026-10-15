export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Loading products">
      <div className="h-10 w-72 animate-pulse bg-steel-100" />
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (<li key={i} className="h-72 animate-pulse bg-steel-100" />))}
      </ul>
    </div>
  );
}
