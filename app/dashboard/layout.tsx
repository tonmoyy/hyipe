// app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import BrandSidebar from '@/components/dashboard/BrandSidebar'
import InfluencerSidebar from '@/components/dashboard/InfluencerSidebar'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Only redirect after loading is done and there's no profile
        if (!loading && !profile) {
            router.push('/auth')
        }
    }, [loading, profile, router])

    // Show a loading state while we're checking the session
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading…</p>
            </div>
        )
    }

    // If there's no profile, we're about to redirect – show nothing
    if (!profile) return null

    const Sidebar =
        profile.role === 'brand' ? BrandSidebar :
            profile.role === 'influencer' ? InfluencerSidebar :
                profile.role === 'admin' ? AdminSidebar : null

    return (
        <div className="flex min-h-screen">
            {Sidebar && <Sidebar />}
            <main className="flex-1 bg-gray-50 p-6">{children}</main>
        </div>
    )
}