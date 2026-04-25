// app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import TopBar from '@/components/layout/TopBar'
import BrandSidebar from '@/components/dashboard/BrandSidebar'
import InfluencerSidebar from '@/components/dashboard/InfluencerSidebar'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !profile) {
            router.replace('/auth')   // use replace to avoid back‑button issues
        }
    }, [loading, profile, router])

    // ⏳ Initial auth check – show a spinner
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading…</p>
            </div>
        )
    }

    // 🔄 After loading, if no profile → show redirecting message (no blank screen)
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Signing out…</p>
            </div>
        )
    }

    const Sidebar =
        profile.role === 'brand' ? BrandSidebar :
            profile.role === 'influencer' ? InfluencerSidebar :
                profile.role === 'admin' ? AdminSidebar : null

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar />
            <div className="flex flex-1">
                {Sidebar && <Sidebar />}
                <main className="flex-1 bg-gray-50 p-6">{children}</main>
            </div>
        </div>
    )
}