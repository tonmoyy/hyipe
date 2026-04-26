'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.auth.updateUser({ password })
        if (error) setMessage(error.message)
        else {
            setMessage('Password updated successfully.')
            setTimeout(() => router.push('/auth'), 2000)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl">
            <h1 className="text-2xl font-bold mb-4">Set new password</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-2 rounded" />
                <button type="submit" className="w-full bg-black text-white py-2 rounded">Update Password</button>
            </form>
            {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
    )
}