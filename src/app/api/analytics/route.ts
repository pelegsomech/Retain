import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    collections,
    getTenantByClerkOrgId,
    type Lead,
} from '@/lib/firebase-admin'

// GET /api/analytics - Get analytics for current tenant
export async function GET() {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await getTenantByClerkOrgId(orgId)

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

        // Get all leads for this tenant (we'll calculate stats in memory)
        const allLeadsSnapshot = await collections.leads
            .where('tenantId', '==', tenant.id)
            .get()

        const allLeads = allLeadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Lead[]

        // Total leads
        const totalLeads = allLeads.length

        // Helper to check if date is after start
        const isAfter = (leadDate: unknown, start: Date): boolean => {
            if (!leadDate) return false
            const date = typeof leadDate === 'object' && 'toDate' in leadDate
                ? (leadDate as { toDate: () => Date }).toDate()
                : new Date(leadDate as string)
            return date >= start
        }

        // Leads today
        const leadsToday = allLeads.filter(l => isAfter(l.createdAt, todayStart)).length

        // Leads this week
        const leadsThisWeek = allLeads.filter(l => isAfter(l.createdAt, weekStart)).length

        // Human vs AI claims
        const humanClaims = allLeads.filter(l => l.claimedBy === 'human').length
        const aiClaims = allLeads.filter(l => l.claimedBy === 'ai').length

        // Booked appointments
        const bookedLeads = allLeads.filter(l => l.status === 'BOOKED').length

        // Average speed to claim (would need claimedAt field)
        const avgSpeedToLead = 0 // Simplified for now

        // AI call stats
        const leadsWithCalls = allLeads.filter(l => l.aiCallId)
        const totalCalls = leadsWithCalls.length
        let totalDuration = 0
        let durationCount = 0

        leadsWithCalls.forEach(lead => {
            const data = lead as Lead & { aiCallDuration?: number }
            if (data.aiCallDuration) {
                totalDuration += data.aiCallDuration
                durationCount++
            }
        })

        // Leads by status
        const statusCounts: Record<string, number> = {}
        allLeads.forEach(l => {
            statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
        })

        // Leads by source (last 30 days)
        const leadsLastMonth = allLeads.filter(l => isAfter(l.createdAt, monthStart))
        const sourceCounts: Record<string, number> = {}
        leadsLastMonth.forEach(l => {
            const source = l.utmSource || 'Direct'
            sourceCounts[source] = (sourceCounts[source] || 0) + 1
        })

        // Daily leads for last 7 days
        const dailyLeads: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
            const date = new Date(todayStart)
            date.setDate(date.getDate() - i)
            const key = date.toISOString().split('T')[0]
            dailyLeads[key] = 0
        }

        allLeads.forEach(lead => {
            const createdAt = lead.createdAt
            if (createdAt && isAfter(createdAt, weekStart)) {
                const date = typeof createdAt === 'object' && 'toDate' in createdAt
                    ? (createdAt as { toDate: () => Date }).toDate()
                    : new Date(createdAt as unknown as string)
                const key = date.toISOString().split('T')[0]
                if (key in dailyLeads) {
                    dailyLeads[key]++
                }
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
                totalCalls,
                avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
            },
            leadsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
                status,
                count,
            })),
            leadsBySource: Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([source, count]) => ({
                    source,
                    count,
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
