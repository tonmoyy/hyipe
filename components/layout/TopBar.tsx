'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { HiHome, HiArrowRightOnRectangle } from 'react-icons/hi2'

export default function TopBar() {
    const { signOut } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/auth')
    }

    return (
        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-white border-b">
            <Link
                href="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
                <HiHome className="w-4 h-4" />
                Home
            </Link>

            <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                <HiArrowRightOnRectangle className="w-4 h-4" />
                Sign Out
            </button>
        </div>
    )
}