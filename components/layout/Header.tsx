// components/layout/Header.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { X } from 'lucide-react'
import { Envelope, EnvelopeOpen } from '@phosphor-icons/react'

type Message = {
    id: string
    content: string
    created_at: string
    read: boolean
    sender_id: string
}

export default function Header() {
    const { user, profile, signOut } = useAuth()

    const [unreadCount, setUnreadCount] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [open, setOpen] = useState(false)

    const channelRef = useRef<RealtimeChannel | null>(null)
    const fetchNotificationsRef = useRef<() => Promise<void>>(() => Promise.resolve())

    // ----- Fetch notifications (distinct senders, latest message each) -----
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        const { data: unreadMessages, error } = await supabase
            .from('messages')
            .select('id, content, created_at, read, sender_id')
            .eq('receiver_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching unread messages:', error)
            return
        }

        const allUnread = (unreadMessages ?? []) as Message[]

        // Group by sender, keep only the latest message per sender
        const latestPerSenderMap = new Map<string, Message>()
        allUnread.forEach((msg) => {
            if (!latestPerSenderMap.has(msg.sender_id)) {
                latestPerSenderMap.set(msg.sender_id, msg)
            }
        })

        const latestMessages = Array.from(latestPerSenderMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)

        setMessages(latestMessages)
        setUnreadCount(latestPerSenderMap.size)
    }, [user])

    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications
    }, [fetchNotifications])

    // Reset on logout (deferred)
    useEffect(() => {
        if (!user) {
            const t = setTimeout(() => {
                setUnreadCount(0)
                setMessages([])
                setOpen(false)
            }, 0)
            return () => clearTimeout(t)
        }
    }, [user])

    // Initial fetch (deferred)
    useEffect(() => {
        if (!user) return
        const t = setTimeout(() => fetchNotificationsRef.current(), 0)
        return () => clearTimeout(t)
    }, [user])

    // Real‑time subscription
    useEffect(() => {
        if (!user) return
        if (channelRef.current) supabase.removeChannel(channelRef.current)

        const channel = supabase
            .channel(`header-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    setTimeout(() => fetchNotificationsRef.current(), 50)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    setTimeout(() => fetchNotificationsRef.current(), 50)
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
        }
    }, [user])

    // Listen for custom "inbox:read" event
    useEffect(() => {
        const handler = () => {
            fetchNotificationsRef.current()
        }
        document.addEventListener('inbox:read', handler)
        return () => document.removeEventListener('inbox:read', handler)
    }, [])

    const inboxPath =
        profile?.role === 'influencer'
            ? '/dashboard/influencer/inbox'
            : profile?.role === 'brand'
                ? '/dashboard/brand/inbox'
                : null

    return (
        <header className="w-full border-b bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tight">
                    HYIPE
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-5">
                    {user ? (
                        <>
                            <Link
                                href="/marketplace"
                                className="text-sm text-gray-600 hover:text-black hover-lift"
                            >
                                Marketplace
                            </Link>

                            <Link
                                href={`/dashboard/${profile?.role}/profile`}
                                className="text-sm text-gray-600 hover:text-black hover-lift"
                            >
                                Dashboard
                            </Link>

                            <span className="text-sm text-gray-700 font-medium">
                                {profile?.full_name || user.email}
                            </span>

                            {/* Notification envelope */}
                            {inboxPath && (
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition hover-lift">

                                            {/* Closed / Open envelope */}
                                            {open ? (
                                                <EnvelopeOpen className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Envelope className="w-5 h-5 text-gray-700" />
                                            )}

                                            {/* Badge – soft pulse */}
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full leading-none animate-pulse-soft">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        align="end"
                                        className="w-80 p-0 rounded-lg border shadow-soft glass animate-pop"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b">
                                            <span className="text-sm font-semibold">
                                                Notifications
                                            </span>
                                            <button
                                                onClick={() => setOpen(false)}
                                                className="p-1 rounded hover:bg-gray-100"
                                            >
                                                <X className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>

                                        {/* Message list */}
                                        <div className="max-h-64 overflow-y-auto">
                                            {messages.length === 0 ? (
                                                <p className="py-6 text-center text-sm text-gray-500">
                                                    No new messages
                                                </p>
                                            ) : (
                                                messages.map((m) => (
                                                    <Link
                                                        key={m.sender_id}
                                                        href={`${inboxPath}?partner=${m.sender_id}`}
                                                        onClick={() => setOpen(false)}
                                                        className={`block px-4 py-3 border-b text-sm hover:bg-gray-50 ${
                                                            !m.read ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="line-clamp-1">
                                                                {m.content}
                                                            </span>
                                                            {!m.read && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {new Date(m.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <Link
                                            href={inboxPath}
                                            onClick={() => setOpen(false)}
                                            className="block text-center text-sm text-blue-600 py-2 hover:bg-gray-50"
                                        >
                                            View all messages
                                        </Link>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* Sign out – matched to Influencer Profile style */}
                            <button
                                onClick={signOut}
                                className="text-sm text-red-500 hover:text-red-600 hover:underline font-medium"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link href="/auth" className="text-blue-600 text-sm hover-lift">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}