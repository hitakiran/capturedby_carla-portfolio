import { redirect } from "next/navigation";
import AdminSiteImagesManager from "@/components/admin/AdminSiteImagesManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Single- Purpose Photos | Carla Santos Photography",
};

export default async function AdminSiteImagesPage() {
  const supabase = await createClient();

  // This server-side check keeps the page protected if someone visits
  // /admin/site-images directly while logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <AdminSiteImagesManager />
    </main>
  );
}
