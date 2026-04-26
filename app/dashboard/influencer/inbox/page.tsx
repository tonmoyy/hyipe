'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import ChatView from '@/components/inbox/ChatView'

type Profile = {
    id: string
    full_name: string | null
}

export default function InfluencerInbox() {
    const { user } = useAuth()
    const [partners, setPartners] = useState<string[]>([])
    const [partnerNames, setPartnerNames] = useState<Record<string, string>>({})
    const searchParams = useSearchParams()
    const [selectedPartner, setSelectedPartner] = useState<string | null>(
        searchParams.get('partner')
    )

    useEffect(() => {
        if (!user) return

        const loadPartners = async () => {
            const { data } = await supabase
                .from('messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

            const ids = new Set<string>()
            data?.forEach((m) => {
                if (m.sender_id !== user.id) ids.add(m.sender_id)
                if (m.receiver_id !== user.id) ids.add(m.receiver_id)
            })

            const partnerList = Array.from(ids)
            setPartners(partnerList)

            // Fetch names for all partners
            if (partnerList.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', partnerList)

                const nameMap: Record<string, string> = {}
                ;(profiles as Profile[])?.forEach((p) => {
                    nameMap[p.id] = p.full_name || 'Unknown'
                })
                setPartnerNames(nameMap)
            }
        }

        loadPartners()
    }, [user])

    if (selectedPartner) {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedPartner(null)}
                    className="mb-4 text-blue-600 hover:underline"
                >
                    ← Back to conversations
                </button>
                <ChatView partnerId={selectedPartner} />
            </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Inbox</h1>
            {partners.length === 0 ? (
                <p className="text-gray-500">No conversations yet.</p>
            ) : (
                <ul className="space-y-2">
                    {partners.map((id) => (
                        <li key={id}>
                            <button
                                onClick={() => setSelectedPartner(id)}
                                className="w-full text-left border p-3 rounded hover:bg-gray-50"
                            >
                                {partnerNames[id] || 'Unknown'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}