'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Msg = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string }

export default function AdminInboxViewer() {
    const [messages, setMessages] = useState<Msg[]>([])

    useEffect(() => {
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
            setMessages(data as Msg[] || [])
        })
    }, [])

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Inbox Viewer</h1>
            <div className="space-y-2">
                {messages.map(m => (
                    <div key={m.id} className="border p-2 rounded">
                        <p className="text-xs text-gray-500">From: {m.sender_id} To: {m.receiver_id}</p>
                        <p>{m.content}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}