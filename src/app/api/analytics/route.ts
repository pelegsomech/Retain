import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET /api/analytics - Get analytics for current tenant
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

        // Date ranges
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart)
        weekStart.setDate(weekStart.getDate() - 7)
        const monthStart = new Date(todayStart)
        monthStart.setDate(monthStart.getDate() - 30)

        // Total leads
        const totalLeads = await prisma.lead.count({
            where: { tenantId: tenant.id },
        })

        // Leads today
        const leadsToday = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                createdAt: { gte: todayStart },
            },
        })

        // Leads this week
        const leadsThisWeek = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                createdAt: { gte: weekStart },
            },
        })

        // Human vs AI claims
        const humanClaims = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                claimedBy: 'human',
            },
        })

        const aiClaims = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                claimedBy: 'ai',
            },
        })

        // Booked appointments
        const bookedLeads = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                status: 'BOOKED',
            },
        })

        // Average speed to claim (for human claims)
        const claimedLeads = await prisma.lead.findMany({
            where: {
                tenantId: tenant.id,
                claimedBy: 'human',
                claimedAt: { not: null },
            },
            select: {
                createdAt: true,
                claimedAt: true,
            },
        })

        let avgSpeedToLead = 0
        if (claimedLeads.length > 0) {
            const totalSeconds = claimedLeads.reduce((sum: number, lead: { createdAt: Date; claimedAt: Date | null }) => {
                if (lead.claimedAt) {
                    const diff = (new Date(lead.claimedAt).getTime() - new Date(lead.createdAt).getTime()) / 1000
                    return sum + diff
                }
                return sum
            }, 0)
            avgSpeedToLead = Math.round(totalSeconds / claimedLeads.length)
        }

        // AI call stats
        const aiCalls = await prisma.lead.aggregate({
            where: {
                tenantId: tenant.id,
                aiCallId: { not: null },
            },
            _count: true,
            _avg: { aiCallDuration: true },
        })

        // Leads by status
        const leadsByStatus = await prisma.lead.groupBy({
            by: ['status'],
            where: { tenantId: tenant.id },
            _count: true,
        })

        // Leads by source (last 30 days)
        const leadsBySource = await prisma.lead.groupBy({
            by: ['utmSource'],
            where: {
                tenantId: tenant.id,
                createdAt: { gte: monthStart },
            },
            _count: true,
            orderBy: { _count: { utmSource: 'desc' } },
            take: 5,
        })

        // Daily leads for last 7 days
        const dailyLeadsRaw = await prisma.lead.groupBy({
            by: ['createdAt'],
            where: {
                tenantId: tenant.id,
                createdAt: { gte: weekStart },
            },
            _count: true,
        })

        // Aggregate by day
        const dailyLeads: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
            const date = new Date(todayStart)
            date.setDate(date.getDate() - i)
            const key = date.toISOString().split('T')[0]
            dailyLeads[key] = 0
        }

        dailyLeadsRaw.forEach((item: { createdAt: Date; _count: number }) => {
            const key = new Date(item.createdAt).toISOString().split('T')[0]
            if (key in dailyLeads) {
                dailyLeads[key] += item._count
            }
        })

        return NextResponse.json({
            overview: {
                totalLeads,
                leadsToday,
                leadsThisWeek,
                humanClaims,
                aiClaims,
                bookedLeads,
                avgSpeedToLead,
                conversionRate: totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0,
            },
            aiStats: {
                totalCalls: aiCalls._count,
                avgDuration: Math.round(aiCalls._avg.aiCallDuration || 0),
            },
            leadsByStatus: leadsByStatus.map((s: { status: string; _count: number }) => ({
                status: s.status,
                count: s._count,
            })),
            leadsBySource: leadsBySource.map((s: { utmSource: string | null; _count: number }) => ({
                source: s.utmSource || 'Direct',
                count: s._count,
            })),
            dailyLeads: Object.entries(dailyLeads).map(([date, count]) => ({
                date,
                count,
            })),
        })
    } catch (error) {
        console.error('[API] Analytics fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
