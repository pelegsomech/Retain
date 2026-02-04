import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    collections,
    Timestamp,
    getTenantByClerkOrgId,
    type LanderPage,
} from '@/lib/firebase-admin'
import { z } from 'zod'

const updateLanderSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    headline: z.string().min(1).max(200).optional(),
    subheadline: z.string().max(300).optional().nullable(),
    heroImageUrl: z.string().url().optional().nullable(),
    ctaText: z.string().max(50).optional(),
    formFields: z.array(z.object({
        name: z.string(),
        type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
        label: z.string(),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
    })).optional(),
    metaTitle: z.string().max(60).optional().nullable(),
    metaDescription: z.string().max(160).optional().nullable(),
    isActive: z.boolean().optional(),
})

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/landers/[id] - Get single lander
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const landerDoc = await collections.landerPages.doc(id).get()

        if (!landerDoc.exists) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const lander = { id: landerDoc.id, ...landerDoc.data() } as LanderPage

        if (lander.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const countSnapshot = await collections.leads
            .where('landerId', '==', lander.id)
            .count()
            .get()

        return NextResponse.json({ lander: { ...lander, leadCount: countSnapshot.data().count } })
    } catch (error) {
        console.error('[API] Lander fetch failed:', error)
        return NextResponse.json({ error: 'Failed to fetch lander' }, { status: 500 })
    }
}

// PATCH /api/landers/[id] - Update lander
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const existingDoc = await collections.landerPages.doc(id).get()

        if (!existingDoc.exists) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const existing = existingDoc.data() as LanderPage
        if (existing.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const body = await req.json()
        const parsed = updateLanderSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const updateData = {
            ...parsed.data,
            updatedAt: Timestamp.now(),
        }

        await collections.landerPages.doc(id).update(updateData)

        const updatedDoc = await collections.landerPages.doc(id).get()
        const lander = { id: updatedDoc.id, ...updatedDoc.data() }

        return NextResponse.json({ lander })
    } catch (error) {
        console.error('[API] Lander update failed:', error)
        return NextResponse.json({ error: 'Failed to update lander' }, { status: 500 })
    }
}

// DELETE /api/landers/[id] - Delete lander
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenant = await getTenantByClerkOrgId(orgId)

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const existingDoc = await collections.landerPages.doc(id).get()

        if (!existingDoc.exists) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const existing = existingDoc.data() as LanderPage
        if (existing.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        await collections.landerPages.doc(id).delete()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Lander deletion failed:', error)
        return NextResponse.json({ error: 'Failed to delete lander' }, { status: 500 })
    }
}
