import { NextRequest, NextResponse } from 'next/server'
import { handleRetellWebhook } from '@/lib/retell'

/**
 * POST /api/webhooks/retell
 * Receives call completion webhooks from Retell.ai
 * 
 * Retell sends webhooks with structure:
 * { event: "call_started" | "call_ended" | "call_analyzed", call: { call_id, ... } }
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        console.log('[Webhook] Retell event received:', payload.event, JSON.stringify(payload).substring(0, 500))

        // Retell sends call data inside a `call` object
        const call = payload.call
        
        // Validate required fields - call_id is inside the call object
        if (!call?.call_id) {
            console.error('[Webhook] Missing call.call_id in payload:', Object.keys(payload))
            return NextResponse.json(
                { error: 'Missing call_id' },
                { status: 400 }
            )
        }

        // Extract call status from the call object
        const callStatus = call.call_status || call.status || payload.event

        console.log('[Webhook] Processing call:', {
            callId: call.call_id,
            status: callStatus,
            hasRecording: !!call.recording_url,
            hasTranscript: !!call.transcript,
            hasAnalysis: !!call.call_analysis,
        })

        // Process completed or analyzed calls
        if (callStatus === 'ended' || callStatus === 'completed' || payload.event === 'call_ended' || payload.event === 'call_analyzed') {
            await handleRetellWebhook({
                call_id: call.call_id,
                call_status: callStatus,
                duration_seconds: call.duration_ms ? Math.round(call.duration_ms / 1000) : (call.end_timestamp && call.start_timestamp ? Math.round((call.end_timestamp - call.start_timestamp) / 1000) : undefined),
                transcript: call.transcript,
                recording_url: call.recording_url,
                call_analysis: call.call_analysis,
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
