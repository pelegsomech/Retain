import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

/**
 * Temporary one-shot endpoint to restore inboundConfig from an old tenant
 * to the current tenant.
 * 
 * GET /api/admin/restore-inbound
 * 
 * DELETE THIS AFTER USE.
 */
export async function GET() {
    try {
        const snapshot = await db.collection('tenants').get()
        const tenants: Array<{
            id: string
            companyName: string
            clerkOrgId: string
            phone: string
            agentId: string
            llmId: string
            createdAt: string
            hasInbound: boolean
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inboundConfig: any
        }> = []

        let sourceTenantId: string | null = null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sourceConfig: any = null

        for (const doc of snapshot.docs) {
            const data = doc.data()
            const config = data.inboundConfig || {}
            const phone = config.inboundPhoneNumber || ''

            tenants.push({
                id: doc.id,
                companyName: data.companyName || '(none)',
                clerkOrgId: data.clerkOrgId || '(none)',
                phone,
                agentId: config.inboundAgentId || '',
                llmId: config.inboundLlmId || '',
                createdAt: data.createdAt?.toDate?.()?.toISOString() || '(unknown)',
                hasInbound: !!phone,
                inboundConfig: config,
            })

            if (phone.includes('830') || phone.includes('8304536659')) {
                sourceTenantId = doc.id
                sourceConfig = data.inboundConfig
            }
        }

        // Find the target: latest tenant WITHOUT inbound phone
        const targetTenant = tenants
            .filter(t => !t.hasInbound && t.id !== sourceTenantId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

        if (!sourceTenantId || !sourceConfig) {
            return NextResponse.json({
                success: false,
                error: 'No tenant found with the 830 number',
                tenants,
            })
        }

        if (!targetTenant) {
            return NextResponse.json({
                success: false,
                error: 'No target tenant without inbound config found',
                tenants,
            })
        }

        // Copy inbound config
        await db.collection('tenants').doc(targetTenant.id).update({
            inboundConfig: sourceConfig,
        })

        return NextResponse.json({
            success: true,
            message: `Copied inboundConfig from tenant ${sourceTenantId} to ${targetTenant.id}`,
            source: { id: sourceTenantId, phone: sourceConfig.inboundPhoneNumber },
            target: { id: targetTenant.id, companyName: targetTenant.companyName },
            tenants,
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 })
    }
}
