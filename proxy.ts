// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    console.log('session:', session?.user?.email)

    const path = request.nextUrl.pathname
    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/marketplace')

    if (!session) {
        if (!isPublicPath) {
            const url = new URL('/auth', request.url)
            url.searchParams.set('redirect', path)
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    const user = session.user

    if (path.startsWith('/auth') && !path.startsWith('/auth/verified')) {
        if (user.email_confirmed_at) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
            const role = profile?.role
            if (role === 'influencer') return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
            if (role === 'brand') return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
        }
        return supabaseResponse
    }

    if (!user.email_confirmed_at) {
        if (!isPublicPath) return NextResponse.redirect(new URL('/', request.url))
        return supabaseResponse
    }

    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (error || !profile) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    const role = profile.role

    if (path === '/') {
        switch (role) {
            case 'influencer': return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
            case 'brand': return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
            case 'admin': return NextResponse.redirect(new URL('/admin', request.url))
            default: await supabase.auth.signOut(); return NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    if (role === 'admin' && !path.startsWith('/admin')) return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'brand' && !path.startsWith('/dashboard/brand') && !isPublicPath) return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
    if (role === 'influencer' && !path.startsWith('/dashboard/influencer') && !isPublicPath) return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))

    return supabaseResponse
}

// ✅ Use the new config export for proxy
export const config = {
    runtime: 'nodejs',                                   // required
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}