// app/dashboard/influencer/inbox/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { RealtimeChannel } from '@supabase/supabase-js'
import ChatView from '@/components/inbox/ChatView'

type Profile = {
    id: string
    full_name: string | null
}

type PartnerInfo = {
    id: string
    name: string
    unread: number
}

export default function InfluencerInbox() {
    const { user } = useAuth()
    const searchParams = useSearchParams()

    const [selectedPartner, setSelectedPartner] = useState<string | null>(
        searchParams.get('partner')
    )
    const [partners, setPartners] = useState<PartnerInfo[]>([])
    const [loading, setLoading] = useState(true)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const loadPartnersRef = useRef<() => Promise<void>>(() => Promise.resolve())

    // Core loader – fetches partners and unread counts
    const loadPartners = useCallback(async () => {
        if (!user) return

        const { data: messages } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

        const partnerIds = new Set<string>()
        messages?.forEach(m => {
            if (m.sender_id !== user.id) partnerIds.add(m.sender_id)
            if (m.receiver_id !== user.id) partnerIds.add(m.receiver_id)
        })
        const partnerList = Array.from(partnerIds)

        const nameMap: Record<string, string> = {}
        if (partnerList.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', partnerList)
            ;(profiles as Profile[])?.forEach(p => {
                nameMap[p.id] = p.full_name || 'Unknown'
            })
        }

        const unreadMap: Record<string, number> = {}
        if (partnerList.length > 0) {
            const { data: unreadMessages } = await supabase
                .from('messages')
                .select('sender_id')
                .eq('receiver_id', user.id)
                .eq('read', false)
                .in('sender_id', partnerList)

            unreadMessages?.forEach(msg => {
                const sid = msg.sender_id
                if (sid) unreadMap[sid] = (unreadMap[sid] || 0) + 1
            })
        }

        const finalPartners: PartnerInfo[] = partnerList.map(id => ({
            id,
            name: nameMap[id] || 'Unknown',
            unread: unreadMap[id] || 0,
        }))

        setPartners(finalPartners)
        setLoading(false)
    }, [user])

    useEffect(() => {
        loadPartnersRef.current = loadPartners
    }, [loadPartners])

    // No automatic mark-all – unread badges persist until you open a conversation

    useEffect(() => {
        if (!user) return
        const t = setTimeout(() => loadPartnersRef.current(), 0)
        return () => clearTimeout(t)
    }, [user])

    // Real‑time subscription
    useEffect(() => {
        if (!user) return
        if (channelRef.current) supabase.removeChannel(channelRef.current)

        const channel = supabase
            .channel(`inbox-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    loadPartnersRef.current()
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
        }
    }, [user])

    const markConversationAsRead = async (partnerId: string) => {
        if (!user) return
        await supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', partnerId)
            .eq('read', false)
        loadPartnersRef.current()
        // Notify header to refresh the badge
        document.dispatchEvent(new CustomEvent('inbox:read'))
    }

    const totalUnread = partners.reduce((sum, p) => sum + p.unread, 0)

    const openConversation = (partnerId: string) => {
        setSelectedPartner(partnerId)
    }

    if (selectedPartner) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <button
                    onClick={() => setSelectedPartner(null)}
                    className="mb-4 text-blue-600 hover:underline text-sm font-medium"
                >
                    ← Back to conversations
                </button>
                <ChatView partnerId={selectedPartner} />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Only title and unread badge – navigation is in the header */}
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold">Inbox</h1>
                {totalUnread > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {totalUnread}
          </span>
                )}
            </div>

            {loading ? (
                <p className="text-gray-500">Loading conversations...</p>
            ) : partners.length === 0 ? (
                <p className="text-gray-500">No conversations yet.</p>
            ) : (
                <ul className="space-y-2">
                    {partners.map(p => (
                        <li key={p.id}>
                            <button
                                onClick={() => openConversation(p.id)}
                                className={`w-full text-left border p-3 rounded-lg flex justify-between items-center shadow-sm transition-shadow ${
                                    p.unread > 0
                                        ? 'bg-blue-50/60 hover:bg-blue-100'
                                        : 'bg-white hover:bg-gray-50'
                                }`}
                            >
                                <span className="font-medium">{p.name}</span>
                                {p.unread > 0 && (
                                    <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {p.unread}
                  </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}