'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        setLoading(false)
        if (error) {
            setError(error.message)
        } else {
            setSent(true)
        }
    }

    if (sent) {
        return (
            <div className="max-w-md mx-auto p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Check your email</h1>
                <p>We’ve sent a password reset link to <strong>{email}</strong>.</p>
                <Link href="/auth" className="text-blue-600 mt-4 inline-block">
                    Back to login
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Reset your password</h1>
            <form onSubmit={handleReset} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border p-2 rounded"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                >
                    {loading ? 'Sending…' : 'Send reset link'}
                </button>
            </form>
            <p className="mt-4 text-center text-sm">
                <Link href="/auth" className="text-blue-600">
                    Back to login
                </Link>
            </p>
        </div>
    )
}