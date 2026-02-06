import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'
import { collections, Timestamp } from '@/lib/firebase-admin'

const CALCOM_API_URL = 'https://api.cal.com/v1'

interface BookingRequest {
    datetime: string        // ISO datetime string
    name: string           // Customer full name
    email?: string         // Customer email (optional)
    phone: string          // Customer phone
    address?: string       // Service address
    notes?: string         // Project notes
    leadId?: string        // Optional lead ID to link booking
}

/**
 * POST /api/calendar/book
 * Book an appointment via Cal.com
 */
export async function POST(request: NextRequest) {
    const authResult = await getOrCreateTenant()
    if (isAuthError(authResult)) return authResult
    const { tenant } = authResult

    if (!tenant.calcomApiKey || !tenant.calcomEventTypeId) {
        return NextResponse.json(
            { error: 'Calendar not configured. Please add Cal.com API key and event type.' },
            { status: 400 }
        )
    }

    try {
        const body: BookingRequest = await request.json()

        if (!body.datetime || !body.name || !body.phone) {
            return NextResponse.json(
                { error: 'Missing required fields: datetime, name, phone' },
                { status: 400 }
            )
        }

        // Parse datetime
        const startTime = new Date(body.datetime)

        // Build Cal.com booking payload
        const bookingPayload = {
            eventTypeId: tenant.calcomEventTypeId,
            start: startTime.toISOString(),
            responses: {
                name: body.name,
                email: body.email || `${body.phone.replace(/\D/g, '')}@placeholder.retain.ai`,
                phone: body.phone,
                location: body.address || '',
                notes: body.notes || '',
            },
            metadata: {
                tenantId: tenant.id,
                leadId: body.leadId || '',
                source: 'retain-ai-agent',
            },
            timeZone: 'America/Los_Angeles', // TODO: Make configurable per tenant
        }

        // Call Cal.com booking API
        const response = await fetch(
            `${CALCOM_API_URL}/bookings?apiKey=${tenant.calcomApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            console.error('[Calendar] Cal.com booking error:', error)
            return NextResponse.json(
                { error: 'Failed to create booking', details: error },
                { status: 500 }
            )
        }

        const booking = await response.json()

        // If leadId provided, update lead with booking info
        if (body.leadId) {
            await collections.leads.doc(body.leadId).update({
                status: 'BOOKED',
                appointmentTime: Timestamp.fromDate(startTime),
                calcomBookingId: booking.id || booking.uid,
                updatedAt: Timestamp.now(),
            })
        }

        console.log(`[Calendar] Booking created: ${booking.id || booking.uid}`)

        return NextResponse.json({
            success: true,
            bookingId: booking.id || booking.uid,
            datetime: startTime.toISOString(),
            display: startTime.toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
        })
    } catch (error) {
        console.error('[Calendar] Error creating booking:', error)
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/calendar/book
 * Cancel a Cal.com booking
 */
export async function DELETE(request: NextRequest) {
    const authResult = await getOrCreateTenant()
    if (isAuthError(authResult)) return authResult
    const { tenant } = authResult

    if (!tenant.calcomApiKey) {
        return NextResponse.json(
            { error: 'Calendar not configured' },
            { status: 400 }
        )
    }

    try {
        const { searchParams } = new URL(request.url)
        const bookingId = searchParams.get('bookingId')

        if (!bookingId) {
            return NextResponse.json(
                { error: 'bookingId parameter required' },
                { status: 400 }
            )
        }

        // Cancel via Cal.com API
        const response = await fetch(
            `${CALCOM_API_URL}/bookings/${bookingId}/cancel?apiKey=${tenant.calcomApiKey}`,
            { method: 'DELETE' }
        )

        if (!response.ok) {
            const error = await response.text()
            console.error('[Calendar] Cal.com cancel error:', error)
            return NextResponse.json(
                { error: 'Failed to cancel booking' },
                { status: 500 }
            )
        }

        console.log(`[Calendar] Booking cancelled: ${bookingId}`)

        return NextResponse.json({
            success: true,
            cancelled: bookingId,
        })
    } catch (error) {
        console.error('[Calendar] Error cancelling booking:', error)
        return NextResponse.json(
            { error: 'Failed to cancel booking' },
            { status: 500 }
        )
    }
}
