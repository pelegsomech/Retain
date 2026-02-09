import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type Tenant,
} from '@/lib/firebase-admin'
import { sendSMS } from '@/lib/twilio'

/**
 * POST /api/inbound/message
 * 
 * Retell custom function: take_message
 * Called by the inbound AI agent to record a message from the caller
 * when the owner is unavailable or the caller doesn't want to wait.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Retell sends: { call: {...}, args: { caller_name, caller_phone, message, urgency } }
        const { call, args } = body
        const callId = call?.call_id
        const tenantId = call?.metadata?.tenant_id

        const {
            caller_name: callerName = 'Unknown caller',
            caller_phone: callerPhone,
            message = '',
            urgency = 'medium',
        } = args || {}

        console.log('[Inbound] Message taken:', { callId, callerName, urgency })

        if (!tenantId) {
            return NextResponse.json({
                result: `Got it! I've noted your message. Someone will get back to you as soon as possible.`,
            })
        }

        // Get tenant
        const tenantDoc = await collections.tenants.doc(tenantId).get()
        if (!tenantDoc.exists) {
            return NextResponse.json({
                result: `I've got your message. Someone will call you back shortly.`,
            })
        }
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant
        const ownerPhone = tenant.inboundConfig?.ownerPhone

        // Update inbound call record
        if (callId) {
            const callSnap = await collections.inboundCalls
                .where('retellCallId', '==', callId)
                .limit(1)
                .get()

            if (!callSnap.empty) {
                await callSnap.docs[0].ref.update({
                    outcome: 'message_taken',
                    callerName,
                    followUpRequired: true,
                    followUpNotes: `Message from ${callerName}: ${message}`,
                    ownerNotified: !!ownerPhone,
                })
            }
        }

        // SMS the message to the owner
        if (tenant.twilioFromPhone && ownerPhone) {
            const urgencyEmoji = urgency === 'high' ? '🔴' : urgency === 'medium' ? '🟡' : '🟢'
            const smsBody = `${urgencyEmoji} New Message\n\nFrom: ${callerName}${callerPhone ? `\n📱 ${callerPhone}` : ''}\n\n"${message}"\n\nUrgency: ${urgency}`

            await sendSMS({
                to: ownerPhone,
                from: tenant.twilioFromPhone,
                body: smsBody,
            }).catch(err => console.error('[Inbound] Message SMS failed:', err))
        }

        // Log event
        await logEvent(tenantId, 'INBOUND_MESSAGE_TAKEN', undefined, {
            callId,
            callerName,
            callerPhone,
            message,
            urgency,
        })

        // Confirmation for the AI to tell the caller
        const timeEstimate = urgency === 'high' ? 'within the hour' : 'today'
        return NextResponse.json({
            result: `I've delivered your message to the team. Someone will get back to you ${timeEstimate}. Is there anything else you'd like me to add?`,
            message_saved: true,
        })

    } catch (error) {
        console.error('[Inbound] Message error:', error)
        return NextResponse.json({
            result: `I've noted your message. Someone from our team will call you back shortly.`,
        })
    }
}
