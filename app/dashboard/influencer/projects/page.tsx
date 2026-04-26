// app/dashboard/influencer/projects/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import Link from 'next/link'

type Application = {
    id: string
    campaign_id: string
    status: string
}

type Campaign = {
    id: string
    title: string
    created_by: string
}

export default function InfluencerProjects() {
    const { user } = useAuth()
    const [apps, setApps] = useState<Application[]>([])
    const [campaigns, setCampaigns] = useState<Record<string, Campaign>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const load = async () => {
            // 1️⃣ Fetch all my applications
            const { data: applications } = await supabase
                .from('applications')
                .select('id, campaign_id, status')
                .eq('influencer_id', user.id)
                .order('created_at', { ascending: false })

            const apps = (applications as Application[]) || []

            // 2️⃣ Collect unique campaign IDs
            const campaignIds = [...new Set(apps.map((a) => a.campaign_id))]

            // 3️⃣ Fetch campaigns separately (no join headaches)
            if (campaignIds.length > 0) {
                const { data: campaignsData } = await supabase
                    .from('campaigns')
                    .select('id, title, created_by')
                    .in('id', campaignIds)

                const map: Record<string, Campaign> = {}
                ;(campaignsData as Campaign[])?.forEach((c) => {
                    map[c.id] = c
                })
                setCampaigns(map)
            }

            setApps(apps)
            setLoading(false)
        }

        load()
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
                    {apps.map((app) => {
                        const campaign = campaigns[app.campaign_id]
                        return (
                            <div
                                key={app.id}
                                className="border p-4 rounded flex justify-between items-center bg-white shadow-sm"
                            >
                                <div>
                                    <p className="font-medium">
                                        {campaign?.title || 'Untitled Campaign'}
                                    </p>
                                    <p className="text-sm capitalize text-gray-500">{app.status}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/marketplace/${app.campaign_id}`}
                                        className="text-blue-600 text-sm hover:underline"
                                    >
                                        View
                                    </Link>
                                    {campaign?.created_by && (
                                        <Link
                                            href={`/dashboard/influencer/inbox?partner=${campaign.created_by}`}
                                            className="text-green-600 text-sm hover:underline"
                                        >
                                            Message Brand
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}