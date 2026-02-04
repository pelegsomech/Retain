import { NextRequest, NextResponse } from 'next/server'
import { collections, Timestamp } from '@/lib/firebase-admin'
import { handleClaimTimeout } from '@/lib/escalation'

// Cron secret for Firebase Cloud Scheduler / Vercel Cron Jobs
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/check-timeouts
 * Checks for claim timeouts and triggers AI escalation
 * Called by Cloud Scheduler or Vercel Cron every minute
 */
export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel/Cloud Scheduler sends this header)
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const now = Timestamp.now()

        // Find leads that are still SMS_SENT but past their claim expiry
        const expiredSnapshot = await collections.leads
            .where('status', '==', 'SMS_SENT')
            .where('claimExpiresAt', '<', now)
            .get()

        console.log(`[Cron] Found ${expiredSnapshot.size} expired claims`)

        // Process each expired lead
        const expiredLeads = expiredSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }))

        const results = await Promise.allSettled(
            expiredLeads.map(async (lead) => {
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
