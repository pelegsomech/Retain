import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleClaimTimeout } from '@/lib/escalation'
import { LeadStatus } from '@prisma/client'

// Cron secret for Vercel Cron Jobs
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/check-timeouts
 * Checks for claim timeouts and triggers AI escalation
 * Called by Vercel Cron every minute
 */
export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel sends this header)
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Find leads that are still SMS_SENT but past their claim expiry
        const expiredLeads = await prisma.lead.findMany({
            where: {
                status: LeadStatus.SMS_SENT,
                claimExpiresAt: {
                    lt: new Date(),
                },
            },
            select: {
                id: true,
                firstName: true,
                phone: true,
                claimExpiresAt: true,
            },
        })

        console.log(`[Cron] Found ${expiredLeads.length} expired claims`)

        // Process each expired lead
        const results = await Promise.allSettled(
            expiredLeads.map(async (lead: { id: string }) => {
                console.log(`[Cron] Processing timeout for lead ${lead.id}`)
                await handleClaimTimeout(lead.id)
                return lead.id
            })
        )

        const processed = results.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled').length
        const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length

        return NextResponse.json({
            success: true,
            processed,
            failed,
            total: expiredLeads.length,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Cron] Error checking timeouts:', error)
        return NextResponse.json(
            { error: 'Failed to check timeouts' },
            { status: 500 }
        )
    }
}
