// app/auth/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
    const [tab, setTab] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'influencer' | 'brand'>('influencer')
    const [message, setMessage] = useState('')
    const [resetSent, setResetSent] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage('')
        setResetSent(false)

        if (tab === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setMessage(error.message)
            else router.push('/')
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role,
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/verified`,
                },
            })
            if (error) setMessage(error.message)
            else setMessage('✅ Check your email to verify your account.')
        }
    }

    // ✨ Forgot Password
    const handleForgotPassword = async () => {
        if (!email) {
            setMessage('Please enter your email first.')
            return
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) setMessage(error.message)
        else {
            setResetSent(true)
            setMessage('')
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl">
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={() => setTab('login')}
                    className={tab === 'login' ? 'font-bold' : ''}
                >
                    Login
                </button>
                <button
                    onClick={() => setTab('signup')}
                    className={tab === 'signup' ? 'font-bold' : ''}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'signup' && (
                    <input
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full border p-2 rounded"
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border p-2 rounded"
                />
                {tab === 'signup' && (
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'influencer' | 'brand')}
                        className="w-full border p-2 rounded"
                    >
                        <option value="influencer">Influencer</option>
                        <option value="brand">Brand</option>
                    </select>
                )}
                <button
                    type="submit"
                    className="w-full bg-black text-white py-2 rounded"
                >
                    {tab === 'login' ? 'Log In' : 'Sign Up'}
                </button>
            </form>

            {/* Forgot Password – only visible on login tab */}
            {tab === 'login' && (
                <div className="mt-3 text-center space-y-2">
                    <button
                        onClick={handleForgotPassword}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Forgot password?
                    </button>
                    {resetSent && (
                        <p className="text-sm text-green-600">
                            Password reset email sent! Check your inbox.
                        </p>
                    )}
                    <p className="text-xs mt-2 text-center">
                        Need to verify?{' '}
                        <a
                            href="#"
                            onClick={() => supabase.auth.resend({ type: 'signup', email })}
                            className="text-blue-600"
                        >
                            Resend email
                        </a>
                    </p>
                </div>
            )}

            {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
    )
}