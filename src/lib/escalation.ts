import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { setClaimToken, deleteClaimToken } from './redis'
import { sendSMS } from './twilio'
import { LeadStatus, EventType } from '@prisma/client'

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
 * 3. Send SMS to contractor
 * 4. Update lead status
 */
export async function startEscalation(leadId: string): Promise<void> {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { tenant: true },
    })

    if (!lead || !lead.tenant) {
        throw new Error(`Lead not found: ${leadId}`)
    }

    const ttl = lead.tenant.claimTimeoutSec
    const token = generateClaimToken(leadId, lead.tenantId, ttl)
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${token}`

    // Store in Redis for timeout detection
    await setClaimToken(leadId, token, ttl)

    // Update lead with claim info
    await prisma.lead.update({
        where: { id: leadId },
        data: {
            claimToken: token,
            claimExpiresAt: new Date(Date.now() + ttl * 1000),
            status: LeadStatus.SMS_SENT,
        },
    })

    // Send SMS to contractor
    if (lead.tenant.twilioFromPhone) {
        const message = `🚨 New ${lead.tenant.niche} lead!\n${lead.firstName} ${lead.lastName || ''}\n📞 ${lead.phone}\n\nClaim now: ${claimUrl}\n\n⏱️ ${ttl}s until AI takes over`

        await sendSMS({
            to: lead.tenant.twilioFromPhone, // TODO: Use contractor's personal phone
            from: lead.tenant.twilioFromPhone,
            body: message,
        })

        // Log SMS sent event
        await prisma.event.create({
            data: {
                tenantId: lead.tenantId,
                leadId: leadId,
                type: EventType.SMS_SENT,
                payload: { claimUrl, ttl },
            },
        })
    }
}

/**
 * Process claim link click
 */
export async function processClaimClick(token: string): Promise<{ success: boolean; lead?: unknown; error?: string }> {
    const payload = verifyClaimToken(token)

    if (!payload) {
        return { success: false, error: 'Invalid or expired claim link' }
    }

    const lead = await prisma.lead.findUnique({
        where: { id: payload.leadId },
        include: { tenant: true },
    })

    if (!lead) {
        return { success: false, error: 'Lead not found' }
    }

    if (lead.status !== LeadStatus.SMS_SENT) {
        return { success: false, error: 'Lead already claimed' }
    }

    // Claim the lead
    await prisma.lead.update({
        where: { id: payload.leadId },
        data: {
            status: LeadStatus.CLAIMED,
            claimedAt: new Date(),
            claimedBy: 'human',
        },
    })

    // Remove from Redis (cancel AI escalation)
    await deleteClaimToken(payload.leadId)

    // Log claim event
    await prisma.event.create({
        data: {
            tenantId: lead.tenantId,
            leadId: payload.leadId,
            type: EventType.CLAIM_LINK_CLICKED,
            payload: { claimedBy: 'human' },
        },
    })

    return { success: true, lead }
}

/**
 * Handle claim timeout → trigger AI voice escalation
 */
export async function handleClaimTimeout(leadId: string): Promise<void> {
    // Import dynamically to avoid circular deps
    const { initiateRetellCall } = await import('./retell')

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { tenant: true },
    })

    if (!lead || lead.status !== LeadStatus.SMS_SENT) {
        return // Already claimed or invalid
    }

    // Log timeout event
    await prisma.event.create({
        data: {
            tenantId: lead.tenantId,
            leadId: leadId,
            type: EventType.CLAIM_TIMEOUT,
        },
    })

    // Update status to AI calling
    await prisma.lead.update({
        where: { id: leadId },
        data: {
            status: LeadStatus.AI_CALLING,
            claimedBy: 'ai',
        },
    })

    // Parse service list from tenant config
    const serviceList = lead.tenant?.aiServiceList
        ? lead.tenant.aiServiceList.split(',').map((s: string) => s.trim())
        : []

    // Build calendar link
    const calendarLink = lead.tenant?.calendarUrl || (
        lead.tenant?.calcomApiKey
            ? `https://cal.com/${lead.tenant.companyName?.toLowerCase().replace(/\s+/g, '-')}/consultation`
            : undefined
    )

    // Trigger Retell.ai call with rich contractor context
    try {
        await initiateRetellCall({
            leadId: lead.id,
            phone: lead.phone,
            tenantId: lead.tenantId,
            tenantName: lead.tenant?.companyName || 'Our Company',

            // Contractor context
            contractorType: lead.tenant?.contractorType || 'GENERAL',
            serviceList: serviceList,
            aiGreeting: lead.tenant?.aiGreeting || undefined,
            toneStyle: lead.tenant?.aiToneStyle || 'professional',

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

