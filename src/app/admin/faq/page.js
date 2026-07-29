import { redirect } from "next/navigation";
import AdminFaqManager from "@/components/admin/AdminFaqManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "FAQ Editor | Carla Santos Photography",
};

export default async function AdminFaqPage() {
  const supabase = await createClient();

  // Keep this admin page protected if someone visits /admin/faq directly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <AdminFaqManager />
    </main>
  );
}
