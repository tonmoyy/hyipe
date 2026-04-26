// app/api/admin/delete-user/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()
        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
        }

        const supabaseAdmin = getSupabaseAdmin()

        // 1. Delete from public.profiles
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) throw profileError

        // 2. Delete from auth.users (admin API)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) throw authError

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Permanent delete error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}