'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import ChatView from '@/components/inbox/ChatView'

type MessageRow = {
    sender_id: string
    receiver_id: string
}

export default function BrandInbox() {
    const { user } = useAuth()
    const [partners, setPartners] = useState<string[]>([])
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return

        supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .then(({ data }: { data: MessageRow[] | null }) => {

                const ids = new Set<string>()

                data?.forEach(m => {
                    if (m.sender_id !== user.id) ids.add(m.sender_id)
                    if (m.receiver_id !== user.id) ids.add(m.receiver_id)
                })

                setPartners(Array.from(ids))
            })
    }, [user])

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Inbox</h1>

            {selected ? (
                <div>
                    <button
                        onClick={() => setSelected(null)}
                        className="mb-2 text-blue-600"
                    >
                        ← Back
                    </button>

                    <ChatView partnerId={selected} />
                </div>
            ) : (
                <div>
                    {partners.length === 0 && (
                        <p className="text-gray-500">No conversations yet.</p>
                    )}

                    {partners.map(id => (
                        <button
                            key={id}
                            onClick={() => setSelected(id)}
                            className="block w-full text-left border p-2 mb-2 rounded hover:bg-gray-50"
                        >
                            {id}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}