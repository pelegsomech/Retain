import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type InboundCall,
    type Tenant,
} from '@/lib/firebase-admin'
import { sendSMS } from '@/lib/twilio'

/**
 * POST /api/inbound/webhook
 * 
 * Retell webhook for inbound call completion.
 * Called when an inbound Retell call ends (similar to /api/webhooks/retell but for inbound).
 * 
 * This creates/updates the inbound call record with transcript, recording, and outcome.
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        console.log('[Inbound Webhook] Event received:', payload.event)

        const call = payload.call
        if (!call?.call_id) {
            console.error('[Inbound Webhook] Missing call_id')
            return NextResponse.json({ error: 'Missing call_id' }, { status: 400 })
        }

        const callStatus = call.call_status || call.status || payload.event

        // Only process completed calls
        if (callStatus !== 'ended' && callStatus !== 'completed' &&
            payload.event !== 'call_ended' && payload.event !== 'call_analyzed') {
            return NextResponse.json({ success: true, skipped: true })
        }

        const tenantId = call.metadata?.tenant_id
        if (!tenantId) {
            console.warn('[Inbound Webhook] No tenant_id in call metadata')
            return NextResponse.json({ success: true })
        }

        // Find existing inbound call record or create new one
        let callDocRef
        const existingSnap = await collections.inboundCalls
            .where('retellCallId', '==', call.call_id)
            .limit(1)
            .get()

        if (!existingSnap.empty) {
            callDocRef = existingSnap.docs[0].ref
        } else {
            // Create new record (call may have been handled directly by Retell-managed number)
            callDocRef = collections.inboundCalls.doc()
            await callDocRef.set({
                tenantId,
                callerPhone: call.from_number || '',
                retellCallId: call.call_id,
                callStartedAt: call.start_timestamp
                    ? Timestamp.fromMillis(call.start_timestamp)
                    : Timestamp.now(),
                routeDecision: 'ai_handled',
                followUpRequired: false,
                ownerNotified: false,
                createdAt: Timestamp.now(),
            })
        }

        // Determine call outcome from analysis
        const outcome = call.call_analysis?.outcome?.toLowerCase()
        let inboundOutcome: InboundCall['outcome'] = 'info_provided'
        let followUpRequired = false

        if (outcome === 'booked' || outcome === 'appointment_scheduled') {
            inboundOutcome = 'appointment_booked'
        } else if (outcome === 'transferred') {
            inboundOutcome = 'transferred'
        } else if (outcome === 'emergency') {
            inboundOutcome = 'emergency_escalated'
            followUpRequired = true
        } else if (outcome === 'message_taken' || outcome === 'callback') {
            inboundOutcome = 'message_taken'
            followUpRequired = true
        } else if (outcome === 'service_call') {
            inboundOutcome = 'service_call_scheduled'
        }

        // Calculate duration
        const durationSeconds = call.duration_ms
            ? Math.round(call.duration_ms / 1000)
            : (call.end_timestamp && call.start_timestamp
                ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
                : undefined)

        // Update the call record with completion data
        await callDocRef.update({
            callEndedAt: Timestamp.now(),
            durationSeconds: durationSeconds || null,
            transcript: call.transcript || null,
            recordingUrl: call.recording_url || null,
            callSummary: call.call_analysis?.summary || null,
            outcome: inboundOutcome,
            followUpRequired,
            callerName: call.call_analysis?.caller_name || null,
        })

        // Log completion event
        await logEvent(tenantId, 'INBOUND_CALL_COMPLETED', undefined, {
            callId: call.call_id,
            inboundCallId: callDocRef.id,
            outcome: inboundOutcome,
            durationSeconds,
            hasRecording: !!call.recording_url,
            hasTranscript: !!call.transcript,
        })

        // Notify owner of call summary (unless already notified during the call)
        const callData = (await callDocRef.get()).data()
        if (!callData?.ownerNotified && tenantId) {
            const tenantDoc = await collections.tenants.doc(tenantId).get()
            if (tenantDoc.exists) {
                const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant
                const ownerPhone = tenant.inboundConfig?.ownerPhone

                if (tenant.twilioFromPhone && ownerPhone) {
                    const summary = call.call_analysis?.summary || 'No summary available'
                    const callerPhone = call.from_number || 'Unknown'
                    const callerName = call.call_analysis?.caller_name || ''

                    const outcomeEmoji: Record<string, string> = {
                        appointment_booked: '📅',
                        service_call_scheduled: '🔧',
                        message_taken: '💬',
                        info_provided: 'ℹ️',
                        transferred: '📞',
                        emergency_escalated: '🚨',
                    }

                    const emoji = outcomeEmoji[inboundOutcome] || '📞'
                    const smsBody = `${emoji} Call Summary\n${callerName ? `From: ${callerName}\n` : ''}📱 ${callerPhone}\n${durationSeconds ? `⏱ ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s\n` : ''}\n${summary}`

                    await sendSMS({
                        to: ownerPhone,
                        from: tenant.twilioFromPhone,
                        body: smsBody.substring(0, 1600), // SMS character limit
                    }).catch(err => console.error('[Inbound Webhook] Summary SMS failed:', err))

                    await callDocRef.update({ ownerNotified: true })
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Inbound Webhook] Error:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
