import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EventType } from '@prisma/client'

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
            const lead = await prisma.lead.findFirst({
                where: { phone: toPhone },
                orderBy: { createdAt: 'desc' },
            })

            if (lead) {
                await prisma.event.create({
                    data: {
                        tenantId: lead.tenantId,
                        leadId: lead.id,
                        type: messageStatus === 'delivered'
                            ? EventType.SMS_DELIVERED
                            : EventType.SMS_FAILED,
                        payload: {
                            messageSid,
                            status: messageStatus,
                            errorCode: errorCode || undefined,
                        },
                    },
                })
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
