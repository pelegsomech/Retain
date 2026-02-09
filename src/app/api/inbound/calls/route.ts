import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    type InboundCall,
} from '@/lib/firebase-admin'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'

// GET /api/inbound/calls - List inbound calls for current tenant
export async function GET(req: NextRequest) {
    const authResult = await getOrCreateTenant()

    if (isAuthError(authResult)) {
        return authResult
    }

    const { tenant } = authResult

    try {
        const url = new URL(req.url)
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const outcome = url.searchParams.get('outcome')

        // Build query
        let query = collections.inboundCalls
            .where('tenantId', '==', tenant.id)
            .orderBy('callStartedAt', 'desc')

        if (outcome) {
            query = collections.inboundCalls
                .where('tenantId', '==', tenant.id)
                .where('outcome', '==', outcome)
                .orderBy('callStartedAt', 'desc')
        }

        const snapshot = await query.limit(limit).offset(offset).get()

        const calls = snapshot.docs.map(doc => {
            const data = doc.data() as Omit<InboundCall, 'id'>
            return {
                id: doc.id,
                ...data,
                // Convert Timestamps to ISO strings for JSON
                callStartedAt: data.callStartedAt?.toDate?.()?.toISOString() || null,
                callEndedAt: data.callEndedAt?.toDate?.()?.toISOString() || null,
                transferredAt: data.transferredAt?.toDate?.()?.toISOString() || null,
                appointmentTime: data.appointmentTime?.toDate?.()?.toISOString() || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            }
        })

        // Aggregate stats
        const allCallsSnap = await collections.inboundCalls
            .where('tenantId', '==', tenant.id)
            .get()

        let totalDuration = 0
        let durationCount = 0
        let bookedCount = 0
        let transferredCount = 0
        let messagesCount = 0
        let emergencyCount = 0

        allCallsSnap.docs.forEach(doc => {
            const data = doc.data()
            if (data.durationSeconds) {
                totalDuration += data.durationSeconds
                durationCount++
            }
            switch (data.outcome) {
                case 'appointment_booked':
                case 'service_call_scheduled':
                    bookedCount++
                    break
                case 'transferred':
                    transferredCount++
                    break
                case 'message_taken':
                    messagesCount++
                    break
                case 'emergency_escalated':
                    emergencyCount++
                    break
            }
        })

        const totalCalls = allCallsSnap.size

        return NextResponse.json({
            calls,
            total: totalCalls,
            stats: {
                totalCalls,
                avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
                bookedCount,
                transferredCount,
                messagesCount,
                emergencyCount,
                aiHandledRate: totalCalls > 0
                    ? Math.round(((totalCalls - transferredCount) / totalCalls) * 100)
                    : 0,
            },
        })
    } catch (error) {
        console.error('[API] Inbound calls fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch inbound calls' }, { status: 500 })
    }
}
