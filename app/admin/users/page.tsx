// app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Profile = {
    id: string
    full_name: string | null
    role: string
}

export default function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false

        const fetchUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .order('created_at', { ascending: false })

            if (!ignore) {
                setUsers((data as Profile[]) || [])
                setLoading(false)
            }
        }

        fetchUsers()

        return () => {
            ignore = true
        }
    }, [])

    const deleteUser = async (userId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to remove this user? This will only delete their profile; the auth account will remain unless deleted separately.'
        )
        if (!confirmed) return

        const { error } = await supabase.from('profiles').delete().eq('id', userId)
        if (error) toast.error(error.message)
        else {
            toast.success('User removed')
            // Update local state to avoid re-fetching the whole list
            setUsers((prev) => prev.filter((u) => u.id !== userId))
        }
    }

    if (loading) return <div className="p-6">Loading users…</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            {users.length === 0 && !loading && (
                <p className="text-gray-500">No users found.</p>
            )}

            <div className="space-y-2">
                {users.map((u) => (
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
                        </div>
                        <button
                            onClick={() => deleteUser(u.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}