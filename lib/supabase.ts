// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import {createBrowserClient} from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ✅ Public client – now uses cookies, visible to proxy
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Admin client – ONLY for server‑side code (API routes, server components)
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local file.'
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}