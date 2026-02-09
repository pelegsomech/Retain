import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type Tenant,
} from '@/lib/firebase-admin'
import { sendSMS } from '@/lib/twilio'

/**
 * POST /api/inbound/emergency
 * 
 * Retell custom function: emergency_escalation
 * Called by the inbound AI agent when it detects an emergency situation
 * (flood, gas leak, fire, burst pipe, etc.)
 * 
 * This endpoint:
 * 1. Immediately SMS + attempts to notify the owner
 * 2. Logs the emergency with full details
 * 3. Returns safety guidance for the AI to relay to the caller
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Retell sends: { call: {...}, args: { caller_name, caller_phone, emergency_type, details, address } }
        const { call, args } = body
        const callId = call?.call_id
        const tenantId = call?.metadata?.tenant_id

        const {
            caller_name: callerName,
            caller_phone: callerPhone,
            emergency_type: emergencyType,
            details,
            address,
        } = args || {}

        console.log('[Inbound] 🚨 EMERGENCY:', { callId, emergencyType, callerPhone, address })

        if (!tenantId) {
            return NextResponse.json({
                result: buildEmergencyResponse(emergencyType, null),
            })
        }

        // Get tenant
        const tenantDoc = await collections.tenants.doc(tenantId).get()
        if (!tenantDoc.exists) {
            return NextResponse.json({
                result: buildEmergencyResponse(emergencyType, null),
            })
        }
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant
        const ownerPhone = tenant.inboundConfig?.ownerPhone

        // IMMEDIATELY notify the owner via SMS
        if (tenant.twilioFromPhone && ownerPhone) {
            const emergencySMS = `🚨 EMERGENCY CALL 🚨\n\nType: ${emergencyType?.toUpperCase() || 'UNKNOWN'}\n${callerName ? `Caller: ${callerName}` : ''}${callerPhone ? `\n📱 ${callerPhone}` : ''}${address ? `\n📍 ${address}` : ''}\n${details ? `\nDetails: ${details}` : ''}\n\n⚡ Call them back IMMEDIATELY`

            await sendSMS({
                to: ownerPhone,
                from: tenant.twilioFromPhone,
                body: emergencySMS,
            }).catch(err => console.error('[Inbound] Emergency SMS failed:', err))

            // Also notify all active team members
            try {
                const teamSnap = await collections.teamMembers
                    .where('tenantId', '==', tenantId)
                    .where('isActive', '==', true)
                    .where('receiveSMS', '==', true)
                    .get()

                await Promise.all(
                    teamSnap.docs.map(doc => {
                        const member = doc.data()
                        if (member.phone && member.phone !== ownerPhone) {
                            return sendSMS({
                                to: member.phone,
                                from: tenant.twilioFromPhone!,
                                body: emergencySMS,
                            }).catch(console.error)
                        }
                        return Promise.resolve()
                    })
                )
            } catch (err) {
                console.error('[Inbound] Team notification failed:', err)
            }
        }

        // Update inbound call record
        if (callId) {
            const callSnap = await collections.inboundCalls
                .where('retellCallId', '==', callId)
                .limit(1)
                .get()

            if (!callSnap.empty) {
                await callSnap.docs[0].ref.update({
                    outcome: 'emergency_escalated',
                    ownerNotified: true,
                    followUpRequired: true,
                    followUpNotes: `🚨 EMERGENCY: ${emergencyType}. ${details || ''} ${address ? `at ${address}` : ''}`,
                })
            }
        }

        // Log emergency event
        await logEvent(tenantId, 'INBOUND_EMERGENCY', undefined, {
            callId,
            callerPhone,
            callerName,
            emergencyType,
            details,
            address,
        })

        // Return safety guidance for the AI to relay
        return NextResponse.json({
            result: buildEmergencyResponse(emergencyType, tenant.companyName),
            emergency_logged: true,
            owner_notified: !!ownerPhone,
        })

    } catch (error) {
        console.error('[Inbound] Emergency escalation error:', error)
        return NextResponse.json({
            result: 'I have logged this as an emergency. Please stay safe — if you are in immediate danger, please call 911. Our team has been alerted and will contact you as soon as possible.',
        })
    }
}

// ============================================
// SAFETY RESPONSE BUILDER
// ============================================

function buildEmergencyResponse(emergencyType?: string, companyName?: string | null): string {
    const company = companyName || 'our team'
    const type = emergencyType?.toLowerCase() || ''

    const safetyTips: Record<string, string> = {
        'flood': `I've immediately alerted ${company}. While you wait: if safe to do so, turn off the main water valve. Move valuables to higher ground. If the water is rising rapidly, please evacuate and call 911.`,
        'gas leak': `I've immediately alerted ${company}. IMPORTANT: Do NOT turn on any lights or switches. Open windows if safe. Leave the building immediately and call 911 or your gas company's emergency line.`,
        'fire': `I've immediately alerted ${company}. Please evacuate the building IMMEDIATELY if you haven't already. Call 911 right away. Do not attempt to fight the fire yourself.`,
        'burst pipe': `I've immediately alerted ${company}. If you can safely reach the main water shutoff valve, please turn it off. Place buckets under the leak and move electronics away from the water.`,
        'electrical fire': `I've immediately alerted ${company}. Do NOT use water on an electrical fire. If you have a Class C fire extinguisher, use that. Otherwise, evacuate and call 911 immediately.`,
    }

    // Find matching safety tip
    for (const [keyword, tip] of Object.entries(safetyTips)) {
        if (type.includes(keyword)) {
            return `${tip} Someone from ${company} will be calling you back within minutes.`
        }
    }

    // Generic emergency response
    return `I have immediately alerted ${company} about this emergency. If you are in any immediate danger, please call 911 first. Someone from our team will be reaching out to you within minutes. Is there anything else I should pass along to them?`
}
