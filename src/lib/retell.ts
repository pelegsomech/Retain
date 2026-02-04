import {
    collections,
    Timestamp,
    logEvent,
    type Lead,
    type ContractorType,
    type LeadStatus,
} from '@/lib/firebase-admin'

// Retell.ai API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID
const RETELL_API_URL = 'https://api.retellai.com/v2'

interface RetellCallParams {
    leadId: string
    phone: string
    tenantId: string
    tenantName: string

    // Contractor context (new - enhanced)
    contractorType: ContractorType
    serviceList: string[]        // ["roof repair", "roof replacement", "gutters"]
    aiGreeting?: string          // Custom opening line
    toneStyle: string            // professional, casual, friendly

    // Lead context
    leadFirstName: string
    leadLastName?: string
    leadAddress?: string
    leadCity?: string
    projectNotes?: string

    // Booking
    calendarLink?: string
}

interface RetellCallResponse {
    call_id: string
    agent_id: string
    status: string
}

/**
 * Convert ContractorType enum to human-readable service category
 */
function getServiceCategory(type: ContractorType): string {
    const categories: Record<ContractorType, string> = {
        GENERAL: 'general contracting',
        ROOFING: 'roofing',
        HVAC: 'HVAC and climate control',
        HARDSCAPING: 'hardscaping and outdoor living',
        ADU: 'ADU and accessory dwelling units',
        KITCHEN_BATH: 'kitchen and bathroom remodeling',
        SIDING: 'siding and exterior',
        DECKING: 'decking and outdoor structures',
        PLUMBING: 'plumbing',
        ELECTRICAL: 'electrical',
        PAINTING: 'painting and finishing',
        LANDSCAPING: 'landscaping',
        SOLAR: 'solar installation',
        WINDOWS_DOORS: 'windows and doors',
        FLOORING: 'flooring',
        REMODELING: 'home remodeling',
    }
    return categories[type] || 'home improvement'
}

/**
 * Initiate a Retell.ai voice call to a lead
 */
export async function initiateRetellCall(params: RetellCallParams): Promise<RetellCallResponse | null> {
    if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
        console.warn('[Retell] Not configured, skipping call')
        // Update lead with mock AI call status for demo
        await collections.leads.doc(params.leadId).update({
            aiCallId: `mock-call-${Date.now()}`,
            aiCallStartedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        })
        return null
    }

    const serviceCategory = getServiceCategory(params.contractorType)
    const serviceListStr = params.serviceList.length > 0
        ? params.serviceList.join(', ')
        : serviceCategory

    try {
        // Create call with rich dynamic metadata for agent personalization
        const response = await fetch(`${RETELL_API_URL}/create-phone-call`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: RETELL_AGENT_ID,
                to_number: params.phone,
                // Metadata for tracking and logging
                metadata: {
                    lead_id: params.leadId,
                    tenant_id: params.tenantId,
                    contractor_type: params.contractorType,
                    lead_name: `${params.leadFirstName} ${params.leadLastName || ''}`.trim(),
                    lead_address: params.leadAddress,
                    lead_city: params.leadCity,
                },
                // Dynamic variables injected into agent prompt
                retell_llm_dynamic_variables: {
                    // Company context
                    company_name: params.tenantName,
                    service_category: serviceCategory,
                    services_offered: serviceListStr,
                    tone_style: params.toneStyle,

                    // Lead context
                    lead_name: params.leadFirstName,
                    lead_full_name: `${params.leadFirstName} ${params.leadLastName || ''}`.trim(),
                    lead_address: params.leadAddress || 'not provided',
                    lead_city: params.leadCity || 'your area',
                    project_notes: params.projectNotes || '',

                    // Custom greeting (if set)
                    custom_greeting: params.aiGreeting || '',

                    // Booking
                    calendar_link: params.calendarLink || '',
                    has_calendar: params.calendarLink ? 'true' : 'false',
                },
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Retell API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json() as RetellCallResponse

        // Update lead with call info
        await collections.leads.doc(params.leadId).update({
            aiCallId: data.call_id,
            aiCallStartedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        })

        // Log call initiated event
        await logEvent(params.tenantId, 'AI_CALL_STARTED', params.leadId, { callId: data.call_id })

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
    const snapshot = await collections.leads
        .where('aiCallId', '==', payload.call_id)
        .limit(1)
        .get()

    if (snapshot.empty) {
        console.warn(`[Retell] Lead not found for call: ${payload.call_id}`)
        return
    }

    const leadDoc = snapshot.docs[0]
    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

    // Determine call outcome and new status
    let newStatus: LeadStatus = 'AI_QUALIFIED'
    const outcome = payload.call_analysis?.outcome?.toLowerCase()

    if (outcome === 'booked' || outcome === 'appointment_scheduled') {
        newStatus = 'BOOKED'
    } else if (outcome === 'not_interested' || outcome === 'declined') {
        newStatus = 'DISQUALIFIED'
    } else if (outcome === 'callback' || outcome === 'reschedule') {
        newStatus = 'CALLBACK_SCHEDULED'
    }

    // Update lead
    await collections.leads.doc(lead.id).update({
        status: newStatus,
        aiCallEndedAt: Timestamp.now(),
        aiCallDuration: payload.duration_seconds || null,
        aiCallTranscript: payload.transcript || null,
        aiCallOutcome: payload.call_analysis?.outcome || null,
        updatedAt: Timestamp.now(),
    })

    // Log call completion event
    await logEvent(lead.tenantId, 'AI_CALL_ENDED', lead.id, {
        callId: payload.call_id,
        status: payload.call_status,
        duration: payload.duration_seconds,
        outcome: payload.call_analysis?.outcome,
    })

    console.log(`[Retell] Call completed: ${payload.call_id}, outcome: ${outcome}, status: ${newStatus}`)
}
