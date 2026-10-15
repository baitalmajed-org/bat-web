"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center" role="alert">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-steel-600">An unexpected error occurred. Please try again. If it continues, contact us by phone or WhatsApp.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
