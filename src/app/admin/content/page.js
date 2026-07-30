import { redirect } from "next/navigation";
import AdminContentEditor from "@/components/admin/AdminContentEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Content Editor | Carla Santos Photography",
};

export default async function AdminContentPage() {
  const supabase = await createClient();

  // Keep the content editor protected if someone visits /admin/content directly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <AdminContentEditor />
    </main>
  );
}
