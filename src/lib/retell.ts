import { prisma } from '@/lib/db'
import { EventType, LeadStatus } from '@prisma/client'

// Retell.ai API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID
const RETELL_API_URL = 'https://api.retellai.com/v2'

interface RetellCallParams {
    leadId: string
    phone: string
    tenantId: string
    tenantName: string
    tenantNiche: string
    leadFirstName: string
    calendarLink?: string
}

interface RetellCallResponse {
    call_id: string
    agent_id: string
    status: string
}

/**
 * Initiate a Retell.ai voice call to a lead
 */
export async function initiateRetellCall(params: RetellCallParams): Promise<RetellCallResponse | null> {
    if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
        console.warn('[Retell] Not configured, skipping call')
        // Update lead with mock AI call status for demo
        await prisma.lead.update({
            where: { id: params.leadId },
            data: {
                aiCallId: `mock-call-${Date.now()}`,
                aiCallStartedAt: new Date(),
            },
        })
        return null
    }

    try {
        // Create call with dynamic metadata for agent personalization
        const response = await fetch(`${RETELL_API_URL}/create-phone-call`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: RETELL_AGENT_ID,
                to_number: params.phone,
                // Dynamic variables injected into agent prompt
                metadata: {
                    lead_id: params.leadId,
                    tenant_id: params.tenantId,
                    lead_name: params.leadFirstName,
                    company_name: params.tenantName,
                    industry: params.tenantNiche,
                    calendar_link: params.calendarLink,
                },
                // Custom greeting based on tenant
                retell_llm_dynamic_variables: {
                    company_name: params.tenantName,
                    lead_name: params.leadFirstName,
                    service_type: params.tenantNiche,
                },
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Retell API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json() as RetellCallResponse

        // Update lead with call info
        await prisma.lead.update({
            where: { id: params.leadId },
            data: {
                aiCallId: data.call_id,
                aiCallStartedAt: new Date(),
            },
        })

        // Log call initiated event
        await prisma.event.create({
            data: {
                tenantId: params.tenantId,
                leadId: params.leadId,
                type: EventType.AI_CALL_STARTED,
                payload: { callId: data.call_id },
            },
        })

        console.log(`[Retell] Call initiated: ${data.call_id}`)
        return data
    } catch (error) {
        console.error('[Retell] Failed to initiate call:', error)
        throw error
    }
}

/**
 * Handle Retell.ai webhook for call completion
 */
export async function handleRetellWebhook(payload: {
    call_id: string
    call_status: string
    duration_seconds?: number
    transcript?: string
    call_analysis?: {
        outcome?: string
        summary?: string
    }
}): Promise<void> {
    // Find lead by call ID
    const lead = await prisma.lead.findFirst({
        where: { aiCallId: payload.call_id },
    })

    if (!lead) {
        console.warn(`[Retell] Lead not found for call: ${payload.call_id}`)
        return
    }

    // Determine call outcome and new status
    let newStatus: typeof LeadStatus[keyof typeof LeadStatus] = LeadStatus.AI_QUALIFIED
    const outcome = payload.call_analysis?.outcome?.toLowerCase()

    if (outcome === 'booked' || outcome === 'appointment_scheduled') {
        newStatus = LeadStatus.BOOKED
    } else if (outcome === 'not_interested' || outcome === 'declined') {
        newStatus = LeadStatus.DISQUALIFIED
    } else if (outcome === 'callback' || outcome === 'reschedule') {
        newStatus = LeadStatus.CALLBACK_SCHEDULED
    }

    // Update lead
    await prisma.lead.update({
        where: { id: lead.id },
        data: {
            status: newStatus,
            aiCallEndedAt: new Date(),
            aiCallDuration: payload.duration_seconds,
            aiCallTranscript: payload.transcript,
            aiCallOutcome: payload.call_analysis?.outcome,
        },
    })

    // Log call completion event
    await prisma.event.create({
        data: {
            tenantId: lead.tenantId,
            leadId: lead.id,
            type: EventType.AI_CALL_COMPLETED,
            payload: {
                callId: payload.call_id,
                status: payload.call_status,
                duration: payload.duration_seconds,
                outcome: payload.call_analysis?.outcome,
            },
        },
    })

    console.log(`[Retell] Call completed: ${payload.call_id}, outcome: ${outcome}, status: ${newStatus}`)
}
