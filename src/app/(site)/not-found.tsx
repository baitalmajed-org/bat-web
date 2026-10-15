import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">404</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-steel-600">The page you are looking for does not exist or is no longer available.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Back to home</Link>
        <Link href="/products" className="btn-outline">Browse products</Link>
      </div>
    </div>
  );
}
