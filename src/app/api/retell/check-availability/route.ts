import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/firebase-admin'

const CALCOM_API_URL = 'https://api.cal.com/v1'

/**
 * Retell Custom Function: check_availability
 * Called by Retell agent during a call to check available slots
 * 
 * This endpoint is called by Retell directly (no auth cookie)
 * Tenant is identified from leadId in the call metadata
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Retell sends: { call: {...}, args: { date: "YYYY-MM-DD" } }
        const { call, args } = body
        const leadId = call?.metadata?.lead_id
        const date = args?.date

        console.log('[Retell Function] check_availability called:', { leadId, date })

        if (!leadId) {
            return NextResponse.json({
                result: 'I apologize, but I cannot check the calendar right now. Let me take your preferred time and have someone call you back to confirm.',
            })
        }

        // Get lead to find tenant
        const leadDoc = await collections.leads.doc(leadId).get()
        if (!leadDoc.exists) {
            return NextResponse.json({
                result: 'I cannot access the calendar. Let me take your preferred time and we will confirm shortly.',
            })
        }

        const lead = leadDoc.data()!
        const tenantId = lead.tenantId

        // Get tenant for Cal.com credentials
        const tenantDoc = await collections.tenants.doc(tenantId).get()
        if (!tenantDoc.exists) {
            return NextResponse.json({
                result: 'Calendar not available. What time works best for you?',
            })
        }

        const tenant = tenantDoc.data()!

        if (!tenant.calcomApiKey || !tenant.calcomEventTypeId) {
            return NextResponse.json({
                result: 'Our online calendar is being updated. What day and time works best for you?',
            })
        }

        // Parse date - if not provided or invalid, use tomorrow
        let startDate: Date
        if (date && !isNaN(Date.parse(date))) {
            startDate = new Date(date)
        } else {
            startDate = new Date()
            startDate.setDate(startDate.getDate() + 1) // Default to tomorrow
        }

        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)

        // Call Cal.com availability API
        const response = await fetch(
            `${CALCOM_API_URL}/slots?` + new URLSearchParams({
                apiKey: tenant.calcomApiKey,
                eventTypeId: String(tenant.calcomEventTypeId),
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            }),
            { method: 'GET' }
        )

        if (!response.ok) {
            console.error('[Retell Function] Cal.com error:', await response.text())
            return NextResponse.json({
                result: 'I cannot check real-time availability right now. What time generally works for you?',
            })
        }

        const data = await response.json()

        // Format slots for voice
        const slots: string[] = []
        if (data.slots) {
            for (const [, times] of Object.entries(data.slots)) {
                for (const time of (times as string[]).slice(0, 5)) { // Max 5 slots
                    const dt = new Date(time)
                    slots.push(dt.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    }))
                }
            }
        }

        const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' })

        if (slots.length === 0) {
            return NextResponse.json({
                result: `I don't see any openings on ${dayName}. Would you like me to check another day?`,
                available_slots: [],
                date: startDate.toISOString().split('T')[0],
            })
        }

        // Return natural language for agent
        const slotList = slots.slice(0, 3).join(', ')
        return NextResponse.json({
            result: `On ${dayName}, I have openings at ${slotList}. Which works best for you?`,
            available_slots: slots,
            date: startDate.toISOString().split('T')[0],
        })

    } catch (error) {
        console.error('[Retell Function] check_availability error:', error)
        return NextResponse.json({
            result: 'I cannot access the calendar right now. What time works for you and I will have someone confirm?',
        })
    }
}
