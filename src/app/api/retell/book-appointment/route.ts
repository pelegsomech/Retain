import { NextRequest, NextResponse } from 'next/server'
import { collections, Timestamp } from '@/lib/firebase-admin'

const CALCOM_API_URL = 'https://api.cal.com/v1'

/**
 * Retell Custom Function: book_appointment
 * Called by Retell agent during a call to book an appointment
 * 
 * This endpoint is called by Retell directly (no auth cookie)
 * Tenant is identified from leadId in the call metadata
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Retell sends: { call: {...}, args: { datetime, address, notes } }
        const { call, args } = body
        const leadId = call?.metadata?.lead_id
        const { datetime, address, notes } = args || {}

        console.log('[Retell Function] book_appointment called:', { leadId, datetime, address })

        if (!leadId) {
            return NextResponse.json({
                result: 'I cannot complete the booking right now. I have noted your preferred time and someone will call you back shortly to confirm.',
            })
        }

        // Get lead
        const leadDoc = await collections.leads.doc(leadId).get()
        if (!leadDoc.exists) {
            return NextResponse.json({
                result: 'I cannot complete the booking right now. Someone will call you back to confirm.',
            })
        }

        const lead = leadDoc.data()!
        const tenantId = lead.tenantId

        // Get tenant for Cal.com credentials
        const tenantDoc = await collections.tenants.doc(tenantId).get()
        if (!tenantDoc.exists) {
            return NextResponse.json({
                result: 'Booking system unavailable. We will call you back to confirm the appointment.',
            })
        }

        const tenant = tenantDoc.data()!

        if (!tenant.calcomApiKey || !tenant.calcomEventTypeId) {
            // Store the preferred time in lead notes and mark for manual booking
            await collections.leads.doc(leadId).update({
                status: 'BOOKING_PENDING',
                preferredAppointmentTime: datetime,
                address: address || lead.address,
                projectNotes: notes || lead.projectNotes,
                updatedAt: Timestamp.now(),
            })
            return NextResponse.json({
                result: 'I have noted your preferred time. Someone will call you back shortly to confirm the exact appointment.',
            })
        }

        // Parse datetime
        const startTime = new Date(datetime)
        if (isNaN(startTime.getTime())) {
            return NextResponse.json({
                result: 'I did not catch the time clearly. Could you repeat when you would like the appointment?',
            })
        }

        // Build customer name from lead
        const customerName = `${lead.firstName} ${lead.lastName || ''}`.trim()
        const customerPhone = lead.phone
        const customerEmail = lead.email || `${customerPhone.replace(/\D/g, '')}@placeholder.retain.ai`

        // Build Cal.com booking payload
        const bookingPayload = {
            eventTypeId: tenant.calcomEventTypeId,
            start: startTime.toISOString(),
            responses: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                location: address || lead.address || '',
                notes: notes || lead.projectNotes || '',
            },
            metadata: {
                tenantId: tenant.id,
                leadId: leadId,
                source: 'retain-ai-call',
            },
            timeZone: 'America/Los_Angeles', // TODO: Make configurable
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
            console.error('[Retell Function] Cal.com booking error:', error)

            // Store preferred time for manual booking
            await collections.leads.doc(leadId).update({
                status: 'BOOKING_PENDING',
                preferredAppointmentTime: datetime,
                address: address || lead.address,
                updatedAt: Timestamp.now(),
            })

            return NextResponse.json({
                result: 'That time slot may have just been taken. I have noted your preference and someone will call you back within 15 minutes to confirm an available slot.',
            })
        }

        const booking = await response.json()

        // Update lead with booking info
        await collections.leads.doc(leadId).update({
            status: 'BOOKED',
            address: address || lead.address,
            appointmentTime: Timestamp.fromDate(startTime),
            calcomBookingId: booking.id || booking.uid,
            updatedAt: Timestamp.now(),
        })

        // Format confirmation for voice
        const displayTime = startTime.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })

        console.log(`[Retell Function] Booking created: ${booking.id || booking.uid}`)

        return NextResponse.json({
            result: `You are all set for ${displayTime}. You will receive a confirmation text shortly. Is there anything else I can help you with?`,
            booking_id: booking.id || booking.uid,
            datetime: startTime.toISOString(),
        })

    } catch (error) {
        console.error('[Retell Function] book_appointment error:', error)
        return NextResponse.json({
            result: 'I could not complete the booking. Someone will call you back shortly to confirm your appointment.',
        })
    }
}
