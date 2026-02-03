import { NextRequest, NextResponse } from 'next/server'
import { handleRetellWebhook } from '@/lib/retell'

/**
 * POST /api/webhooks/retell
 * Receives call completion webhooks from Retell.ai
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        // Validate required fields
        if (!payload.call_id) {
            return NextResponse.json(
                { error: 'Missing call_id' },
                { status: 400 }
            )
        }

        console.log('[Webhook] Retell event received:', payload.call_status)

        // Only process completed calls
        if (payload.call_status === 'ended' || payload.call_status === 'completed') {
            await handleRetellWebhook({
                call_id: payload.call_id,
                call_status: payload.call_status,
                duration_seconds: payload.duration_ms ? Math.round(payload.duration_ms / 1000) : undefined,
                transcript: payload.transcript,
                call_analysis: payload.call_analysis,
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Webhook] Retell error:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
