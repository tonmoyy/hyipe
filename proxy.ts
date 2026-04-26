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

    // 🔐 Secure user fetch
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname

    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/marketplace')

    if (userError || !user) {
        // No valid session
        if (!isPublicPath) {
            const url = new URL('/auth', request.url)
            url.searchParams.set('redirect', path)
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // If user exists but email not confirmed
    if (!user.email_confirmed_at) {
        if (!isPublicPath) return NextResponse.redirect(new URL('/', request.url))
        return supabaseResponse
    }

    // Redirect away from /auth (except /auth/verified & /auth/banned)
    if (
        path.startsWith('/auth') &&
        !path.startsWith('/auth/verified') &&
        !path.startsWith('/auth/banned')
    ) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        const role = profile?.role
        if (role === 'influencer') return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
        if (role === 'brand') return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
        if (role === 'admin' || role === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url))
        return supabaseResponse
    }

    // Fetch full profile (role + banned)
    const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role, banned')
        .eq('id', user.id)
        .maybeSingle()

    if (error || !profileData) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    const role = profileData.role
    const banned = profileData.banned

    // BAN CHECK
    if (banned && role !== 'admin' && role !== 'super_admin') {
        if (path !== '/auth/banned') {
            return NextResponse.redirect(new URL('/auth/banned', request.url))
        }
        return supabaseResponse
    }

    // Role‑based routing
    if (role === 'admin' && !path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'brand' && !path.startsWith('/dashboard/brand') && !isPublicPath) {
        return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
    }
    if (role === 'influencer' && !path.startsWith('/dashboard/influencer') && !isPublicPath) {
        return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}