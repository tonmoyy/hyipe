'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ---------- Types ----------
type Message = {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
}

type Profile = {
    id: string
    full_name: string | null
    role: string | null
}

type Campaign = {
    id: string
    title: string
    created_by: string
}

type Application = {
    id: string
    campaign_id: string
    influencer_id: string
}
// ---------------------------

export default function AdminInboxViewer() {
    const [grouped, setGrouped] = useState<
        {
            campaign: Campaign | null
            participants: string[]
            messages: Message[]
        }[]
    >([])
    const [profileMap, setProfileMap] = useState<Record<string, Profile>>({})

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200)

            const allMessages = (msgs as Message[]) || []

            // 2. Collect unique user IDs
            const userIds = new Set<string>()
            allMessages.forEach((m) => {
                userIds.add(m.sender_id)
                userIds.add(m.receiver_id)
            })

            // 3. Fetch profiles
            let localProfileMap: Record<string, Profile> = {}
            if (userIds.size > 0) {
                const { data: profs } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .in('id', Array.from(userIds))

                ;(profs as Profile[])?.forEach((p) => {
                    localProfileMap[p.id] = p
                })
                setProfileMap(localProfileMap)
            }

            // 4. Fetch ALL campaigns and applications
            const { data: allCampaigns } = await supabase
                .from('campaigns')
                .select('id, title, created_by')
            const { data: allApplications } = await supabase
                .from('applications')
                .select('id, campaign_id, influencer_id')

            const campaigns = (allCampaigns as Campaign[]) || []
            const applications = (allApplications as Application[]) || []

            // 5. Group messages by unordered pair
            const conversations = new Map<string, Message[]>()
            allMessages.forEach((m) => {
                const pair = [m.sender_id, m.receiver_id].sort().join('::')
                if (!conversations.has(pair)) conversations.set(pair, [])
                conversations.get(pair)!.push(m)
            })

            // 6. Match each pair to a campaign
            const groups: {
                campaign: Campaign | null
                participants: string[]
                messages: Message[]
            }[] = []

            for (const [pair, msgs] of conversations) {
                const participants = pair.split('::')
                const brandId = participants.find(
                    (id) => localProfileMap[id]?.role === 'brand'
                )
                const influencerId = participants.find(
                    (id) => localProfileMap[id]?.role === 'influencer'
                )

                let campaign: Campaign | null = null

                if (brandId && influencerId) {
                    campaign =
                        campaigns.find(
                            (c) =>
                                c.created_by === brandId &&
                                applications.some(
                                    (app) =>
                                        app.campaign_id === c.id &&
                                        app.influencer_id === influencerId
                                )
                        ) || null
                }

                groups.push({ campaign, participants, messages: msgs })
            }

            setGrouped(groups)
        }

        fetchData()
    }, [])

    const formatUser = (userId: string) => {
        const profile = profileMap[userId]
        const name = profile?.full_name || 'Unknown User'
        return `${name} (${userId})`
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Messages Grouped by Campaign</h1>
            {grouped.length === 0 && <p className="text-gray-500">No messages found.</p>}

            {grouped.map((group, index) => (
                <div key={index} className="mb-6 border rounded-lg bg-white shadow-sm">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        {group.campaign ? (
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    Campaign: {group.campaign.title}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {group.participants.map(formatUser).join('  ⇄  ')}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    Direct Conversation (No campaign found)
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {group.participants.map(formatUser).join('  ⇄  ')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 space-y-2">
                        {group.messages.map((m) => (
                            <div key={m.id} className="border-b pb-2 last:border-none">
                                <p className="text-xs text-gray-500">
                                    {formatUser(m.sender_id)} → {formatUser(m.receiver_id)}
                                </p>
                                <p className="text-sm mt-1">{m.content}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(m.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}