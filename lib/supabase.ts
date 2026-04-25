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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!url) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local or Vercel Environment Variables.'
        )
    }

    if (!serviceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local or Vercel Environment Variables.'
        )
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}