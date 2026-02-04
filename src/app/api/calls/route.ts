import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    collections,
    getTenantByClerkOrgId,
    type Lead,
} from '@/lib/firebase-admin'

// GET /api/calls - List AI calls for current tenant
export async function GET(req: NextRequest) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const url = new URL(req.url)
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const outcome = url.searchParams.get('outcome')

        // Find leads that have AI call data
        let query = collections.leads
            .where('tenantId', '==', tenant.id)
            .where('aiCallId', '!=', null)
            .orderBy('aiCallStartedAt', 'desc')

        if (outcome) {
            query = collections.leads
                .where('tenantId', '==', tenant.id)
                .where('aiCallId', '!=', null)
                .where('aiCallOutcome', '==', outcome)
                .orderBy('aiCallStartedAt', 'desc')
        }

        const snapshot = await query.limit(limit).offset(offset).get()

        const calls = snapshot.docs.map(doc => {
            const data = doc.data() as Lead
            return {
                id: doc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                status: data.status,
                aiCallId: data.aiCallId,
                aiCallStartedAt: data.aiCallStartedAt,
                aiCallOutcome: data.aiCallOutcome,
                createdAt: data.createdAt,
            }
        })

        // Get total count
        const countSnapshot = await collections.leads
            .where('tenantId', '==', tenant.id)
            .where('aiCallId', '!=', null)
            .count()
            .get()
        const total = countSnapshot.data().count

        // Calculate aggregate stats - get all AI calls for stats
        const allCallsSnapshot = await collections.leads
            .where('tenantId', '==', tenant.id)
            .where('aiCallId', '!=', null)
            .get()

        let totalDuration = 0
        let durationCount = 0
        let bookedCount = 0

        allCallsSnapshot.docs.forEach(doc => {
            const data = doc.data()
            if (data.aiCallDuration) {
                totalDuration += data.aiCallDuration
                durationCount++
            }
            if (data.aiCallOutcome === 'booked' || data.aiCallOutcome === 'appointment_scheduled') {
                bookedCount++
            }
        })

        const totalCalls = allCallsSnapshot.size

        return NextResponse.json({
            calls,
            total,
            stats: {
                totalCalls,
                avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
                bookedCount,
                bookingRate: totalCalls > 0
                    ? Math.round((bookedCount / totalCalls) * 100)
                    : 0,
            },
        })
    } catch (error) {
        console.error('[API] Calls fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
    }
}
