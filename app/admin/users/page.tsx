// app/admin/users/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Profile = {
    id: string
    full_name: string | null
    role: string
    banned: boolean
}

export default function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            // 1. Validate current user
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()
                setCurrentUserRole(myProfile?.role || null)
            }

            // 2. Fetch all profiles
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, role, banned')
                .order('created_at', { ascending: false })
            setUsers((data as Profile[]) || [])
            setLoading(false)
        }
        load()
    }, [])

    // ---------- Ban / Unban ----------
    const toggleBan = async (userId: string, currentBanned: boolean) => {
        const newBanned = !currentBanned
        const { error } = await supabase
            .from('profiles')
            .update({ banned: newBanned })
            .eq('id', userId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success(`User ${newBanned ? 'banned' : 'unbanned'}`)
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, banned: newBanned } : u))
            )
        }
    }

    // ---------- Permanent Delete (via API) ----------
    const permanentDelete = async (userId: string, userName?: string) => {
        const confirmation = prompt(
            `To permanently delete ${userName || 'this user'}, type DELETE:`
        )
        if (confirmation !== 'DELETE') {
            toast.error('Deletion cancelled.')
            return
        }

        const res = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })

        const data = await res.json()
        if (res.ok) {
            toast.success('User permanently deleted')
            setUsers(prev => prev.filter(u => u.id !== userId))
        } else {
            toast.error(data.error || 'Deletion failed')
        }
    }

    // ---------- Button visibility helpers ----------
    const isAdminOrSuper = (role: string) =>
        role === 'admin' || role === 'super_admin'

    const canBan = (targetRole: string) => {
        if (currentUserRole === 'super_admin') return true
        if (currentUserRole === 'admin' && !isAdminOrSuper(targetRole)) return true
        return false
    }

    const canPermanentDelete = (targetRole: string) => {
        if (currentUserRole === 'super_admin') return true
        if (currentUserRole === 'admin' && !isAdminOrSuper(targetRole)) return true
        return false
    }

    // ---------- Render ----------
    if (loading) return <div className="p-6">Loading users…</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            {users.length === 0 && (
                <p className="text-gray-500">No users found.</p>
            )}

            <div className="space-y-2">
                {users.map(u => {
                    // Prevent self‑ban or self‑delete
                    const isSelf = u.id === currentUserId

                    return (
                        <div
                            key={u.id}
                            className="flex items-center justify-between border p-3 rounded bg-white shadow-sm"
                        >
                            <div>
                <span className="font-medium">
                  {u.full_name || 'No name'}
                </span>
                                <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 capitalize">
                  {u.role}
                </span>
                                {u.banned && (
                                    <span className="ml-2 text-xs rounded-full bg-red-100 px-2 py-0.5 text-red-600">
                    Banned
                  </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!isSelf && canBan(u.role) && (
                                    <button
                                        onClick={() => toggleBan(u.id, u.banned)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            u.banned
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        }`}
                                    >
                                        {u.banned ? 'Unban' : 'Ban'}
                                    </button>
                                )}

                                {!isSelf && canPermanentDelete(u.role) && (
                                    <button
                                        onClick={() => permanentDelete(u.id, u.full_name || undefined)}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                    >
                                        Permanent Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}