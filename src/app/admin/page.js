import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard | BanglaTrust-CoT",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <AdminDashboard />
    </div>
  );
}
