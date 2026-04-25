// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // ✅ Single response – all cookies are added to this
    const response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return request.cookies.get(name)?.value
                },
                set(name, value, options) {
                    // Update the request so later reads in the same request see it
                    request.cookies.set({ name, value, ...options })
                    // Add to the response WITHOUT creating a new one
                    response.cookies.set({ name, value, ...options })
                },
                remove(name, options) {
                    request.cookies.set({ name, value: '', ...options })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const path = request.nextUrl.pathname
    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/marketplace')

    // 1. No session – only public paths
    if (!session) {
        if (!isPublicPath) {
            const url = new URL('/auth', request.url)
            url.searchParams.set('redirect', path)
            return NextResponse.redirect(url)
        }
        return response
    }

    const user = session.user

    // 2. Already logged in – push away from /auth (except /auth/verified)
    if (path.startsWith('/auth') && !path.startsWith('/auth/verified')) {
        if (!user.email_confirmed_at) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        const role = profile?.role
        switch (role) {
            case 'influencer':
                return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
            case 'brand':
                return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
            case 'admin':
                return NextResponse.redirect(new URL('/admin', request.url))
            default:
                await supabase.auth.signOut()
                return NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    // 3. Email not confirmed – stay in public area
    if (!user.email_confirmed_at) {
        if (!isPublicPath) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return response
    }

    // 4. Verified user – enforce role routing
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (error || !profile) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    const role = profile.role

    if (path === '/') {
        switch (role) {
            case 'influencer':
                return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
            case 'brand':
                return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
            case 'admin':
                return NextResponse.redirect(new URL('/admin', request.url))
            default:
                await supabase.auth.signOut()
                return NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    if (role === 'admin' && !path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin', request.url))
    } else if (role === 'brand' && !path.startsWith('/dashboard/brand') && !isPublicPath) {
        return NextResponse.redirect(new URL('/dashboard/brand/campaigns', request.url))
    } else if (role === 'influencer' && !path.startsWith('/dashboard/influencer') && !isPublicPath) {
        return NextResponse.redirect(new URL('/dashboard/influencer/profile', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}