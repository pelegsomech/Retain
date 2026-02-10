/**
 * Retell Inbound Agent Manager
 * 
 * Handles creating, configuring, and managing per-tenant inbound Retell agents.
 * Each tenant gets a dedicated Retell phone number + agent for inbound calls.
 */

import type { Tenant, InboundConfig, ServiceMenuItem } from './firebase-admin'
import type { AtomicConfig } from './atomic-config'

const RETELL_API_KEY = process.env.RETELL_API_KEY
const RETELL_API_BASE = 'https://api.retellai.com'  // Root URL for agent/LLM management
const RETELL_API_V2 = 'https://api.retellai.com/v2' // /v2 for phone calls

// ============================================
// RETELL LLM (Response Engine) CREATION
// ============================================

interface RetellLLMResponse {
    llm_id: string
    version: number
}

// ============================================
// INBOUND AGENT CREATION
// ============================================

interface CreateInboundAgentParams {
    tenant: Tenant
    ownerPhone: string
}

interface RetellAgentResponse {
    agent_id: string
    agent_name: string
}

interface RetellPhoneNumberResponse {
    phone_number: string
    phone_number_pretty: string
    inbound_agent_id?: string
}

/**
 * Step 1: Create a Retell LLM (Response Engine) with prompt + tools
 * Must be created before the agent.
 */
