// app/admin/campaigns/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Campaign = {
    id: string
    title: string
    created_by: string
    created_at: string
}

export default function AdminCampaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false

        const fetchCampaigns = async () => {
            const { data } = await supabase
                .from('campaigns')
                .select('id, title, created_by, created_at')
                .eq('status', 'review')
                .order('created_at', { ascending: false })

            if (!ignore) {
                setCampaigns((data as Campaign[]) || [])
                setLoading(false)
            }
        }

        fetchCampaigns()

        return () => {
            ignore = true
        }
    }, [])

    const approve = async (id: string) => {
        const { error } = await supabase
            .from('campaigns')
            .update({ status: 'live' })
            .eq('id', id)

        if (error) toast.error(error.message)
        else {
            toast.success('Campaign approved & live!')
            // Remove from list (or re‑fetch if preferred)
            setCampaigns((prev) => prev.filter((c) => c.id !== id))
        }
    }

    if (loading) return <div className="p-6">Loading campaigns to review…</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Campaign Monitor</h1>

            {campaigns.length === 0 && !loading && (
                <p className="text-gray-500">No campaigns pending review.</p>
            )}

            <div className="space-y-2">
                {campaigns.map((c) => (
                    <div
                        key={c.id}
                        className="border p-4 rounded bg-white shadow-sm flex items-center justify-between"
                    >
                        <div>
                            <p className="font-medium">{c.title}</p>
                            <p className="text-xs text-gray-500">
                                Submitted: {new Date(c.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button
                            onClick={() => approve(c.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                        >
                            Approve
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}