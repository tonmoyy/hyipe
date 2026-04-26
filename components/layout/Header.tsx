'use client'

import {
    useEffect,
    useState,
    useCallback,
    useRef
} from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MessageSquare, X } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'

type Message = {
    id: string
    content: string
    created_at: string
}

export default function Header() {
    const { user, profile, signOut } = useAuth()

    const [unreadCount, setUnreadCount] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [open, setOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement>(null)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const fetchNotificationsRef = useRef<() => Promise<void>>(() => Promise.resolve())
    const dropdownRef = useRef<HTMLDivElement | null>(null) // for the portal content

    const [pos, setPos] = useState({ top: 0, left: 0, width: 320 })

    // ---------------- FETCH NOTIFICATIONS ----------------
    const fetchNotifications = useCallback(async () => {
        if (!user) return

        const [countRes, msgRes] = await Promise.all([
            supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('read', false),
            supabase
                .from('messages')
                .select('id, content, created_at')
                .eq('receiver_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
        ])

        const newCount = countRes.count ?? 0
        const newMessages = (msgRes.data ?? []) as Message[]

        setUnreadCount(prev => (prev === newCount ? prev : newCount))
        setMessages(prev =>
            JSON.stringify(prev) === JSON.stringify(newMessages) ? prev : newMessages
        )
    }, [user])

    // Sync ref
    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications
    }, [fetchNotifications])

    // ---------------- RESET ON LOGOUT (deferred) ----------------
    useEffect(() => {
        if (!user) {
            const timer = setTimeout(() => {
                setUnreadCount(0)
                setMessages([])
                setOpen(false)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [user])

    // ---------------- INITIAL FETCH (deferred) ----------------
    useEffect(() => {
        if (!user) return

        const timer = setTimeout(() => {
            fetchNotificationsRef.current()
        }, 0)

        return () => clearTimeout(timer)
    }, [user])

    // ---------------- REALTIME SUBSCRIPTION ----------------
    useEffect(() => {
        if (!user) return

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
            .channel(`header-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                () => {
                    fetchNotificationsRef.current()
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [user])

    // ---------------- POSITION ----------------
    const updatePosition = useCallback(() => {
        const btn = buttonRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        setPos({
            top: rect.bottom + 8,
            left: rect.right - 320,
            width: 320
        })
    }, [])

    // ---------------- TOGGLE ----------------
    const toggle = () => {
        if (!open) updatePosition()
        setOpen(prev => !prev)
    }

    // ---------------- OUTSIDE CLICK (fixed: ignores portal) ----------------
    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => {
            const target = e.target as Node

            // Don't close if clicking inside the button or inside the portal dropdown
            if (
                buttonRef.current?.contains(target) ||
                (dropdownRef.current && dropdownRef.current.contains(target))
            ) {
                return
            }

            setOpen(false)
        }

        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // ---------------- INBOX PATH ----------------
    const inboxPath =
        profile?.role === 'influencer'
            ? '/dashboard/influencer/inbox'
            : profile?.role === 'brand'
                ? '/dashboard/brand/inbox'
                : null

    // ---------------- RENDER ----------------
    return (
        <header className="flex justify-between items-center px-6 py-3 border-b bg-white relative z-50">
            <Link href="/" className="font-bold text-xl">
                HYIPE
            </Link>

            <nav className="flex items-center gap-4 text-sm">
                <Link href="/marketplace">Marketplace</Link>

                {user ? (
                    <>
                        <span className="text-gray-600">{profile?.full_name || user.email}</span>
                        <Link href={`/dashboard/${profile?.role}/profile`}>Dashboard</Link>

                        {/* MESSAGE ICON */}
                        {inboxPath && (
                            <>
                                <button
                                    ref={buttonRef}
                                    onClick={toggle}
                                    className="relative p-2 rounded hover:bg-gray-100"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full">
                      {unreadCount}
                    </span>
                                    )}
                                </button>

                                {/* PORTAL DROPDOWN */}
                                {open &&
                                    createPortal(
                                        <div
                                            ref={dropdownRef}
                                            id="inbox-dropdown"
                                            className="fixed bg-white border rounded-lg shadow-xl z-[9999]"
                                            style={{ top: pos.top, left: pos.left, width: pos.width }}
                                        >
                                            <div className="flex justify-between items-center p-3 border-b">
                                                <span className="font-semibold">Messages</span>
                                                <button onClick={() => setOpen(false)}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="max-h-64 overflow-y-auto">
                                                {messages.length === 0 ? (
                                                    <p className="p-4 text-sm text-gray-500 text-center">No messages</p>
                                                ) : (
                                                    messages.map(m => (
                                                        <div key={m.id} className="p-3 border-b hover:bg-gray-50">
                                                            <p className="text-sm">{m.content}</p>
                                                            <span className="text-xs text-gray-400">
                                {new Date(m.created_at).toLocaleTimeString()}
                              </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <Link
                                                href={inboxPath}
                                                className="block text-center p-2 text-blue-600 hover:bg-gray-50 border-t"
                                            >
                                                Open Inbox →
                                            </Link>
                                        </div>,
                                        document.body
                                    )}
                            </>
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