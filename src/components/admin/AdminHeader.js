"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";

// AdminHeader is hidden on auth pages so visitors do not see admin links
// before they have signed in or while they are resetting a password.
export default function AdminHeader() {
  const pathname = usePathname();
  const authPages = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  const isAuthPage = authPages.some((authPath) => pathname.startsWith(authPath));

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link
            className="text-sm font-bold uppercase tracking-[0.18em] text-stone-900"
            href="/admin"
          >
            Admin Panel
          </Link>

          <nav className="flex gap-4 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            <Link className="transition hover:text-stone-900" href="/admin/portfolio">
              Portfolio Photos
            </Link>
            <Link className="transition hover:text-stone-900" href="/admin/investment">
              Investment
            </Link>
            <Link className="transition hover:text-stone-900" href="/admin/site-images">
              Site Images
            </Link>
            <Link className="transition hover:text-stone-900" href="/admin/content">
              Content
            </Link>
            <Link className="transition hover:text-stone-900" href="/admin/faq">
              FAQ
            </Link>
            <Link className="transition hover:text-stone-900" href="/admin/testimonials">
              Testimonials
            </Link>
          </nav>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
