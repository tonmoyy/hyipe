'use client'

import { useAuth } from '@/providers/AuthProvider'
import Link from 'next/link'

export default function Header() {
    const { user, profile, signOut } = useAuth()

    return (
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
            <Link href="/" className="font-bold text-xl">HYIPE</Link>
            <nav className="flex items-center gap-4 text-sm">
                <Link href="/marketplace">Marketplace</Link>
                {user ? (
                    <>
            <span className="text-gray-600">
              {profile?.full_name || user.email}
            </span>
                        <Link href={`/dashboard/${profile?.role}/profile`}>Dashboard</Link>
                        <button onClick={signOut} className="text-red-600 hover:underline">
                            Sign Out
                        </button>
                    </>
                ) : (
                    <Link href="/auth" className="text-blue-600">Login / Sign Up</Link>
                )}
            </nav>
        </header>
    )
}