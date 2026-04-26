'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import Link from 'next/link'
import ApplyModal from './ApplyModal'

type Campaign = {
    id: string
    title: string
    description: string
    budget: string
    created_by: string
}

export default function CampaignDetail() {
    const { id } = useParams()
    const { profile, user, signOut } = useAuth()
    const router = useRouter()

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [showApply, setShowApply] = useState(false)
    const [alreadyApplied, setAlreadyApplied] = useState(false)

    // ⚠️ Guard – send to login if not authenticated
    useEffect(() => {
        if (user === null) {
            router.push('/auth')
        }
    }, [user, router])

    // Fetch campaign + check existing application
    useEffect(() => {
        if (!user) return

        supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data }) => setCampaign(data))

        if (profile?.role === 'influencer') {
            supabase
                .from('applications')
                .select('id')
                .eq('campaign_id', id)
                .eq('influencer_id', profile.id)
                .maybeSingle()
                .then(({ data }) => setAlreadyApplied(!!data))
        }
    }, [id, profile, user])

    // Don't render anything until auth loaded
    if (!user) return null

    if (!campaign) return <div className="p-6">Loading...</div>

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold">Campaign Details</h1>
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

            {/* Campaign content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-3xl font-bold">{campaign.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-gray-700">{campaign.description}</p>
                <p className="mt-4 font-semibold text-lg">
                    Budget: <span className="text-green-700">{campaign.budget}</span>
                </p>

                {profile?.role === 'influencer' && (
                    <div className="mt-6">
                        {alreadyApplied ? (
                            <span className="inline-block bg-gray-100 text-gray-500 px-5 py-2 rounded-lg font-medium">
                ✓ You have already applied
              </span>
                        ) : (
                            <button
                                onClick={() => setShowApply(true)}
                                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <Link
                        href="/marketplace"
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        ← Back to Marketplace
                    </Link>
                </div>
            </div>

            {showApply && (
                <ApplyModal
                    campaignId={campaign.id}
                    onClose={() => setShowApply(false)}
                    onSuccess={() => setAlreadyApplied(true)}
                />
            )}
        </div>
    )
}