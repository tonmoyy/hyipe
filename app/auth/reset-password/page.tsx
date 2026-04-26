'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [ready, setReady] = useState(false)

    // Supabase needs the session from the URL hash fragment
    useEffect(() => {
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true)
            }
        })
    }, [])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setError(error.message)
        } else {
            router.push('/auth?reset=success')
        }
        setLoading(false)
    }

    if (!ready) {
        return (
            <div className="max-w-md mx-auto p-6 text-center">
                <p>Loading recovery session…</p>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Set new password</h1>
            <form onSubmit={handleUpdate} className="space-y-4">
                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border p-2 rounded"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                >
                    {loading ? 'Updating…' : 'Update password'}
                </button>
            </form>
        </div>
    )
}