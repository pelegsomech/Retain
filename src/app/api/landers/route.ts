import { NextRequest, NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    type LanderPage,
} from '@/lib/firebase-admin'
import { getOrCreateTenant, isAuthError } from '@/lib/auth'
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
    const authResult = await getOrCreateTenant()

    if (isAuthError(authResult)) {
        return authResult
    }

    const { tenant } = authResult

    try {

        const snapshot = await collections.landerPages
            .where('tenantId', '==', tenant.id)
            .orderBy('createdAt', 'desc')
            .get()

        const landers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as LanderPage[]

        // Get lead counts for each lander
        const landersWithStats = await Promise.all(
            landers.map(async (lander) => {
                const countSnapshot = await collections.leads
                    .where('landerId', '==', lander.id)
                    .count()
                    .get()
                return { ...lander, leadCount: countSnapshot.data().count }
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
    const authResult = await getOrCreateTenant()

    if (isAuthError(authResult)) {
        return authResult
    }

    const { tenant } = authResult

    try {

        const body = await req.json()
        const parsed = landerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        // Check for duplicate slug within tenant
        const existingSnapshot = await collections.landerPages
            .where('tenantId', '==', tenant.id)
            .where('slug', '==', parsed.data.slug)
            .limit(1)
            .get()

        if (!existingSnapshot.empty) {
            return NextResponse.json(
                { error: 'A landing page with this slug already exists' },
                { status: 409 }
            )
        }

        const landerRef = collections.landerPages.doc()
        const landerData = {
            tenantId: tenant.id,
            slug: parsed.data.slug,
            name: parsed.data.name,
            headline: parsed.data.headline,
            subheadline: parsed.data.subheadline || null,
            heroImage: parsed.data.heroImageUrl || null,
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
            showEmail: true,
            showAddress: true,
            showNotes: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        await landerRef.set(landerData)

        const lander = { id: landerRef.id, ...landerData }

        return NextResponse.json({ lander }, { status: 201 })
    } catch (error) {
        console.error('[API] Lander creation failed:', error)
        return NextResponse.json({ error: 'Failed to create lander' }, { status: 500 })
    }
}
