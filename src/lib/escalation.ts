import jwt from 'jsonwebtoken'
import {
    db,
    collections,
    Timestamp,
    getActiveTeamMembers,
    logEvent,
    type Lead,
    type Tenant,
} from './firebase-admin'
import { setClaimToken, deleteClaimToken } from './redis'
import { sendSMS } from './twilio'

const CLAIM_SECRET = process.env.CLAIM_SECRET || 'dev-secret-change-in-production'

interface ClaimPayload {
    leadId: string
    tenantId: string
    exp: number
}

/**
 * Generate signed JWT claim token
 */
export function generateClaimToken(leadId: string, tenantId: string, ttlSeconds: number = 60): string {
    return jwt.sign(
        { leadId, tenantId },
        CLAIM_SECRET,
        { expiresIn: ttlSeconds }
    )
}

/**
 * Verify and decode claim token
 */
export function verifyClaimToken(token: string): ClaimPayload | null {
    try {
        return jwt.verify(token, CLAIM_SECRET) as ClaimPayload
    } catch {
        return null
    }
}

/**
 * Start escalation flow for a new lead
 * 1. Generate claim token
 * 2. Store in Redis with TTL
 * 3. Send SMS to all active team members
 * 4. Update lead status
 */
export async function startEscalation(leadId: string): Promise<void> {
    // Get lead from Firestore
    const leadDoc = await collections.leads.doc(leadId).get()
    if (!leadDoc.exists) {
        throw new Error(`Lead not found: ${leadId}`)
    }
    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

    // Get tenant
    const tenantDoc = await collections.tenants.doc(lead.tenantId).get()
    if (!tenantDoc.exists) {
        throw new Error(`Tenant not found: ${lead.tenantId}`)
    }
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant

    // Get active team members
    const teamMembers = await getActiveTeamMembers(tenant.id)

    const ttl = tenant.claimTimeoutSec
    const token = generateClaimToken(leadId, tenant.id, ttl)
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${token}`

    // Store in Redis for timeout detection
    await setClaimToken(leadId, token, ttl)

    // Update lead with claim info
    await collections.leads.doc(leadId).update({
        claimToken: token,
        claimExpiresAt: Timestamp.fromDate(new Date(Date.now() + ttl * 1000)),
        status: 'SMS_SENT',
        updatedAt: Timestamp.now(),
    })

    // Prepare SMS message
    const contractorType = tenant.contractorType || tenant.niche
    const timeoutDisplay = ttl >= 60 ? `${Math.floor(ttl / 60)}min` : `${ttl}s`
    const message = `🚨 New ${contractorType} lead!\n${lead.firstName} ${lead.lastName || ''}\n📞 ${lead.phone}\n${lead.city ? `📍 ${lead.city}` : ''}\n\nClaim now: ${claimUrl}\n\n⏱️ ${timeoutDisplay} until AI takes over`

    // Send SMS to all active team members
    if (tenant.twilioFromPhone) {
        if (teamMembers.length > 0) {
            // Send to each team member
            await Promise.all(
                teamMembers.map((member) =>
                    sendSMS({
                        to: member.phone,
                        from: tenant.twilioFromPhone!,
                        body: message,
                    })
                )
            )

            console.log(`[Escalation] Sent claim SMS to ${teamMembers.length} team members`)
        } else {
            // Fallback: send to tenant's phone if no team members
            await sendSMS({
                to: tenant.twilioFromPhone,
                from: tenant.twilioFromPhone,
                body: message,
            })

            console.log(`[Escalation] Sent claim SMS to tenant phone (no team members)`)
        }

        // Log SMS sent event
        await logEvent(tenant.id, 'SMS_SENT', leadId, {
            claimUrl,
            ttl,
            recipientCount: teamMembers.length || 1,
        })
    }
}

/**
 * Process claim link click
 */
export async function processClaimClick(token: string): Promise<{ success: boolean; lead?: Lead; error?: string }> {
    const payload = verifyClaimToken(token)

    if (!payload) {
        return { success: false, error: 'Invalid or expired claim link' }
    }

    // Get lead
    const leadDoc = await collections.leads.doc(payload.leadId).get()
    if (!leadDoc.exists) {
        return { success: false, error: 'Lead not found' }
    }
    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

    if (lead.status !== 'SMS_SENT') {
        return { success: false, error: 'Lead already claimed' }
    }

    // Claim the lead
    await collections.leads.doc(payload.leadId).update({
        status: 'CLAIMED',
        claimedBy: 'human',
        updatedAt: Timestamp.now(),
    })

    // Remove from Redis (cancel AI escalation)
    await deleteClaimToken(payload.leadId)

    // Log claim event
    await logEvent(lead.tenantId, 'CLAIM_CLICKED', payload.leadId, { claimedBy: 'human' })

    return { success: true, lead }
}

/**
 * Handle claim timeout → trigger AI voice escalation
 */
export async function handleClaimTimeout(leadId: string): Promise<void> {
    // Import dynamically to avoid circular deps
    const { initiateRetellCall } = await import('./retell')

    // Get lead
    const leadDoc = await collections.leads.doc(leadId).get()
    if (!leadDoc.exists) return

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

    if (lead.status !== 'SMS_SENT') {
        return // Already claimed or invalid
    }

    // Get tenant
    const tenantDoc = await collections.tenants.doc(lead.tenantId).get()
    if (!tenantDoc.exists) return
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant

    // Log timeout event
    await logEvent(tenant.id, 'CLAIM_TIMEOUT', leadId)

    // Update status to AI calling
    await collections.leads.doc(leadId).update({
        status: 'AI_CALLING',
        claimedBy: 'ai',
        updatedAt: Timestamp.now(),
    })

    // Parse service list from tenant config
    const serviceList = tenant.aiServiceList
        ? tenant.aiServiceList.split(',').map((s: string) => s.trim())
        : []

    // Build calendar link
    const calendarLink = tenant.calendarUrl || (
        tenant.calcomApiKey
            ? `https://cal.com/${tenant.companyName?.toLowerCase().replace(/\s+/g, '-')}/consultation`
            : undefined
    )

    // Trigger Retell.ai call with rich contractor context
    try {
        // Verify we have a from number for outbound calls
        if (!tenant.twilioFromPhone) {
            console.error(`[Escalation] No Twilio phone configured for tenant ${tenant.id}`)
            return
        }

        await initiateRetellCall({
            leadId: lead.id,
            phone: lead.phone,
            tenantId: lead.tenantId,
            tenantName: tenant.companyName || 'Our Company',
            fromNumber: tenant.twilioFromPhone,  // Required for Retell API

            // Atomic configuration (preferred if available)
            atomicConfig: tenant.atomicConfig,

            // Legacy contractor context (fallback)
            contractorType: tenant.contractorType || 'GENERAL',
            serviceList: serviceList,
            aiGreeting: tenant.aiGreeting || undefined,
            toneStyle: tenant.aiToneStyle || 'professional',

            // Lead context
            leadFirstName: lead.firstName,
            leadLastName: lead.lastName || undefined,
            leadAddress: lead.address || undefined,
            leadCity: lead.city || undefined,

            // Booking
            calendarLink: calendarLink,
        })
    } catch (error) {
        console.error(`[Escalation] Failed to initiate AI call for lead ${leadId}:`, error)
    }
}
