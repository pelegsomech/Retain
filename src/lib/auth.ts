import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
    collections,
    Timestamp,
    getTenantByClerkOrgId,
    type Tenant,
} from '@/lib/firebase-admin'

export interface AuthResult {
    tenantId: string
    tenant: Tenant
    userId: string
    isPersonal: boolean // true if using userId, false if using orgId
}

/**
 * Get or create tenant for the authenticated user.
 * Supports both Clerk organizations (orgId) and personal accounts (userId).
 * 
 * @returns AuthResult with tenant info, or NextResponse error
 */
export async function getOrCreateTenant(): Promise<AuthResult | NextResponse> {
    try {
        const { userId, orgId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized - please sign in' },
                { status: 401 }
            )
        }

        // Determine the tenant identifier: prefer orgId, fallback to userId
        // Note: Clerk userId already starts with "user_" so we don't add another prefix
        const tenantIdentifier = orgId || userId
        const isPersonal = !orgId

        // Try to find existing tenant
        let tenant = await getTenantByClerkOrgId(tenantIdentifier)

        // If no tenant exists, auto-create one for personal accounts
        if (!tenant && isPersonal) {
            let companyName = 'My Business'
            try {
                const user = await currentUser()
                if (user?.firstName) {
                    companyName = `${user.firstName}'s Business`
                }
            } catch (e) {
                console.warn('[Auth] Could not get current user, using default company name:', e)
            }

            // Generate a unique slug
            const baseSlug = companyName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 30)

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

            // Create new tenant
            const tenantData: Omit<Tenant, 'id'> = {
                clerkOrgId: tenantIdentifier,
                companyName,
                slug,
                niche: 'general',
                contractorType: 'GENERAL',
                primaryColor: '#2563eb',
                accentColor: '#f59e0b',
                claimTimeoutSec: 60,
                aiToneStyle: 'professional',
                consentText: 'I consent to being contacted by phone, including by automated systems.',
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }

            await collections.tenants.doc(tenantIdentifier).set(tenantData)
            tenant = { id: tenantIdentifier, ...tenantData }

            console.log(`[Auth] Auto-created tenant for user ${userId}: ${tenant.id}`)
        }

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found - complete onboarding first' },
                { status: 404 }
            )
        }

        return {
            tenantId: tenant.id,
            tenant,
            userId,
            isPersonal,
        }
    } catch (error) {
        console.error('[Auth] Error in getOrCreateTenant:', error)
        return NextResponse.json(
            { error: 'Authentication error' },
            { status: 500 }
        )
    }
}

/**
 * Simple auth check that requires a tenant, returning error response if not found.
 * Use when you only need to verify auth, not auto-create.
 */
export async function requireTenant(): Promise<AuthResult | NextResponse> {
    return getOrCreateTenant()
}

/**
 * Check if a result is an error response
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
    return result instanceof NextResponse
}
