import {
    collections,
    Timestamp,
    logEvent,
    storage,
    type Lead,
    type ContractorType,
    type LeadStatus,
} from '@/lib/firebase-admin'
import {
    type AtomicConfig,
    buildRetellVariables,
    migrateFromLegacyTenant,
} from '@/lib/atomic-config'

// Retell.ai API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID
const RETELL_API_URL = 'https://api.retellai.com/v2'

interface RetellCallParams {
    leadId: string
    phone: string
    tenantId: string
    tenantName: string
    fromNumber: string           // Required: Outbound caller ID (Twilio phone)

    // Atomic Configuration (preferred - new structured config)
    atomicConfig?: AtomicConfig

    // Legacy contractor context (kept for backwards compatibility)
    contractorType?: ContractorType
    serviceList?: string[]       // ["roof repair", "roof replacement", "gutters"]
    aiGreeting?: string          // Custom opening line
    toneStyle?: string           // professional, casual, friendly

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

    // Lead context for Retell variables
    const leadContext = {
        firstName: params.leadFirstName,
        lastName: params.leadLastName,
        address: params.leadAddress,
        city: params.leadCity,
        projectNotes: params.projectNotes,
    }

    // Build dynamic variables - prefer atomicConfig if available
    let dynamicVariables: Record<string, string>

    if (params.atomicConfig) {
        // Use new atomic config for rich variables
        dynamicVariables = buildRetellVariables(params.atomicConfig, leadContext)
        console.log('[Retell] Using atomic config for dynamic variables')
    } else {
        // Fallback to legacy fields
        const contractorType = params.contractorType || 'GENERAL'
        const serviceCategory = getServiceCategory(contractorType)
        const serviceListStr = params.serviceList && params.serviceList.length > 0
            ? params.serviceList.join(', ')
            : serviceCategory

        dynamicVariables = {
            // Company context
            brand_name: params.tenantName,
            company_name: params.tenantName,
            service_category: serviceCategory,
            services_offered: serviceListStr,
            tone_style: params.toneStyle || 'professional',

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
        }
    }

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
                from_number: params.fromNumber,
                // Metadata for tracking and logging
                metadata: {
                    lead_id: params.leadId,
                    tenant_id: params.tenantId,
                    contractor_type: params.atomicConfig?.business_identity.industry_niche || params.contractorType || 'GENERAL',
                    lead_name: `${params.leadFirstName} ${params.leadLastName || ''}`.trim(),
                    lead_address: params.leadAddress,
                    lead_city: params.leadCity,
                },
                // Dynamic variables injected into agent prompt
                retell_llm_dynamic_variables: dynamicVariables,
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
 * Download recording from Retell and upload to Firebase Storage
 * Retell recording URLs expire after 10 minutes, so we need to store them permanently
 */
async function downloadAndStoreRecording(
    recordingUrl: string,
    tenantId: string,
    callId: string
): Promise<string | null> {
    try {
        console.log(`[Retell] Downloading recording from: ${recordingUrl}`)

        // Download the recording from Retell
        const response = await fetch(recordingUrl)
        if (!response.ok) {
            console.error(`[Retell] Failed to download recording: ${response.status}`)
            return null
        }

        const audioBuffer = await response.arrayBuffer()
        const audioData = Buffer.from(audioBuffer)

        // Upload to Firebase Storage
        const bucket = storage.bucket()
        const fileName = `recordings/${tenantId}/${callId}.wav`
        const file = bucket.file(fileName)

        await file.save(audioData, {
            contentType: 'audio/wav',
            metadata: {
                cacheControl: 'public, max-age=31536000', // Cache for 1 year
            },
        })

        // Make the file publicly accessible
        await file.makePublic()

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        console.log(`[Retell] Recording uploaded to: ${publicUrl}`)

        return publicUrl
    } catch (error) {
        console.error('[Retell] Failed to download/store recording:', error)
        return null
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
    recording_url?: string
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
    } else if (outcome === 'no_answer' || outcome === 'voicemail') {
        newStatus = 'NO_ANSWER'
    }

    // Download and store recording if URL provided
    let permanentRecordingUrl: string | null = null
    if (payload.recording_url) {
        permanentRecordingUrl = await downloadAndStoreRecording(
            payload.recording_url,
            lead.tenantId,
            payload.call_id
        )
    }

    // Update lead with all call data
    await collections.leads.doc(lead.id).update({
        status: newStatus,
        aiCallEndedAt: Timestamp.now(),
        aiCallDuration: payload.duration_seconds || null,
        aiCallTranscript: payload.transcript || null,
        aiCallRecordingUrl: permanentRecordingUrl || null,
        aiCallOutcome: payload.call_analysis?.outcome || null,
        aiCallSummary: payload.call_analysis?.summary || null,
        updatedAt: Timestamp.now(),
    })

    // Log call completion event
    await logEvent(lead.tenantId, 'AI_CALL_ENDED', lead.id, {
        callId: payload.call_id,
        status: payload.call_status,
        duration: payload.duration_seconds,
        outcome: payload.call_analysis?.outcome,
        hasRecording: !!permanentRecordingUrl,
        hasTranscript: !!payload.transcript,
    })

    console.log(`[Retell] Call completed: ${payload.call_id}, outcome: ${outcome}, status: ${newStatus}`)
}

