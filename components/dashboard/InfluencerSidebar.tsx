'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

const links = [
    { href: '/dashboard/influencer/profile', label: 'Profile' },
    { href: '/dashboard/influencer/projects', label: 'My Projects' },
    { href: '/dashboard/influencer/inbox', label: 'Inbox' },
]

export default function InfluencerSidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/auth')          // redirect to login after clearing session
    }

    return (
        <aside className="w-64 bg-white border-r min-h-screen p-6 hidden md:flex md:flex-col">
            <h2 className="text-2xl font-bold mb-8">Creator Panel</h2>
            <nav className="flex-1 space-y-1">
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-black text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Sign Out button pinned at the bottom */}
            <button
                onClick={handleSignOut}
                className="mt-auto w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
                Sign Out
            </button>
        </aside>
    )
}