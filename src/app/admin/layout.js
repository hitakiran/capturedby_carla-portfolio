import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell min-h-screen bg-stone-50">
      <AdminHeader />

      {children}
    </div>
  );
}
