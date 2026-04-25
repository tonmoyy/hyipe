'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    { href: '/dashboard/influencer/profile', label: 'Profile' },
    { href: '/dashboard/influencer/projects', label: 'My Projects' },
    { href: '/dashboard/influencer/inbox', label: 'Inbox' },
]

export default function InfluencerSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-white border-r min-h-screen p-4 hidden md:block">
            <nav className="space-y-1">
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
        </aside>
    )
}