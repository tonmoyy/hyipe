// app/api/email/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { campaignId, brandId, influencerName } = await req.json()

        // Dynamically import the admin client – this runs only at request time
        const { getSupabaseAdmin } = await import('@/lib/supabase')
        const supabaseAdmin = getSupabaseAdmin()

        const { data: campaign } = await supabaseAdmin
            .from('campaigns')
            .select('title')
            .eq('id', campaignId)
            .single()

        const { data: brandProfile } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', brandId)
            .single()

        console.log('📧 Notification:')
        console.log(`   To: ${brandProfile?.email || brandId}`)
        console.log(`   Subject: New application for "${campaign?.title || 'Untitled'}"`)
        console.log(`   Body: ${influencerName || 'Someone'} has applied to your campaign.`)

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Email notification error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}