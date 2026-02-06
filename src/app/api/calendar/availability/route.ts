import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'

const CALCOM_API_URL = 'https://api.cal.com/v1'

/**
 * GET /api/calendar/availability
 * Check available slots for a given date
 * 
 * Query params:
 * - date: YYYY-MM-DD format
 * - days: number of days to check (default 1, max 7)
 */
export async function GET(request: NextRequest) {
    const authResult = await getOrCreateTenant()
    if (isAuthError(authResult)) return authResult
    const { tenant } = authResult

    if (!tenant.calcomApiKey || !tenant.calcomEventTypeId) {
        return NextResponse.json(
            { error: 'Calendar not configured. Please add Cal.com API key and event type.' },
            { status: 400 }
        )
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const days = Math.min(parseInt(searchParams.get('days') || '1'), 7)

    if (!dateStr) {
        return NextResponse.json(
            { error: 'Date parameter required (YYYY-MM-DD)' },
            { status: 400 }
        )
    }

    try {
        // Parse the date and create date range
        const startDate = new Date(dateStr)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + days)

        // Call Cal.com availability API
        const response = await fetch(
            `${CALCOM_API_URL}/availability?` + new URLSearchParams({
                apiKey: tenant.calcomApiKey,
                eventTypeId: String(tenant.calcomEventTypeId),
                dateFrom: startDate.toISOString().split('T')[0],
                dateTo: endDate.toISOString().split('T')[0],
            }),
            { method: 'GET' }
        )

        if (!response.ok) {
            const error = await response.text()
            console.error('[Calendar] Cal.com availability error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch availability' },
                { status: 500 }
            )
        }

        const data = await response.json()

        // Transform Cal.com response to simple slot list
        // Cal.com returns { busy: [...], dateRanges: [...] }
        const slots: { datetime: string; display: string }[] = []

        if (data.slots) {
            // If Cal.com returns slots directly
            for (const [date, times] of Object.entries(data.slots)) {
                for (const time of times as string[]) {
                    const dt = new Date(time)
                    slots.push({
                        datetime: dt.toISOString(),
                        display: dt.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        }),
                    })
                }
            }
        }

        return NextResponse.json({
            date: dateStr,
            slots,
            count: slots.length,
        })
    } catch (error) {
        console.error('[Calendar] Error fetching availability:', error)
        return NextResponse.json(
            { error: 'Failed to check availability' },
            { status: 500 }
        )
    }
}
