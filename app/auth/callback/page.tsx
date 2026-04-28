// app/auth/callback/page.tsx
'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ------------------ inner client component ------------------
function CallbackHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const role = searchParams.get('role')
        if (role) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
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

// ------------------ page component ------------------
export default function AuthCallback() {
    return (
        <Suspense fallback={<p className="p-6 text-center">Loading…</p>}>
            <CallbackHandler />
        </Suspense>
    )
}