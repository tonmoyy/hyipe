'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

const links = [
    { href: '/admin/users', label: 'User Management' },
    { href: '/admin/campaigns', label: 'Campaign Monitor' },
    { href: '/admin/inbox', label: 'Inbox Viewer' },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/auth')
    }

    return (
        <aside className="w-64 bg-white border-r min-h-screen p-4 hidden md:flex md:flex-col">
            <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
            <nav className="flex-1 space-y-1">
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Sign Out button at the bottom */}
            <button
                onClick={handleSignOut}
                className="mt-4 w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
                Sign Out
            </button>
        </aside>
    )
}