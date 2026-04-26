// components/inbox/ChatView.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { Check, CheckCheck } from 'lucide-react'

type Message = {
    id?: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    delivered: boolean
    read: boolean
}

export default function ChatView({ partnerId }: { partnerId: string }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMsg, setNewMsg] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    // 1. Load existing messages + mark incoming ones as delivered/read
    useEffect(() => {
        if (!user || !partnerId) return

        // Fetch all messages between the two users
        supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
            )
            .order('created_at', { ascending: true })
            .then(({ data }) => setMessages((data as Message[]) || []))

        // Mark all messages FROM the partner as delivered AND read
        const markAsDeliveredAndRead = async () => {
            await supabase
                .from('messages')
                .update({ delivered: true, read: true })
                .eq('sender_id', partnerId)
                .eq('receiver_id', user.id)
                .eq('read', false) // only update unread ones
        }
        markAsDeliveredAndRead()

        // Real-time subscription for new messages from the partner
        const channel = supabase
            .channel(`chat-${user.id}-${partnerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${partnerId} and receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => [...prev, newMsg])

                    // Mark this new message as delivered and read immediately
                    supabase
                        .from('messages')
                        .update({ delivered: true, read: true })
                        .eq('id', newMsg.id)
                        .then(() => {
                            // Optimistically update the message in the list
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === newMsg.id ? { ...m, delivered: true, read: true } : m
                                )
                            )
                        })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partnerId, user])

    // 2. Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // 3. Send a new message (optimistic)
    const send = async () => {
        if (!newMsg.trim() || !user) return

        const optimisticMsg: Message = {
            id: crypto.randomUUID(), // temp id for React keys
            sender_id: user.id,
            receiver_id: partnerId,
            content: newMsg,
            created_at: new Date().toISOString(),
            delivered: false,
            read: false,
        }

        setMessages((prev) => [...prev, optimisticMsg])
        setNewMsg('')

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: partnerId,
            content: optimisticMsg.content,
            delivered: false,
            read: false,
        })

        if (error) {
            // Rollback on failure
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
            console.error('Failed to send message:', error.message)
        }
    }

    return (
        <div className="flex flex-col h-[70vh] border rounded bg-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m, i) => {
                    const isMyMessage = m.sender_id === user?.id

                    return (
                        <div
                            key={m.id || `${m.sender_id}-${m.created_at}-${i}`}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`p-2 rounded max-w-xs relative ${
                                    isMyMessage ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                            >
                                <span>{m.content}</span>
                                {isMyMessage && (
                                    <span className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center">
                    {m.read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    ) : m.delivered ? (
                        <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <Check className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </span>
                                )}
                            </div>
                        </div>
                    )
                })}
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