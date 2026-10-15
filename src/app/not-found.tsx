import Link from "next/link";

export default function RootNotFound() {
  return (
    <div style={{ padding: "6rem 1rem", textAlign: "center" }}>
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-3 text-steel-600">The page you are looking for does not exist.</p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
