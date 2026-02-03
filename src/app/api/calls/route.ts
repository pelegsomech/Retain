import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET /api/calls - List AI calls for current tenant
export async function GET(req: NextRequest) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const url = new URL(req.url)
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const outcome = url.searchParams.get('outcome')

        // Find leads that have AI call data
        const where = {
            tenantId: tenant.id,
            aiCallId: { not: null },
            ...(outcome && { aiCallOutcome: outcome }),
        }

        const calls = await prisma.lead.findMany({
            where,
            orderBy: { aiCallStartedAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                aiCallId: true,
                aiCallStartedAt: true,
                aiCallEndedAt: true,
                aiCallDuration: true,
                aiCallOutcome: true,
                aiCallTranscript: true,
                createdAt: true,
            },
        })

        const total = await prisma.lead.count({ where })

        // Calculate aggregate stats
        const stats = await prisma.lead.aggregate({
            where: {
                tenantId: tenant.id,
                aiCallId: { not: null },
            },
            _avg: { aiCallDuration: true },
            _count: true,
        })

        const bookedCount = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                aiCallId: { not: null },
                aiCallOutcome: { in: ['booked', 'appointment_scheduled'] },
            },
        })

        return NextResponse.json({
            calls,
            total,
            stats: {
                totalCalls: stats._count,
                avgDuration: Math.round(stats._avg.aiCallDuration || 0),
                bookedCount,
                bookingRate: stats._count > 0
                    ? Math.round((bookedCount / stats._count) * 100)
                    : 0,
            },
        })
    } catch (error) {
        console.error('[API] Calls fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
    }
}
