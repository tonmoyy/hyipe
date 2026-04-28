'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const role = searchParams.get('role')
        if (role) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    // Update profile role if user exists
                    supabase
                        .from('profiles')
                        .upsert({ id: user.id, role }, { onConflict: 'id' })
                        .then(() => router.push('/'))
                } else {
                    router.push('/')
                }
            })
        } else {
            router.push('/')
        }
    }, [router, searchParams])

    return <p className="p-6 text-center">Completing sign‑in…</p>
}