import { NextRequest, NextResponse } from 'next/server'
import { collections, logEvent, type Lead } from '@/lib/firebase-admin'

/**
 * POST /api/webhooks/twilio
 * Receives SMS delivery status webhooks from Twilio
 */
export async function POST(req: NextRequest) {
    try {
        // Twilio sends form data
        const formData = await req.formData()
        const messageSid = formData.get('MessageSid') as string
        const messageStatus = formData.get('MessageStatus') as string
        const toPhone = formData.get('To') as string
        const errorCode = formData.get('ErrorCode') as string | null

        console.log(`[Webhook] Twilio SMS ${messageSid}: ${messageStatus}`)

        // Only log failures or deliveries
        if (messageStatus === 'delivered' || messageStatus === 'failed' || messageStatus === 'undelivered') {
            // Try to find the lead by phone (best effort logging)
            const snapshot = await collections.leads
                .where('phone', '==', toPhone)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get()

            if (!snapshot.empty) {
                const leadDoc = snapshot.docs[0]
                const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

                // Log the SMS status event (using closest available event type)
                await logEvent(
                    lead.tenantId,
                    'SMS_SENT', // Using SMS_SENT as we don't have SMS_DELIVERED/FAILED in EventType
                    lead.id,
                    {
                        messageSid,
                        status: messageStatus,
                        errorCode: errorCode || undefined,
                        deliveryStatus: messageStatus,
                    }
                )
            }
        }

        // Twilio expects a 200 response
        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('[Webhook] Twilio error:', error)
        // Still return 200 to prevent Twilio retries
        return new NextResponse('OK', { status: 200 })
    }
}
