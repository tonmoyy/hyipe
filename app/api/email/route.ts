import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    const { campaignId, brandId, influencerName } = await req.json()
    // Use a mail service like Resend or Nodemailer; for demo, log
    console.log(`Notify brand ${brandId}: ${influencerName} applied to campaign ${campaignId}`)
    return NextResponse.json({ success: true })
}