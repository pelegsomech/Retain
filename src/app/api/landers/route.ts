import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const landerSchema = z.object({
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(100),
    headline: z.string().min(1).max(200),
    subheadline: z.string().max(300).optional(),
    heroImageUrl: z.string().url().optional(),
    ctaText: z.string().max(50).optional(),
    formFields: z.array(z.object({
        name: z.string(),
        type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
        label: z.string(),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
    })).optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    isActive: z.boolean().optional(),
})

// GET /api/landers - List all landers for current tenant
export async function GET() {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const landers = await prisma.landerPage.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
        })

        // Get lead counts for each lander
        const landersWithStats = await Promise.all(
            landers.map(async (lander) => {
                const leadCount = await prisma.lead.count({
                    where: { landingPageId: lander.id },
                })
                return { ...lander, leadCount }
            })
        )

        return NextResponse.json({ landers: landersWithStats })
    } catch (error) {
        console.error('[API] Landers fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch landers' }, { status: 500 })
    }
}

// POST /api/landers - Create a new lander
export async function POST(req: NextRequest) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await prisma.tenant.findUnique({
            where: { clerkOrgId: orgId },
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const body = await req.json()
        const parsed = landerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        // Check for duplicate slug within tenant
        const existing = await prisma.landerPage.findUnique({
            where: {
                tenantId_slug: {
                    tenantId: tenant.id,
                    slug: parsed.data.slug,
                },
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'A landing page with this slug already exists' },
                { status: 409 }
            )
        }

        const lander = await prisma.landerPage.create({
            data: {
                tenantId: tenant.id,
                slug: parsed.data.slug,
                name: parsed.data.name,
                headline: parsed.data.headline,
                subheadline: parsed.data.subheadline || null,
                heroImageUrl: parsed.data.heroImageUrl || null,
                ctaText: parsed.data.ctaText || 'Get Your Free Quote',
                formFields: parsed.data.formFields || [
                    { name: 'firstName', type: 'text', label: 'First Name', required: true },
                    { name: 'lastName', type: 'text', label: 'Last Name', required: false },
                    { name: 'phone', type: 'tel', label: 'Phone', required: true },
                    { name: 'email', type: 'email', label: 'Email', required: false },
                    { name: 'address', type: 'text', label: 'Street Address', required: true },
                    { name: 'city', type: 'text', label: 'City', required: true },
                    { name: 'state', type: 'text', label: 'State', required: true },
                    { name: 'zip', type: 'text', label: 'ZIP Code', required: true },
                ],
                metaTitle: parsed.data.metaTitle || null,
                metaDescription: parsed.data.metaDescription || null,
                isActive: parsed.data.isActive ?? true,
            },
        })

        return NextResponse.json({ lander }, { status: 201 })
    } catch (error) {
        console.error('[API] Lander creation failed:', error)
        return NextResponse.json({ error: 'Failed to create lander' }, { status: 500 })
    }
}
