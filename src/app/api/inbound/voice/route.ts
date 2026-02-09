import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type Tenant,
    type InboundCall,
} from '@/lib/firebase-admin'
import { routeInboundCall } from '@/lib/inbound-router'
import { sendSMS } from '@/lib/twilio'

/**
 * POST /api/inbound/voice
 * 
 * Twilio webhook for incoming calls.
 * When a business owner's calls are forwarded to their Retell number,
 * this webhook is called by Retell/Twilio to determine routing.
 * 
 * For Retell-managed numbers, Retell handles the inbound directly.
 * This endpoint serves as the fallback/override routing layer — it's called
 * by the Retell webhook when a call completes, or by Twilio if using BYOC.
 * 
 * Primary flow:
 * 1. Caller dials owner → forwarded to Retell number → Retell agent answers
 * 2. After call completes, Retell webhook hits /api/webhooks/retell
 * 3. This endpoint handles pre-routing (VIP detection, blocking) for BYOC setups
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || ''

        let callerPhone: string
        let calledNumber: string
        let callSid: string

        // Handle both JSON (Retell) and form-data (Twilio) payloads
        if (contentType.includes('application/x-www-form-urlencoded')) {
            // Twilio sends form data
            const formData = await req.formData()
            callerPhone = formData.get('From') as string
            calledNumber = formData.get('To') as string
            callSid = formData.get('CallSid') as string
        } else {
            // JSON payload (from Retell or our own internal routing)
            const body = await req.json()
            callerPhone = body.from || body.caller_phone
            calledNumber = body.to || body.called_number
            callSid = body.call_sid || body.callSid
        }

        console.log(`[Inbound] Call received: ${callerPhone} → ${calledNumber} (SID: ${callSid})`)

        // Look up tenant by inbound phone number
        const tenant = await findTenantByInboundNumber(calledNumber)
        if (!tenant || !tenant.inboundConfig) {
            console.warn(`[Inbound] No tenant found for number: ${calledNumber}`)
            // Return TwiML to play a generic message
            return new NextResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say>Sorry, this number is not currently in service. Please try again later.</Say>
                    <Hangup/>
                </Response>`,
                { headers: { 'Content-Type': 'text/xml' } }
            )
        }

        const config = tenant.inboundConfig

        // Route the call
        const route = routeInboundCall(callerPhone, config)

        console.log(`[Inbound] Route decision: ${route.decision} — ${route.reason}`)

        // Create inbound call record
        const callRef = collections.inboundCalls.doc()
        const callData: Omit<InboundCall, 'id'> = {
            tenantId: tenant.id,
            callerPhone,
            twilioCallSid: callSid,
            callStartedAt: Timestamp.now(),
            routeDecision: route.decision,
            followUpRequired: false,
            ownerNotified: false,
            createdAt: Timestamp.now(),
        }
        await callRef.set(callData)

        // Log event
        await logEvent(tenant.id, 'INBOUND_CALL_RECEIVED', undefined, {
            callerPhone,
            callSid,
            routeDecision: route.decision,
            inboundCallId: callRef.id,
        })

        // Handle based on route decision
        switch (route.decision) {
            case 'vip_transfer': {
                // VIP: Immediately forward to owner's personal phone
                await logEvent(tenant.id, 'INBOUND_CALL_TRANSFERRED', undefined, {
                    inboundCallId: callRef.id,
                    reason: `VIP: ${route.vipLabel}`,
                })

                // Notify owner via SMS
                if (tenant.twilioFromPhone && config.ownerPhone) {
                    await sendSMS({
                        to: config.ownerPhone,
                        from: tenant.twilioFromPhone,
                        body: `📞 VIP call from ${route.vipLabel} (${callerPhone}) — transferring to you now.`,
                    }).catch(console.error)
                }

                return new NextResponse(
                    `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say>Please hold while I connect you.</Say>
                        <Dial timeout="30" callerId="${calledNumber}">
                            <Number>${config.ownerPhone}</Number>
                        </Dial>
                        <Say>I'm sorry, no one is available right now. Please try again later.</Say>
                    </Response>`,
                    { headers: { 'Content-Type': 'text/xml' } }
                )
            }

            case 'blocked': {
                // Blocked: Politely decline
                await callRef.update({
                    outcome: 'spam_blocked',
                    callEndedAt: Timestamp.now(),
                })

                return new NextResponse(
                    `<?xml version="1.0" encoding="UTF-8"?>
                    <Response>
                        <Say>Thank you for calling. We are unable to take your call at this time. Goodbye.</Say>
                        <Hangup/>
                    </Response>`,
                    { headers: { 'Content-Type': 'text/xml' } }
                )
            }

            case 'ai_handled':
            default: {
                // Standard: Let Retell handle it
                // If using Retell-managed numbers, Retell already picks up
                // If using Twilio BYOC, we redirect to Retell via SIP

                // For Retell-managed numbers, return a simple acknowledgment
                // Retell is already handling the call — this endpoint just logs it
                return NextResponse.json({
                    success: true,
                    inboundCallId: callRef.id,
                    routeDecision: route.decision,
                    greeting: route.greeting,
                })
            }
        }
    } catch (error) {
        console.error('[Inbound] Voice webhook error:', error)
        return NextResponse.json(
            { error: 'Failed to process inbound call' },
            { status: 500 }
        )
    }
}

// ============================================
// HELPERS
// ============================================

async function findTenantByInboundNumber(phoneNumber: string): Promise<Tenant | null> {
    // Normalize the phone number for comparison
    const normalized = phoneNumber.replace(/\D/g, '')

    // Query tenants with inbound config containing this number
    const snapshot = await collections.tenants
        .where('inboundConfig.inboundPhoneNumber', '==', phoneNumber)
        .limit(1)
        .get()

    if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return { id: doc.id, ...doc.data() } as Tenant
    }

    // Fallback: try with/without +1 prefix
    const variants = [
        `+${normalized}`,
        `+1${normalized}`,
        normalized,
    ]

    for (const variant of variants) {
        const snap = await collections.tenants
            .where('inboundConfig.inboundPhoneNumber', '==', variant)
            .limit(1)
            .get()
        if (!snap.empty) {
            const doc = snap.docs[0]
            return { id: doc.id, ...doc.data() } as Tenant
        }
    }

    return null
}
