import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin Panel | Carla Santos Photography",
};

const adminSections = [
  {
    title: "Portfolio Photos",
    description: "Upload, filter, and delete portfolio gallery photos.",
    href: "/admin/portfolio",
  },
  {
    title: "Investment",
    description: "Update package names, details, features, and prices.",
    href: "/admin/investment",
  },
  {
    title: "Site Images",
    description: "Replace single-purpose images (hero banner & portrait).",
    href: "/admin/site-images",
  },
  {
    title: "Content",
    description: 'Edit "About me" and "Stats" numbers.',
    href: "/admin/content",
  },
  {
    title: "FAQ",
    description: "Add, edit, hide, reorder, or delete FAQ items.",
    href: "/admin/faq",
  },
  {
    title: "Testimonials",
    description: "Manage client reviews and star ratings.",
    href: "/admin/testimonials",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();

  // This is the page-level safety check for /admin.
  // If there is no signed-in Supabase user, do not render the dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <section>
        <h1 className="text-3xl font-semibold text-stone-900">Admin Panel</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Choose what you want to update.
        </p>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <Link
            className="group rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-stone-300 hover:shadow-md"
            href={section.href}
            key={section.href}
          >
            <h2 className="text-2xl font-semibold text-stone-900">
              {section.title}
            </h2>
            <p className="mt-3 leading-7 text-stone-600">{section.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
