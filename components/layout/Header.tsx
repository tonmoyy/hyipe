// components/layout/Header.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MessageSquare, X, Dot } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'

type Message = {
    id: string
    content: string
    created_at: string
    read: boolean
    sender_id: string   // needed for direct navigation
}

export default function Header() {
    const { user, profile, signOut } = useAuth()

    const [unreadCount, setUnreadCount] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [open, setOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement>(null)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const fetchNotificationsRef = useRef<() => Promise<void>>(() => Promise.resolve())
    const lastRefreshRef = useRef(0)

    const [pos, setPos] = useState({ top: 0, left: 0, width: 380 })

    // 📬 Fetch unread count + latest messages (including sender_id)
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        lastRefreshRef.current = Date.now()

        const [countRes, msgRes] = await Promise.all([
            supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('read', false),
            supabase
                .from('messages')
                .select('id, content, created_at, read, sender_id')
                .eq('receiver_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5),
        ])

        const newCount = countRes.count ?? 0
        const newMessages = (msgRes.data ?? []) as Message[]

        setUnreadCount(newCount)
        setMessages(newMessages)
    }, [user])

    // Keep ref in sync
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

    // 🔁 Real‑time subscription – separate INSERT and UPDATE
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

    // 🔊 Listen for custom "inbox:read" event from the inbox page
    useEffect(() => {
        const handleInboxRead = () => {
            fetchNotificationsRef.current()
        }

        document.addEventListener('inbox:read', handleInboxRead)
        return () => document.removeEventListener('inbox:read', handleInboxRead)
    }, []) // stable listener – ref is used, so no stale closures

    // 🔄 Position calculation
    const updatePosition = useCallback(() => {
        const btn = buttonRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        setPos({
            top: rect.bottom + 6,
            left: rect.right - 380,
            width: 380,
        })
    }, [])

    // 🔔 Toggle – refresh data every time the dropdown opens
    const toggle = () => {
        if (!open) {
            updatePosition()
            fetchNotificationsRef.current() // immediate refresh on open
        }
        setOpen(prev => !prev)
    }

    // Outside click – close portal
    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => {
            const target = e.target as Node
            if (
                buttonRef.current?.contains(target) ||
                (dropdownRef.current && dropdownRef.current.contains(target))
            )
                return
            setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
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
                <Link href="/marketplace">Marketplace</Link>

                {user ? (
                    <>
                        <span className="text-gray-600">{profile?.full_name || user.email}</span>
                        <Link href={`/dashboard/${profile?.role}/profile`}>Dashboard</Link>

                        {/* Chat icon with badge ABOVE */}
                        {inboxPath && (
                            <button
                                ref={buttonRef}
                                onClick={toggle}
                                className="relative flex items-center group"
                                aria-label="Notifications"
                            >
                                {/* Badge above the icon */}
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 z-10 min-w-[18px] h-[18px] text-[10px] font-bold bg-red-500 text-white flex items-center justify-center rounded-full px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                                )}

                                {/* Icon and label */}
                                <div className="flex flex-col items-center p-1 rounded-md hover:bg-gray-100 transition">
                                    <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                    <span className="hidden sm:block text-[10px] text-gray-400 group-hover:text-blue-600 mt-0.5">
                    Inbox
                  </span>
                                </div>
                            </button>
                        )}

                        {/* Dropdown portal */}
                        {open && inboxPath &&
                            createPortal(
                                <div
                                    ref={dropdownRef}
                                    className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                                    style={{ top: pos.top, left: pos.left, width: pos.width }}
                                >
                                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                                        <span className="font-semibold text-gray-700">Notifications</span>
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="text-gray-400 hover:text-gray-600 transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="max-h-72 overflow-y-auto">
                                        {messages.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                                No recent messages
                                            </p>
                                        ) : (
                                            messages.map(m => (
                                                <Link
                                                    key={m.id}
                                                    href={`${inboxPath}?partner=${m.sender_id}`}
                                                    className="block"
                                                    onClick={() => setOpen(false)}  // close dropdown on click
                                                >
                                                    <div
                                                        className={`px-4 py-3 border-b border-gray-50 transition cursor-pointer hover:bg-gray-100 ${
                                                            !m.read
                                                                ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm line-clamp-2">{m.content}</p>
                                                            {!m.read && (
                                                                <Dot className="w-4 h-4 text-blue-600 flex-shrink-0 ml-1" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400 mt-1 block">
                              {new Date(m.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })}
                            </span>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>

                                    <Link
                                        href={inboxPath!}
                                        className="block text-center px-4 py-3 text-blue-600 text-sm font-medium hover:bg-gray-50 border-t bg-gray-50/20 transition"
                                        onClick={() => setOpen(false)} // close dropdown on click
                                    >
                                        Open Inbox →
                                    </Link>
                                </div>,
                                document.body
                            )}

                        <button onClick={signOut} className="text-red-600 hover:underline">
                            Sign Out
                        </button>
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