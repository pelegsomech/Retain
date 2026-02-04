import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    collections,
    Timestamp,
    getTenantByClerkOrgId,
    type Tenant,
} from '@/lib/firebase-admin'

// POST /api/tenants - Create a new tenant (during onboarding)
export async function POST(req: NextRequest) {
    try {
        const { userId, orgId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { clerkOrgId, companyName, niche, phone, primaryColor } = body

        if (!clerkOrgId || !companyName || !niche) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Generate slug from company name
        const baseSlug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Check if slug exists and add number if needed
        let slug = baseSlug
        let counter = 1
        let slugExists = true

        while (slugExists) {
            const existing = await collections.tenants
                .where('slug', '==', slug)
                .limit(1)
                .get()

            if (existing.empty) {
                slugExists = false
            } else {
                slug = `${baseSlug}-${counter}`
                counter++
            }
        }

        // Create tenant document
        const tenantData: Omit<Tenant, 'id'> = {
            clerkOrgId,
            companyName,
            slug,
            niche,
            contractorType: 'GENERAL',
            primaryColor: primaryColor || '#2563eb',
            accentColor: '#f59e0b',
            twilioFromPhone: phone || undefined,
            claimTimeoutSec: 60,
            aiToneStyle: 'professional',
            consentText: 'I consent to being contacted by phone, including by automated systems.',
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        // Use clerkOrgId as the document ID for easy lookup
        await collections.tenants.doc(clerkOrgId).set(tenantData)

        const tenant = { id: clerkOrgId, ...tenantData }

        return NextResponse.json({ tenant }, { status: 201 })
    } catch (error) {
        console.error('[API] Tenant creation failed:', error)
        return NextResponse.json(
            { error: 'Failed to create tenant' },
            { status: 500 }
        )
    }
}

// GET /api/tenants - Get current user's tenant
export async function GET() {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json(
                { error: 'No organization selected' },
                { status: 400 }
            )
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Get counts
        const [leadsSnapshot, landersSnapshot] = await Promise.all([
            collections.leads.where('tenantId', '==', tenant.id).count().get(),
            collections.landerPages.where('tenantId', '==', tenant.id).count().get(),
        ])

        const tenantWithCounts = {
            ...tenant,
            _count: {
                leads: leadsSnapshot.data().count,
                landerPages: landersSnapshot.data().count,
            },
        }

        return NextResponse.json({ tenant: tenantWithCounts })
    } catch (error) {
        console.error('[API] Tenant fetch failed:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tenant' },
            { status: 500 }
        )
    }
}

// PATCH /api/tenants - Update current tenant
export async function PATCH(req: NextRequest) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json(
                { error: 'No organization selected' },
                { status: 400 }
            )
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        const body = await req.json()
        const allowedFields = [
            'companyName',
            'logoUrl',
            'primaryColor',
            'accentColor',
            'twilioSid',
            'twilioToken',
            'twilioFromPhone',
            'retellAgentId',
            'calendarProvider',
            'calendarUrl',
            'ghlApiKey',
            'calcomApiKey',
            'consentText',
            'claimTimeoutSec',
            // New AI configuration fields
            'contractorType',
            'aiGreeting',
            'aiServiceList',
            'aiToneStyle',
            'aiObjections',
        ]

        const updateData: Record<string, unknown> = {
            updatedAt: Timestamp.now(),
        }

        for (const field of allowedFields) {
            if (field in body) {
                updateData[field] = body[field]
            }
        }

        await collections.tenants.doc(tenant.id).update(updateData)

        // Get updated tenant
        const updatedDoc = await collections.tenants.doc(tenant.id).get()
        const updatedTenant = { id: updatedDoc.id, ...updatedDoc.data() }

        return NextResponse.json({ tenant: updatedTenant })
    } catch (error) {
        console.error('[API] Tenant update failed:', error)
        return NextResponse.json(
            { error: 'Failed to update tenant' },
            { status: 500 }
        )
    }
}
