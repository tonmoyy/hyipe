// app/marketplace/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Campaign = { id: string; title: string; description: string; budget: string; created_at: string }

export default function Marketplace() {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    // ✅ Auth guard – redirect to login if not authenticated
    useEffect(() => {
        if (user === null) {
            router.push('/auth')
        }
    }, [user, router])

    useEffect(() => {
        supabase
            .from('campaigns')
            .select('*')
            .eq('status', 'live')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setCampaigns((data as Campaign[]) || [])
                setLoading(false)
            })
    }, [])

    const filtered = campaigns.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    )

    // While auth state is loading (user === undefined) or user is null, show nothing
    if (!user) return null

    if (loading) return <div className="p-6">Loading campaigns...</div>

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Top navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold">Marketplace</h1>
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                        Home
                    </Link>
                    <button
                        onClick={() => {
                            signOut()
                            router.push('/')
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full border p-2 rounded mb-6"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {/* Campaign list */}
            {filtered.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">No campaigns found.</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filtered.map(c => (
                        <Link
                            key={c.id}
                            href={`/marketplace/${c.id}`}
                            className="border p-4 rounded hover:shadow-lg transition"
                        >
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