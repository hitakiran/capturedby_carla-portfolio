import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Admin Login | Carla Santos Photography",
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-5 py-16">
      <div className="admin-login-lace-strip" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
          Captured by Carla
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Admin login</h1>

        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
