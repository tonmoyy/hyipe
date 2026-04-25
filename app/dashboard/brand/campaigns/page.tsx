// app/dashboard/brand/campaigns/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import toast from 'react-hot-toast'

type Campaign = {
    id: string
    title: string
    status: string
    budget: string
}

export default function BrandCampaigns() {
    const { user } = useAuth()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [budget, setBudget] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false

        const loadCampaigns = async () => {
            if (!user) return
            const { data } = await supabase
                .from('campaigns')
                .select('id, title, status, budget')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })

            if (!ignore) {
                setCampaigns((data as Campaign[]) || [])
                setLoading(false)
            }
        }

        loadCampaigns()

        return () => {
            ignore = true
        }
    }, [user])

    const createCampaign = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('campaigns').insert({
            created_by: user!.id,
            title,
            description,
            budget,
            status: 'review',
        })
        if (error) toast.error(error.message)
        else {
            toast.success('Submitted for review!')
            setShowForm(false)
            setTitle('')
            setDescription('')
            setBudget('')
            loadCampaigns()
        }

        // helper to reload campaigns after creation
        async function loadCampaigns() {
            if (!user) return
            const { data } = await supabase
                .from('campaigns')
                .select('id, title, status, budget')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
            setCampaigns((data as Campaign[]) || [])
        }
    }

    if (loading) return <div className="p-6">Loading...</div>

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">My Campaigns</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                >
                    Post a new campaign
                </button>
            </div>

            {campaigns.length === 0 && !showForm && (
                <div className="text-center text-gray-500 mt-10">
                    No campaigns yet. Create your first!
                </div>
            )}

            {campaigns.map((c) => (
                <div
                    key={c.id}
                    className="border p-3 mb-2 rounded flex justify-between items-center bg-white shadow-sm"
                >
                    <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{c.status}</p>
                        <p className="text-sm">Budget: {c.budget}</p>
                    </div>
                    <Link
                        href={`/dashboard/brand/campaigns/${c.id}`}
                        className="text-blue-600 text-sm hover:underline"
                    >
                        View Applicants
                    </Link>
                </div>
            ))}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">New Campaign</h2>
                        <form onSubmit={createCampaign} className="space-y-4">
                            <input
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full border p-2 rounded"
                            />
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="w-full border p-2 rounded"
                            />
                            <input
                                placeholder="Budget (e.g. PKR 50,000)"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                required
                                className="w-full border p-2 rounded"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                                >
                                    Submit for Review
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="border px-4 py-2 rounded hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}