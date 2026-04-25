
// app/admin/layout.tsx
import AdminSidebar from '@/components/dashboard/AdminSidebar'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-6">{children}</main>
        </div>
    )
}