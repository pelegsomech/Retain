import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET /api/team - Get all team members for current tenant
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
        })

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        const teamMembers = await prisma.teamMember.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ teamMembers })
    } catch (error) {
        console.error('[API] Team fetch failed:', error)
        return NextResponse.json(
            { error: 'Failed to fetch team members' },
            { status: 500 }
        )
    }
}

// POST /api/team - Add a new team member
export async function POST(req: NextRequest) {
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
        const { name, phone, email, role } = body

        if (!name || !phone) {
            return NextResponse.json(
                { error: 'Name and phone are required' },
                { status: 400 }
            )
        }

        // Normalize phone number (basic cleanup)
        const normalizedPhone = phone.replace(/[^\d+]/g, '')

        const teamMember = await prisma.teamMember.create({
            data: {
                tenantId: tenant.id,
                name,
                phone: normalizedPhone,
                email: email || null,
                role: role || 'sales',
                receiveSMS: true,
                isActive: true,
            },
        })

        return NextResponse.json({ teamMember }, { status: 201 })
    } catch (error) {
        console.error('[API] Team member creation failed:', error)
        return NextResponse.json(
            { error: 'Failed to create team member' },
            { status: 500 }
        )
    }
}

// PATCH /api/team - Update a team member
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
        const { id, name, phone, email, role, receiveSMS, isActive } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Team member ID is required' },
                { status: 400 }
            )
        }

        // Verify team member belongs to this tenant
        const existing = await prisma.teamMember.findFirst({
            where: { id, tenantId: tenant.id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'Team member not found' },
                { status: 404 }
            )
        }

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phone !== undefined) updateData.phone = phone.replace(/[^\d+]/g, '')
        if (email !== undefined) updateData.email = email
        if (role !== undefined) updateData.role = role
        if (receiveSMS !== undefined) updateData.receiveSMS = receiveSMS
        if (isActive !== undefined) updateData.isActive = isActive

        const teamMember = await prisma.teamMember.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({ teamMember })
    } catch (error) {
        console.error('[API] Team member update failed:', error)
        return NextResponse.json(
            { error: 'Failed to update team member' },
            { status: 500 }
        )
    }
}

// DELETE /api/team - Delete a team member
export async function DELETE(req: NextRequest) {
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

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Team member ID is required' },
                { status: 400 }
            )
        }

        // Verify team member belongs to this tenant
        const existing = await prisma.teamMember.findFirst({
            where: { id, tenantId: tenant.id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'Team member not found' },
                { status: 404 }
            )
        }

        await prisma.teamMember.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Team member deletion failed:', error)
        return NextResponse.json(
            { error: 'Failed to delete team member' },
            { status: 500 }
        )
    }
}
