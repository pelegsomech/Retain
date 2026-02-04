import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    collections,
    Timestamp,
    getTenantByClerkOrgId,
    logEvent,
    type Lead,
    type LeadStatus,
} from '@/lib/firebase-admin'
import { leadFormSchema } from '@/lib/validations'
import { startEscalation } from '@/lib/escalation'

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

        // Create lead document
        const leadRef = collections.leads.doc()
        const leadData: Omit<Lead, 'id'> = {
            tenantId,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName || undefined,
            phone: parsed.data.phone,
            email: parsed.data.email || undefined,
            address: parsed.data.address || undefined,
            city: parsed.data.city || undefined,
            state: parsed.data.state || undefined,
            zip: parsed.data.zip || undefined,
            utmSource: parsed.data.utmSource || undefined,
            utmMedium: parsed.data.utmMedium || undefined,
            utmCampaign: parsed.data.utmCampaign || undefined,
            landerId: landingPageId || undefined,
            status: 'NEW' as LeadStatus,
            aiConsentGiven: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        await leadRef.set(leadData)

        // Log lead created event
        await logEvent(tenantId, 'LEAD_CREATED', leadRef.id, { source: 'landing_page', ip })

        // Start escalation flow (async, don't block response)
        startEscalation(leadRef.id).catch(console.error)

        return NextResponse.json(
            { success: true, leadId: leadRef.id },
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
        const tenant = await getTenantByClerkOrgId(orgId)

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

        // Build query
        let query = collections.leads
            .where('tenantId', '==', tenant.id)
            .orderBy('createdAt', 'desc')

        if (status) {
            query = collections.leads
                .where('tenantId', '==', tenant.id)
                .where('status', '==', status)
                .orderBy('createdAt', 'desc')
        }

        // Get leads with pagination
        const snapshot = await query.limit(limit).offset(offset).get()

        const leads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Lead[]

        // Get total count
        const countQuery = status
            ? collections.leads.where('tenantId', '==', tenant.id).where('status', '==', status)
            : collections.leads.where('tenantId', '==', tenant.id)

        const countSnapshot = await countQuery.count().get()
        const total = countSnapshot.data().count

        return NextResponse.json({ leads, total, limit, offset })
    } catch (error) {
        console.error('[API] Lead list failed:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        )
    }
}
