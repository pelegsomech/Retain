import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    logEvent,
    type Lead,
    type LeadStatus,
} from '@/lib/firebase-admin'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'
import { leadFormSchema } from '@/lib/validations'
import { startEscalation } from '@/lib/escalation'

// POST /api/leads - Create a new lead (from landing page OR dashboard)
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

        // Get tenantId from body (landing page flow) or from auth (dashboard flow)
        let tenantId = body.tenantId
        const landingPageId = body.landingPageId

        // If no tenantId provided, try to get from authenticated user
        if (!tenantId) {
            const authResult = await getOrCreateTenant()
            if (isAuthError(authResult)) {
                return authResult
            }
            tenantId = authResult.tenant.id
        }

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

        // Create lead document - only include defined values (Firestore rejects undefined)
        const leadRef = collections.leads.doc()
        const leadData = Object.fromEntries(
            Object.entries({
                tenantId,
                firstName: parsed.data.firstName,
                lastName: parsed.data.lastName || null,
                phone: parsed.data.phone,
                email: parsed.data.email || null,
                address: parsed.data.address || null,
                city: parsed.data.city || null,
                state: parsed.data.state || null,
                zip: parsed.data.zip || null,
                utmSource: parsed.data.utmSource || null,
                utmMedium: parsed.data.utmMedium || null,
                utmCampaign: parsed.data.utmCampaign || null,
                landerId: landingPageId || null,
                status: 'NEW' as LeadStatus,
                aiConsentGiven: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }).filter(([_, v]) => v !== null && v !== undefined)
        )

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
    const authResult = await getOrCreateTenant()

    if (isAuthError(authResult)) {
        return authResult
    }

    const { tenant } = authResult

    try {

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
