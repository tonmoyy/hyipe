'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import ApplyModal from './ApplyModal'

type Campaign = { id: string; title: string; description: string; budget: string; created_by: string }

export default function CampaignDetail() {
    const { id } = useParams()
    const { profile } = useAuth()
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [showApply, setShowApply] = useState(false)
    const [alreadyApplied, setAlreadyApplied] = useState(false)

    useEffect(() => {
        supabase.from('campaigns').select('*').eq('id', id).single().then(({ data }) => setCampaign(data))
        if (profile?.role === 'influencer') {
            supabase.from('applications').select('id').eq('campaign_id', id).eq('influencer_id', profile.id).maybeSingle().then(({ data }) => {
                setAlreadyApplied(!!data)
            })
        }
    }, [id, profile])

    if (!campaign) return <div className="p-6">Loading...</div>

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="mt-4 whitespace-pre-wrap">{campaign.description}</p>
            <p className="mt-4 font-semibold">Budget: {campaign.budget}</p>

            {profile?.role === 'influencer' && (
                <div className="mt-6">
                    {alreadyApplied ? (
                        <span className="bg-gray-200 px-4 py-2 rounded text-gray-600">You have already applied</span>
                    ) : (
                        <button onClick={() => setShowApply(true)} className="bg-black text-white px-6 py-2 rounded">Apply</button>
                    )}
                </div>
            )}
            {showApply && <ApplyModal campaignId={campaign.id} onClose={() => setShowApply(false)} onSuccess={() => setAlreadyApplied(true)} />}
        </div>
    )
}