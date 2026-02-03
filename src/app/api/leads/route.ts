import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { leadFormSchema } from '@/lib/validations'
import { startEscalation } from '@/lib/escalation'
import { LeadStatus, EventType } from '@prisma/client'

// POST /api/leads - Create a new lead (from landing page)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Validate input
        const parsed = leadFormSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { tenantId, landingPageId, consentText } = body

        if (!tenantId) {
            return NextResponse.json(
                { error: 'tenantId is required' },
                { status: 400 }
            )
        }

        // Get client IP for TCPA compliance
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown'

        // Create lead
        const lead = await prisma.lead.create({
            data: {
                tenantId,
                firstName: parsed.data.firstName,
                lastName: parsed.data.lastName,
                phone: parsed.data.phone,
                email: parsed.data.email || null,
                address: parsed.data.address,
                city: parsed.data.city,
                state: parsed.data.state,
                zip: parsed.data.zip,
                utmSource: parsed.data.utmSource,
                utmMedium: parsed.data.utmMedium,
                utmCampaign: parsed.data.utmCampaign,
                landingPageId,
                source: 'landing_page',
                status: LeadStatus.NEW,
                tcpaConsentAt: new Date(),
                tcpaConsentText: consentText,
                aiConsentGiven: true, // Form includes AI consent
                ipAddress: ip,
            },
        })

        // Log lead created event
        await prisma.event.create({
            data: {
                tenantId,
                leadId: lead.id,
                type: EventType.LEAD_CREATED,
                payload: { source: 'landing_page', ip },
            },
        })

        // Start escalation flow (async, don't block response)
        startEscalation(lead.id).catch(console.error)

        return NextResponse.json(
            { success: true, leadId: lead.id },
            { status: 201 }
        )
    } catch (error) {
        console.error('[API] Lead creation failed:', error)
        return NextResponse.json(
            { error: 'Failed to create lead' },
            { status: 500 }
        )
    }
}

// GET /api/leads - List leads for current tenant (authenticated)
export async function GET(req: NextRequest) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Find tenant by Clerk org ID
        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
        })

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Parse query params
        const url = new URL(req.url)
        const status = url.searchParams.get('status') as LeadStatus | null
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')

        const leads = await prisma.lead.findMany({
            where: {
                tenantId: tenant.id,
                ...(status && { status }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        })

        const total = await prisma.lead.count({
            where: {
                tenantId: tenant.id,
                ...(status && { status }),
            },
        })

        return NextResponse.json({ leads, total, limit, offset })
    } catch (error) {
        console.error('[API] Lead list failed:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        )
    }
}
