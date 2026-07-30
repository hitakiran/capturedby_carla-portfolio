import { redirect } from "next/navigation";
import AdminInvestmentManager from "@/components/admin/AdminInvestmentManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Investment | Carla Santos Photography",
};

export default async function AdminInvestmentPage() {
  const supabase = await createClient();

  // This server-side check protects /admin/investment if someone visits it
  // directly without being logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <AdminInvestmentManager />
    </main>
  );
}
