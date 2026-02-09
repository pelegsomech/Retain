import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type Tenant,
} from '@/lib/firebase-admin'
import { sendSMS } from '@/lib/twilio'

/**
 * POST /api/inbound/transfer
 * 
 * Retell custom function: transfer_to_owner
 * Called by the inbound AI agent when the caller requests to speak with a person,
 * or when the AI cannot handle the request.
 * 
 * This endpoint:
 * 1. Logs the transfer request
 * 2. Sends SMS to the owner with caller context
 * 3. Returns instructions for the AI to tell the caller
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Retell sends: { call: {...}, args: { reason, caller_name, caller_phone, topic } }
        const { call, args } = body
        const callId = call?.call_id
        const callerPhone = call?.from_number || args?.caller_phone
        const tenantId = call?.metadata?.tenant_id

        const {
            reason = 'Caller requested to speak with owner',
            caller_name: callerName,
            topic,
        } = args || {}

        console.log('[Inbound] Transfer request:', { callId, callerPhone, reason, topic })

        if (!tenantId) {
            return NextResponse.json({
                result: 'I apologize, but I am unable to transfer the call right now. Can I take a message and have someone call you back within the hour?',
            })
        }

        // Get tenant
        const tenantDoc = await collections.tenants.doc(tenantId).get()
        if (!tenantDoc.exists) {
            return NextResponse.json({
                result: 'I am unable to connect you right now. Can I take a message instead?',
            })
        }
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant
        const ownerPhone = tenant.inboundConfig?.ownerPhone

        if (!ownerPhone) {
            return NextResponse.json({
                result: 'Our team is currently unavailable. Let me take a detailed message and someone will call you back as soon as possible.',
            })
        }

        // Send SMS alert to owner
        if (tenant.twilioFromPhone) {
            const smsBody = `📞 Transfer Request\n${callerName ? `From: ${callerName}` : ''}${callerPhone ? `\n📱 ${callerPhone}` : ''}\n${topic ? `Re: ${topic}` : ''}\nReason: ${reason}\n\nCaller is on the line — call them back ASAP if you miss them.`

            await sendSMS({
                to: ownerPhone,
                from: tenant.twilioFromPhone,
                body: smsBody,
            }).catch(err => console.error('[Inbound] SMS to owner failed:', err))
        }

        // Update inbound call record if we can find it
        if (callId) {
            const callSnap = await collections.inboundCalls
                .where('retellCallId', '==', callId)
                .limit(1)
                .get()

            if (!callSnap.empty) {
                await callSnap.docs[0].ref.update({
                    routeDecision: 'transferred_to_owner',
                    transferredAt: Timestamp.now(),
                    outcome: 'transferred',
                    ownerNotified: true,
                    followUpNotes: `Transfer: ${reason}. Topic: ${topic || 'N/A'}`,
                })
            }
        }

        // Log event
        await logEvent(tenantId, 'INBOUND_CALL_TRANSFERRED', undefined, {
            callId,
            callerPhone,
            callerName,
            reason,
            topic,
        })

        // Tell the AI what to say to the caller
        return NextResponse.json({
            result: `I've notified our team that you'd like to speak with someone. They'll be calling you right back at this number. Is there anything specific you'd like me to pass along to them?`,
            transfer_initiated: true,
            owner_phone: ownerPhone,
        })

    } catch (error) {
        console.error('[Inbound] Transfer error:', error)
        return NextResponse.json({
            result: 'I was unable to complete the transfer. Let me take your information and have someone call you back shortly.',
        })
    }
}
