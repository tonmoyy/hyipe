'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import Link from 'next/link'

// 👇 Fix: campaigns is an array from Supabase
type App = {
    id: string
    campaign_id: string
    status: string
    campaigns: { title: string }[]   // array, not object
}

export default function InfluencerProjects() {
    const { user } = useAuth()
    const [apps, setApps] = useState<App[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        supabase
            .from('applications')
            .select('id, campaign_id, status, campaigns(title)')
            .eq('influencer_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                // data is already an array of objects matching our App type
                setApps((data as App[]) || [])
                setLoading(false)
            })
    }, [user])

    if (loading) return <div className="p-6">Loading...</div>

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">My Projects</h1>
                <Link
                    href="/marketplace"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Search for new projects
                </Link>
            </div>

            {apps.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    You haven’t applied to any campaigns yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {apps.map((app) => (
                        <div
                            key={app.id}
                            className="border p-4 rounded flex justify-between items-center bg-white shadow-sm"
                        >
                            <div>
                                {/* ✅ Access first element of the array */}
                                <p className="font-medium">
                                    {app.campaigns?.[0]?.title || 'Untitled'}
                                </p>
                                <p className="text-sm capitalize text-gray-500">{app.status}</p>
                            </div>
                            <Link
                                href={`/marketplace/${app.campaign_id}`}
                                className="text-blue-600 text-sm hover:underline"
                            >
                                View
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}