async function createInboundLLM(
    tenant: Tenant
): Promise<RetellLLMResponse> {
    const prompt = buildInboundPrompt(tenant)
    const tools = buildInboundTools(tenant)
    const greeting = tenant.inboundConfig?.businessHoursGreeting
        || `Thank you for calling ${tenant.companyName}! How can I help you today?`

    const response = await fetch(`${RETELL_API_BASE}/create-retell-llm`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4.1-mini',
            general_prompt: prompt,
            general_tools: tools,
            begin_message: greeting,
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Retell LLM creation failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as RetellLLMResponse
    console.log(`[RetellInbound] LLM created: ${data.llm_id} for ${tenant.companyName}`)
    return data
}

/**
 * Step 2: Create a Retell Agent and attach the LLM
 * Returns the agent ID + LLM ID
 */
export async function createInboundAgent(
    params: CreateInboundAgentParams
): Promise<(RetellAgentResponse & { llm_id: string }) | null> {
    if (!RETELL_API_KEY) {
        console.warn('[RetellInbound] Not configured, skipping agent creation')
        return null
    }

    const { tenant } = params

    try {
        // Step 1: Create the LLM (Response Engine) with prompt + tools
        const llm = await createInboundLLM(tenant)

        // Step 2: Create the Agent and attach the LLM
        const response = await fetch(`${RETELL_API_BASE}/create-agent`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_name: `${tenant.companyName} - Inbound`,
                response_engine: {
                    type: 'retell-llm',
                    llm_id: llm.llm_id,
                },
                voice_id: '11labs-Adrian',
                language: 'en-US',
                // ambient_sound omitted — defaults to none
                responsiveness: 0.8,
                interruption_sensitivity: 0.7,
                enable_backchannel: true,
                backchannel_frequency: 0.6,
                reminder_trigger_ms: 10000,
                reminder_max_count: 2,
                webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://retain-backend--retaincrm-ab8ab.us-central1.hosted.app'}/api/inbound/webhook`,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            // Cleanup LLM if agent creation fails
            await deleteRetellLLM(llm.llm_id)
            throw new Error(`Retell Agent creation failed: ${response.status} - ${errorText}`)
        }

        const data = await response.json() as RetellAgentResponse
        console.log(`[RetellInbound] Agent created: ${data.agent_id} (LLM: ${llm.llm_id}) for ${tenant.companyName}`)
        return { ...data, llm_id: llm.llm_id }
    } catch (error) {
        console.error('[RetellInbound] Failed to create agent:', error)
        throw error
    }
}

/**
 * Purchase a Retell-managed phone number and associate it with the inbound agent
 */
export async function purchaseInboundNumber(
    agentId: string,
    areaCode?: string
): Promise<RetellPhoneNumberResponse | null> {
    if (!RETELL_API_KEY) {
        console.warn('[RetellInbound] Not configured, skipping number purchase')
        return null
    }

    try {
        const response = await fetch(`${RETELL_API_BASE}/create-phone-number`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inbound_agent_id: agentId,
                area_code: areaCode ? parseInt(areaCode) : undefined,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Retell API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json() as RetellPhoneNumberResponse
        console.log(`[RetellInbound] Phone number purchased: ${data.phone_number}`)
        return data
    } catch (error) {
        console.error('[RetellInbound] Failed to purchase number:', error)
        throw error
    }
}

/**
 * Update an existing inbound agent's configuration
 */
export async function updateInboundAgent(
    agentId: string,
    tenant: Tenant,
    llmId?: string,
): Promise<void> {
    if (!RETELL_API_KEY) return

    try {
        // Update the LLM (prompt + tools) if we have the LLM ID
        if (llmId) {
            const prompt = buildInboundPrompt(tenant)
            const tools = buildInboundTools(tenant)
            const greeting = tenant.inboundConfig?.businessHoursGreeting
                || `Thank you for calling ${tenant.companyName}! How can I help you today?`

            const llmResponse = await fetch(`${RETELL_API_BASE}/update-retell-llm/${llmId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${RETELL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    general_prompt: prompt,
                    general_tools: tools,
                    begin_message: greeting,
                }),
            })

            if (!llmResponse.ok) {
                const errorText = await llmResponse.text()
                console.error(`[RetellInbound] Failed to update LLM: ${llmResponse.status} - ${errorText}`)
            } else {
                console.log(`[RetellInbound] LLM updated: ${llmId}`)
            }
        }

        // Update the agent name
        const response = await fetch(`${RETELL_API_BASE}/update-agent/${agentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_name: `${tenant.companyName} - Inbound`,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Retell API error: ${response.status} - ${errorText}`)
        }

        console.log(`[RetellInbound] Agent updated: ${agentId}`)
    } catch (error) {
        console.error('[RetellInbound] Failed to update agent:', error)
        throw error
    }
}

/**
 * Delete a Retell LLM
 */
async function deleteRetellLLM(llmId: string): Promise<void> {
    if (!RETELL_API_KEY) return

    try {
        await fetch(`${RETELL_API_BASE}/delete-retell-llm/${llmId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
            },
        })
        console.log(`[RetellInbound] LLM deleted: ${llmId}`)
    } catch (error) {
        console.error('[RetellInbound] Failed to delete LLM:', error)
    }
}

/**
 * Delete an inbound agent (and its LLM) and release the phone number
 */
export async function deleteInboundAgent(agentId: string, llmId?: string): Promise<void> {
    if (!RETELL_API_KEY) return

    try {
        await fetch(`${RETELL_API_BASE}/delete-agent/${agentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
            },
        })
        console.log(`[RetellInbound] Agent deleted: ${agentId}`)

        // Also delete the associated LLM
        if (llmId) {
            await deleteRetellLLM(llmId)
        }
    } catch (error) {
        console.error('[RetellInbound] Failed to delete agent:', error)
    }
}

export async function releaseInboundNumber(phoneNumber: string): Promise<void> {
    if (!RETELL_API_KEY) return

    try {
        await fetch(`${RETELL_API_BASE}/delete-phone-number/${phoneNumber}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
            },
        })
        console.log(`[RetellInbound] Phone number released: ${phoneNumber}`)
    } catch (error) {
        console.error('[RetellInbound] Failed to release number:', error)
    }
}

// ============================================
// PROMPT BUILDER
// ============================================

function buildInboundPrompt(tenant: Tenant): string {
    const config = tenant.inboundConfig
    const atomic = tenant.atomicConfig

    const companyName = tenant.companyName
    const serviceCategory = atomic?.business_identity?.primary_service || tenant.niche || 'home services'
    const specialistTitle = atomic?.linguistic_map?.specialist_title || 'team member'
    const visitTitle = atomic?.linguistic_map?.visit_title || 'appointment'

    // Build service menu text
    let serviceMenuText = ''
    if (config?.serviceMenu && config.serviceMenu.length > 0) {
        serviceMenuText = `\n\nSERVICES WE OFFER:\n${config.serviceMenu.map(s =>
            `- ${s.name}: ${s.description}${s.priceRange ? ` (${s.priceRange})` : ''}${s.estimatedDuration ? ` · ~${s.estimatedDuration}` : ''}`
        ).join('\n')}`
    }

    // Build capabilities text
    const caps = config?.capabilities || {
        canBookAppointments: true,
        canAcceptServiceCalls: true,
        canProvideQuotes: false,
        canTransferToOwner: true,
        canTakeMessages: true,
        canHandleEmergencies: true,
    }

    let capabilitiesText = '\n\nWHAT YOU CAN DO:'
    if (caps.canBookAppointments) capabilitiesText += `\n- Schedule ${visitTitle}s using the check_availability and book_appointment functions`
    if (caps.canAcceptServiceCalls) capabilitiesText += `\n- Accept service call requests and log them for the team`
    if (caps.canProvideQuotes) capabilitiesText += `\n- Provide general pricing information from the service menu`
    if (caps.canTransferToOwner) capabilitiesText += `\n- Transfer the caller to the owner/team using the transfer_to_owner function when requested`
    if (caps.canTakeMessages) capabilitiesText += `\n- Take detailed messages using the take_message function`
    if (caps.canHandleEmergencies) capabilitiesText += `\n- Detect emergencies and immediately escalate using the emergency_escalation function`

    // Emergency keywords
    const emergencyText = config?.emergencyKeywords && config.emergencyKeywords.length > 0
        ? `\n\nEMERGENCY DETECTION:\nIf the caller mentions any of these keywords, immediately use the emergency_escalation function: ${config.emergencyKeywords.join(', ')}`
        : ''

    // Persona/tone from atomic config
    const persona = atomic?.business_identity?.agent_persona || 'helpful_neighbor'
    const personaText = {
        professional: 'You are professional, courteous, and efficient.',
        helpful_neighbor: 'You are warm, friendly, and approachable — like a helpful neighbor.',
        expert: 'You are knowledgeable, authoritative, and reassuring.',
        direct: 'You are efficient, clear, and to-the-point.',
        casual: 'You are relaxed, conversational, and easygoing.',
    }[persona] || 'You are warm, friendly, and approachable.'

    return `You are the AI phone assistant for ${companyName}, a ${serviceCategory} company. You answer incoming phone calls on behalf of the business.

PERSONALITY & TONE:
${personaText}
- Keep responses concise — aim for 1-2 sentences at a time
- Always identify yourself as "${companyName}'s assistant" (never claim to be a human)
- If asked, clarify that you're an AI assistant and can connect them with a ${specialistTitle} if needed
- Be empathetic to urgent/emergency situations

YOUR OPENING:
Use the dynamic variable {{greeting}} as your opening line. If not set, use: "Thank you for calling ${companyName}! How can I help you today?"
${capabilitiesText}
${serviceMenuText}
${emergencyText}

CALL FLOW:
1. Greet the caller warmly
2. Understand their need (service request, appointment, question, emergency)
3. If you can handle it, do so (book appointment, take message, provide info)
4. If they explicitly ask to speak with someone, use the transfer_to_owner function
5. Always confirm details before ending: repeat back names, times, phone numbers
6. End politely with "Is there anything else I can help you with?"

IMPORTANT RULES:
- Never make up pricing or timelines not in your service menu
- If unsure about a question, offer to take a message and have someone call back
- Always get the caller's name and phone number if not already identified
- For appointments, always confirm the date, time, and service type
- If the caller seems frustrated, offer to transfer to the owner immediately`
}

// ============================================
// TOOL DEFINITIONS (Retell Custom Functions)
// ============================================

function buildInboundTools(tenant: Tenant): object[] {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retain-backend--retaincrm-ab8ab.us-central1.hosted.app'
    const tools: object[] = []

    // End call tool (built-in)
    tools.push({
        type: 'end_call',
        name: 'end_call',
        description: 'End the call politely when the conversation is complete and the caller has no more questions.',
    })

    // Check availability
    tools.push({
        type: 'custom',
        name: 'check_availability',
        description: 'Check available appointment slots for a given date. Use when the caller wants to schedule an appointment.',
        url: `${appUrl}/api/retell/check-availability`,
        speak_during_execution: true,
        speak_after_execution: true,
        execution_message_description: 'Let me check our availability for that date...',
        parameters: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'The date to check availability for, in YYYY-MM-DD format',
                },
            },
            required: ['date'],
        },
    })

    // Book appointment
    tools.push({
        type: 'custom',
        name: 'book_appointment',
        description: 'Book an appointment for the caller. Use after confirming time and details.',
        url: `${appUrl}/api/retell/book-appointment`,
        speak_during_execution: true,
        speak_after_execution: true,
        execution_message_description: 'Let me book that appointment for you...',
        parameters: {
            type: 'object',
            properties: {
                datetime: {
                    type: 'string',
                    description: 'ISO 8601 datetime for the appointment',
                },
                address: {
                    type: 'string',
                    description: 'Service address for the appointment',
                },
                service_type: {
                    type: 'string',
                    description: 'Type of service requested',
                },
                notes: {
                    type: 'string',
                    description: 'Additional notes about the service request',
                },
            },
            required: ['datetime'],
        },
    })

    // Transfer to owner
    if (tenant.inboundConfig?.capabilities?.canTransferToOwner) {
        tools.push({
            type: 'custom',
            name: 'transfer_to_owner',
            description: 'Transfer the call to the business owner or a team member. Use when the caller explicitly requests to speak with a person, or when you cannot handle their request.',
            url: `${appUrl}/api/inbound/transfer`,
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'Let me connect you with someone from the team...',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Reason for the transfer',
                    },
                    caller_name: {
                        type: 'string',
                        description: 'Name of the caller',
                    },
                    caller_phone: {
                        type: 'string',
                        description: 'Phone number of the caller',
                    },
                    topic: {
                        type: 'string',
                        description: 'Brief topic of what the caller needs',
                    },
                },
                required: ['reason'],
            },
        })
    }

    // Take message
    if (tenant.inboundConfig?.capabilities?.canTakeMessages) {
        tools.push({
            type: 'custom',
            name: 'take_message',
            description: 'Record a message from the caller for the business owner. Use when you cannot handle the request and the caller does not want to wait for a transfer.',
            url: `${appUrl}/api/inbound/message`,
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'I will pass along your message right away.',
            parameters: {
                type: 'object',
                properties: {
                    caller_name: {
                        type: 'string',
                        description: 'Name of the caller',
                    },
                    caller_phone: {
                        type: 'string',
                        description: 'Phone number of the caller',
                    },
                    message: {
                        type: 'string',
                        description: 'The message to deliver to the business owner',
                    },
                    urgency: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'How urgent the message is',
                    },
                },
                required: ['caller_name', 'message'],
            },
        })
    }

    // Emergency escalation
    if (tenant.inboundConfig?.capabilities?.canHandleEmergencies) {
        tools.push({
            type: 'custom',
            name: 'emergency_escalation',
            description: 'Immediately escalate an emergency to the business owner. Use when the caller reports a flood, gas leak, fire, burst pipe, or any life-threatening situation.',
            url: `${appUrl}/api/inbound/emergency`,
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'I am alerting the team about this emergency right now.',
            parameters: {
                type: 'object',
                properties: {
                    caller_name: {
                        type: 'string',
                        description: 'Name of the caller',
                    },
                    caller_phone: {
                        type: 'string',
                        description: 'Phone number of the caller',
                    },
                    emergency_type: {
                        type: 'string',
                        description: 'Type of emergency (flood, gas leak, etc.)',
                    },
                    details: {
                        type: 'string',
                        description: 'Details about the emergency situation',
                    },
                    address: {
                        type: 'string',
                        description: 'Address where the emergency is',
                    },
                },
                required: ['caller_phone', 'emergency_type'],
            },
        })
    }

    return tools
}
