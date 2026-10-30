"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Boxes, FileText, Home, Image as ImageIcon, Inbox, LayoutDashboard, Layers, Menu, Newspaper, Settings, Tags, X } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/inquiries", label: "Inquiries", Icon: Inbox },
  { href: "/admin/blogs", label: "Blogs", Icon: Newspaper },
  { href: "/admin/products", label: "Products", Icon: Boxes },
  { href: "/admin/categories", label: "Categories", Icon: Tags },
  { href: "/admin/services", label: "Services", Icon: Layers },
  { href: "/admin/homepage", label: "Homepage", Icon: Home },
  { href: "/admin/pages", label: "About page", Icon: FileText },
  { href: "/admin/media", label: "Media", Icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminNav({ email, logout }: { email: string | null; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto py-3">
      <ul>
        {ITEMS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 border-l-4 px-5 text-sm font-medium ${active ? "border-brand bg-white/10 text-white" : "border-transparent text-steel-300 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 text-xs text-steel-300">
      {email ? <p className="mb-3 truncate" title={email}>{email}</p> : null}
      <form action={logout}><button type="submit" className="btn-outline w-full !border-steel-600 !bg-transparent !text-white hover:!border-white">Log out</button></form>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-steel-900 lg:flex">
        <p className="border-b border-white/10 px-5 py-4 text-sm font-bold text-white">BAM Admin</p>
        {nav}{footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-steel-900 px-4 text-white lg:hidden">
        <span className="text-sm font-bold">BAM Admin</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" aria-expanded={open} className="inline-flex h-11 w-11 items-center justify-center"><Menu className="h-5 w-5" aria-hidden /></button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-steel-900/60" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute left-0 top-0 flex h-full w-72 max-w-[88vw] flex-col bg-steel-900">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-white">
              <span className="text-sm font-bold">BAM Admin</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close admin menu" className="inline-flex h-11 w-11 items-center justify-center"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            {nav}{footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
