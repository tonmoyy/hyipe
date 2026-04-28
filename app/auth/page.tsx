'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthPage() {
    const [tab, setTab] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'influencer' | 'brand'>('influencer')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showGoogleRole, setShowGoogleRole] = useState(false)
    const router = useRouter()

    // Email/Password submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage('')
        setLoading(true)

        if (tab === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            setLoading(false)
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
            setLoading(false)
            if (error) setMessage(error.message)
            else setMessage('✅ Check your email to verify your account.')
        }
    }

    // OAuth handler
    const handleOAuth = async (provider: 'google' | 'apple', role?: 'influencer' | 'brand') => {
        setMessage('')
        setLoading(true)
        const redirectTo = role
            ? `${window.location.origin}/auth/callback?role=${role}`
            : `${window.location.origin}/auth/callback`

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo },
        })
        if (error) {
            setMessage(error.message)
            setLoading(false)
        }
        // On success, browser redirects, so loading stays true
    }

    // Google click – toggle inline role picker
    const handleGoogleClick = () => {
        setShowGoogleRole(!showGoogleRole)
    }

    const handleGoogleWithRole = (selectedRole: 'influencer' | 'brand') => {
        setShowGoogleRole(false)
        handleOAuth('google', selectedRole)
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

            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
                <button
                    onClick={handleGoogleClick}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded hover:bg-gray-50 transition"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Inline role picker for Google */}
                {showGoogleRole && (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                        <span className="text-sm text-gray-600">I am a:</span>
                        <button
                            onClick={() => handleGoogleWithRole('influencer')}
                            className="px-3 py-1 text-sm bg-blue-100 rounded hover:bg-blue-200 transition"
                        >
                            Influencer
                        </button>
                        <button
                            onClick={() => handleGoogleWithRole('brand')}
                            className="px-3 py-1 text-sm bg-green-100 rounded hover:bg-green-200 transition"
                        >
                            Brand
                        </button>
                    </div>
                )}

                {/* Apple button (role not yet handled – can be extended similarly) */}
                <button
                    onClick={() => handleOAuth('apple')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Continue with Apple
                </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">or</span>
                </div>
            </div>

            {/* Email/Password form */}
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
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {loading ? 'Loading…' : tab === 'login' ? 'Log In' : 'Sign Up'}
                </button>
            </form>

            {/* Forgot password link – only visible on login tab */}
            {tab === 'login' && (
                <div className="mt-3 text-center space-y-2">
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Forgot password?
                    </Link>
                    <p className="text-xs mt-2">
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