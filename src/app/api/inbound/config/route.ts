import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    type InboundConfig,
} from '@/lib/firebase-admin'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'
import {
    createInboundAgent,
    purchaseInboundNumber,
    updateInboundAgent,
    deleteInboundAgent,
    releaseInboundNumber,
} from '@/lib/retell-inbound'
import { createDefaultInboundConfig } from '@/lib/inbound-router'

/**
 * GET /api/inbound/config
 * Get the inbound configuration for the current tenant
 */
export async function GET() {
    const authResult = await getOrCreateTenant()
    if (isAuthError(authResult)) return authResult

    const { tenant } = authResult

    return NextResponse.json({
        enabled: tenant.inboundEnabled || false,
        config: tenant.inboundConfig || createDefaultInboundConfig(
            tenant.twilioFromPhone || '',
            tenant.companyName,
        ),
    })
}

/**
 * POST /api/inbound/config
 * Create or update the inbound configuration
 * 
 * When enabling for the first time:
 * 1. Creates a dedicated Retell inbound agent
 * 2. Purchases a Retell-managed phone number
 * 3. Associates the number with the agent
 * 4. Stores everything in the tenant's inboundConfig
 */
export async function POST(req: NextRequest) {
    const authResult = await getOrCreateTenant()
    if (isAuthError(authResult)) return authResult

    const { tenant } = authResult
    const body = await req.json()

    try {
        const { action, config: configUpdates, areaCode } = body

        switch (action) {
            case 'enable': {
                // Pre-flight check: is Retell configured?
                if (!process.env.RETELL_API_KEY) {
                    return NextResponse.json(
                        { error: 'Retell API key not configured. Add RETELL_API_KEY to your environment variables.' },
                        { status: 500 }
                    )
                }

                // First-time setup: create agent + purchase number
                if (tenant.inboundConfig?.inboundAgentId && tenant.inboundConfig?.inboundPhoneNumber) {
                    // Already provisioned, just enable
                    await collections.tenants.doc(tenant.id).update({
                        inboundEnabled: true,
                        'inboundConfig.enabled': true,
                        updatedAt: Timestamp.now(),
                    })

                    return NextResponse.json({
                        success: true,
                        message: 'Inbound assistant re-enabled',
                        phoneNumber: tenant.inboundConfig.inboundPhoneNumber,
                    })
                }

                // Create a new inbound agent
                const agent = await createInboundAgent({
                    tenant,
                    ownerPhone: configUpdates?.ownerPhone || tenant.twilioFromPhone || '',
                })

                if (!agent) {
                    return NextResponse.json(
                        { error: 'Failed to create Retell agent. Check your RETELL_API_KEY and account status.' },
                        { status: 500 }
                    )
                }

                // Purchase a phone number for this agent
                const phone = await purchaseInboundNumber(agent.agent_id, areaCode)
                if (!phone) {
                    // Cleanup: delete the agent we just created
                    await deleteInboundAgent(agent.agent_id)
                    return NextResponse.json(
                        { error: 'Failed to purchase phone number. Try a different area code or check Retell account credits.' },
                        { status: 500 }
                    )
                }

                // Build the full inbound config
                const defaultConfig = createDefaultInboundConfig(
                    configUpdates?.ownerPhone || tenant.twilioFromPhone || '',
                    tenant.companyName,
                )

                const fullConfig: InboundConfig = {
                    ...defaultConfig,
                    ...configUpdates,
                    enabled: true,
                    inboundPhoneNumber: phone.phone_number,
                    inboundAgentId: agent.agent_id,
                }

                await collections.tenants.doc(tenant.id).update({
                    inboundEnabled: true,
                    inboundConfig: fullConfig,
                    updatedAt: Timestamp.now(),
                })

                return NextResponse.json({
                    success: true,
                    message: 'Inbound assistant provisioned successfully',
                    phoneNumber: phone.phone_number,
                    phoneNumberPretty: phone.phone_number_pretty,
                    agentId: agent.agent_id,
                })
            }

            case 'disable': {
                await collections.tenants.doc(tenant.id).update({
                    inboundEnabled: false,
                    'inboundConfig.enabled': false,
                    updatedAt: Timestamp.now(),
                })

                return NextResponse.json({
                    success: true,
                    message: 'Inbound assistant disabled',
                })
            }

            case 'update': {
                // Update config without changing agent/number
                if (!tenant.inboundConfig) {
                    return NextResponse.json(
                        { error: 'Inbound assistant not set up. Enable it first.' },
                        { status: 400 }
                    )
                }

                const updatedConfig: InboundConfig = {
                    ...tenant.inboundConfig,
                    ...configUpdates,
                    // Preserve these — they shouldn't be overwritten by UI updates
                    inboundPhoneNumber: tenant.inboundConfig.inboundPhoneNumber,
                    inboundAgentId: tenant.inboundConfig.inboundAgentId,
                }

                await collections.tenants.doc(tenant.id).update({
                    inboundConfig: updatedConfig,
                    updatedAt: Timestamp.now(),
                })

                // Update the Retell agent with new prompt/tools if config changed
                if (tenant.inboundConfig.inboundAgentId) {
                    const updatedTenant = { ...tenant, inboundConfig: updatedConfig }
                    await updateInboundAgent(
                        tenant.inboundConfig.inboundAgentId,
                        updatedTenant,
                    ).catch(err => console.error('[InboundConfig] Agent update failed:', err))
                }

                return NextResponse.json({
                    success: true,
                    message: 'Inbound configuration updated',
                })
            }

            case 'deprovision': {
                // Full teardown: delete agent + release number
                if (tenant.inboundConfig?.inboundAgentId) {
                    await deleteInboundAgent(tenant.inboundConfig.inboundAgentId)
                }
                if (tenant.inboundConfig?.inboundPhoneNumber) {
                    await releaseInboundNumber(tenant.inboundConfig.inboundPhoneNumber)
                }

                await collections.tenants.doc(tenant.id).update({
                    inboundEnabled: false,
                    inboundConfig: null,
                    updatedAt: Timestamp.now(),
                })

                return NextResponse.json({
                    success: true,
                    message: 'Inbound assistant removed and phone number released',
                })
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('[InboundConfig] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update inbound configuration' },
            { status: 500 }
        )
    }
}
