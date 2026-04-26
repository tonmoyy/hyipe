'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

// Applications as they come from Supabase (no nested profiles)
type Application = {
    id: string
    influencer_id: string
    status: string
    message: string
    portfolio_link: string
}

// Profile of an influencer
type Profile = {
    id: string
    full_name: string | null
    whatsapp_number: string | null
}

export default function CampaignApplicants() {
    const { id } = useParams()
    const [applicants, setApplicants] = useState<Application[]>([])
    const [profiles, setProfiles] = useState<Record<string, Profile>>({})
    const [escrowModal, setEscrowModal] = useState<{
        influencerId: string
        name: string
    } | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchApplicants = async () => {
        // 1️⃣ Get applications for this campaign
        const { data: apps, error } = await supabase
            .from('applications')
            .select('id, influencer_id, status, message, portfolio_link')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch applications error:', error)
            setLoading(false)
            return
        }

        const applications = (apps as Application[]) || []
        setApplicants(applications)

        // 2️⃣ Collect unique influencer IDs
        const influencerIds = Array.from(
            new Set(applications.map((a) => a.influencer_id))
        )

        // 3️⃣ Fetch their profiles
        if (influencerIds.length > 0) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, full_name, whatsapp_number')
                .in('id', influencerIds)

            const profileMap: Record<string, Profile> = {}
            ;(profs as Profile[])?.forEach((p) => {
                profileMap[p.id] = p
            })
            setProfiles(profileMap)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchApplicants()
    }, [id])

    const updateStatus = async (
        appId: string,
        newStatus: 'accepted' | 'rejected'
    ) => {
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', appId)

        if (error) toast.error(error.message)
        else {
            toast.success(`Application ${newStatus}`)
            fetchApplicants() // refresh the list
        }
    }

    if (loading) return <div className="p-6">Loading…</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Applicants</h1>

            {applicants.length === 0 && (
                <p className="text-gray-500">No one has applied yet.</p>
            )}

            {applicants.map((app) => {
                const profile = profiles[app.influencer_id]
                return (
                    <div key={app.id} className="border rounded p-4 mb-3 bg-white shadow-sm">
                        <p className="font-bold">
                            {profile?.full_name || 'Unknown Influencer'}
                        </p>
                        <p className="text-sm mt-1">{app.message}</p>
                        {app.portfolio_link && (
                            <a
                                href={app.portfolio_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                            >
                                Portfolio
                            </a>
                        )}

                        <div className="mt-2 flex gap-2 items-center flex-wrap">
                            {app.status === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => updateStatus(app.id, 'accepted')}
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => updateStatus(app.id, 'rejected')}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <span className="capitalize text-sm text-gray-500">
                  {app.status}
                </span>
                            )}

                            {/* Message button */}
                            <Link
                                href={`/dashboard/brand/inbox?partner=${app.influencer_id}`}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                            >
                                Message
                            </Link>

                            {app.status !== 'rejected' && (
                                <button
                                    onClick={() =>
                                        setEscrowModal({
                                            influencerId: app.influencer_id,
                                            name: profile?.full_name || 'Influencer',
                                        })
                                    }
                                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                                >
                                    Secure Deal via WhatsApp
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Escrow Modal (unchanged) */}
            {escrowModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded max-w-md w-full">
                        <h2 className="text-xl font-bold mb-2">Deal Locked!</h2>
                        <p className="mb-4">
                            To protect your investment, HYIPE uses a secure manual escrow. Click
                            below to message our founder on WhatsApp, share your Campaign ID,
                            and receive payment instructions. Work will begin once funds are
                            secured.
                        </p>
                        <a
                            href={`https://wa.me/92XXXXXXXXXX?text=Hi%20HYIPE%20Founder,%20I%20want%20to%20secure%20deal%20for%20influencer%20${escrowModal.name}%20(Campaign%20ID:%20${id})`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition"
                        >
                            Secure Deal via WhatsApp
                        </a>
                        <button
                            onClick={() => setEscrowModal(null)}
                            className="mt-2 w-full border py-2 rounded hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}