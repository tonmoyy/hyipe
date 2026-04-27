// components/layout/Header.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'
import { ChatsCircle } from '@phosphor-icons/react'

type Message = {
    id: string
    content: string
    created_at: string
    read: boolean
    sender_id: string
}

export default function Header() {
    const { user, profile, signOut } = useAuth()

    const [unreadCount, setUnreadCount] = useState(0)      // distinct senders count
    const [messages, setMessages] = useState<Message[]>([]) // latest unread per sender
    const [open, setOpen] = useState(false)

    const channelRef = useRef<RealtimeChannel | null>(null)
    const fetchNotificationsRef = useRef<() => Promise<void>>(() => Promise.resolve())

    // ----- Fetch notifications (distinct senders, latest message each) -----
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        // Fetch all unread messages for this user
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

        // Convert map values to array, sort by created_at descending, take top 5
        const latestMessages = Array.from(latestPerSenderMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)

        setMessages(latestMessages)
        setUnreadCount(latestPerSenderMap.size) // distinct senders count
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
        <header className="flex justify-between items-center px-6 py-3 border-b bg-white">
            <Link href="/" className="font-bold text-xl">
                HYIPE
            </Link>

            <nav className="flex items-center gap-4 text-sm">
                {user ? (
                    <>
                        <Link href="/marketplace">Marketplace</Link>

                        <span className="text-gray-600">
              {profile?.full_name || user.email}
            </span>

                        <Link href={`/dashboard/${profile?.role}/profile`}>
                            Dashboard
                        </Link>

                        {/* Inbox Popover – no text below icon, badge centered above */}
                        {inboxPath && (
                            <Popover
                                open={open}
                                onOpenChange={(newOpen) => {
                                    setOpen(newOpen)
                                    if (newOpen) {
                                        setTimeout(() => fetchNotificationsRef.current(), 0)
                                    }
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative h-auto w-auto p-1"
                                    >
                                        <div className="relative">
                                            <ChatsCircle
                                                className="w-7 h-7 text-gray-700 hover:text-blue-600 transition-colors"
                                                weight="regular"
                                            />
                                            {unreadCount > 0 && (
                                                <Badge
                                                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 min-w-[16px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                                >
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-80 p-0"
                                    align="end"
                                    sideOffset={8}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <span className="font-semibold text-gray-700">
                      Notifications
                    </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-gray-400 hover:text-gray-600 ml-2"
                                            onClick={() => setOpen(false)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Message list – each sender shows only latest unread */}
                                    <ScrollArea className="h-72">
                                        {messages.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                                No recent messages
                                            </p>
                                        ) : (
                                            messages.map((m) => (
                                                <Link
                                                    key={m.sender_id}   // use sender_id as key so React re-uses correctly
                                                    href={`${inboxPath}?partner=${m.sender_id}`}
                                                    onClick={() => setOpen(false)}
                                                    className={`block px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-100 ${
                                                        !m.read
                                                            ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm line-clamp-2">
                                                            {m.content}
                                                        </p>
                                                        {!m.read && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-1 mt-0.5" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 mt-1 block">
                            {new Date(m.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                          </span>
                                                </Link>
                                            ))
                                        )}
                                    </ScrollArea>

                                    {/* Open Inbox link */}
                                    <Link
                                        href={inboxPath}
                                        onClick={() => setOpen(false)}
                                        className="block text-center px-4 py-3 text-blue-600 text-sm font-medium hover:bg-gray-50 border-t bg-gray-50/20 transition rounded-b-lg"
                                    >
                                        Open Inbox →
                                    </Link>
                                </PopoverContent>
                            </Popover>
                        )}

                        <Button
                            variant="link"
                            onClick={signOut}
                            className="text-red-600 hover:underline p-0 h-auto"
                        >
                            Sign Out
                        </Button>
                    </>
                ) : (
                    <Link href="/auth" className="text-blue-600">
                        Login
                    </Link>
                )}
            </nav>
        </header>
    )
}