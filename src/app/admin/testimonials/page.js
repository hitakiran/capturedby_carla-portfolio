import { redirect } from "next/navigation";
import AdminTestimonialsManager from "@/components/admin/AdminTestimonialsManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Testimonials | Carla Santos Photography",
};

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();

  // This server-side check protects /admin/testimonials if someone visits it
  // directly without being logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <AdminTestimonialsManager />
    </main>
  );
}
