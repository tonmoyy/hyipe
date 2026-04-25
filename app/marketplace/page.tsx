'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Campaign = { id: string; title: string; description: string; budget: string; created_at: string }

export default function Marketplace() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('campaigns').select('*').eq('status', 'live').order('created_at', { ascending: false })
            .then(({ data }) => {
                setCampaigns((data as Campaign[]) || [])
                setLoading(false)
            })
    }, [])

    const filtered = campaigns.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="p-6">Loading campaigns...</div>

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
            <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full border p-2 rounded mb-6"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            {filtered.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">No campaigns found.</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filtered.map(c => (
                        <Link key={c.id} href={`/marketplace/${c.id}`} className="border p-4 rounded hover:shadow-lg transition">
                            <h2 className="font-bold text-lg">{c.title}</h2>
                            <p className="text-sm text-gray-500 mt-1">{c.description?.slice(0, 100)}</p>
                            <p className="mt-2 font-semibold">Budget: {c.budget}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}