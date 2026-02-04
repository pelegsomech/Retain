import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

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
        while (await prisma.tenant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        // Create tenant
        const tenant = await prisma.tenant.create({
            data: {
                clerkOrgId,
                companyName,
                slug,
                niche,
                primaryColor: primaryColor || '#2563eb',
                twilioFromPhone: phone || null,
            },
        })

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

        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
            include: {
                _count: {
                    select: {
                        leads: true,
                        landerPages: true,
                    },
                },
            },
        })

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ tenant })
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

        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
        })

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

        const updateData: Record<string, unknown> = {}
        for (const field of allowedFields) {
            if (field in body) {
                updateData[field] = body[field]
            }
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenant.id },
            data: updateData,
        })

        return NextResponse.json({ tenant: updatedTenant })
    } catch (error) {
        console.error('[API] Tenant update failed:', error)
        return NextResponse.json(
            { error: 'Failed to update tenant' },
            { status: 500 }
        )
    }
}
