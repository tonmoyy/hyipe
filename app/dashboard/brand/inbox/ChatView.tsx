// components/inbox/ChatView.tsx (or wherever placed)
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

type Message = {
    id?: string          // optional because optimistic inserts may lack an id
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
}

export default function ChatView({ partnerId }: { partnerId: string }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMsg, setNewMsg] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    // Load existing messages
    useEffect(() => {
        if (!user || !partnerId) return

        supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
            )
            .order('created_at', { ascending: true })
            .then(({ data }) => setMessages((data as Message[]) || []))

        // Real-time subscription for new messages from the partner
        const channel = supabase
            .channel('chat')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${partnerId},receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partnerId, user])

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = async () => {
        if (!newMsg.trim() || !user) return

        // Optimistic insert
        const optimisticMsg: Message = {
            sender_id: user.id,
            receiver_id: partnerId,
            content: newMsg,
            created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, optimisticMsg])
        setNewMsg('')

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: partnerId,
            content: optimisticMsg.content,
        })

        if (error) {
            // Rollback optimistic update on error (optional, can be more sophisticated)
            setMessages((prev) => prev.filter((m) => m !== optimisticMsg))
            console.error('Failed to send message:', error.message)
        }
    }

    return (
        <div className="flex flex-col h-[70vh] border rounded bg-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m, i) => (
                    <div
                        key={m.id || `${m.sender_id}-${m.created_at}-${i}`}
                        className={`p-2 rounded max-w-xs ${
                            m.sender_id === user?.id
                                ? 'ml-auto bg-blue-100 text-right'
                                : 'bg-gray-100'
                        }`}
                    >
                        {m.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="border-t p-2 flex">
                <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    className="flex-1 border p-2 rounded"
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                />
                <button
                    onClick={send}
                    className="ml-2 bg-black text-white px-4 py-2 rounded"
                >
                    Send
                </button>
            </div>
        </div>
    )
}