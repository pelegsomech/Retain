import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

/**
 * TEMPORARY — restore inboundConfig from old tenant to latest tenant.
 * DELETE AFTER USE.
 */
export async function GET() {
    try {
        const snapshot = await db.collection('tenants').get()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sourceConfig: any = null
        let sourceTenantId: string | null = null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tenants: any[] = []

        for (const doc of snapshot.docs) {
            const data = doc.data()
            const config = data.inboundConfig || {}
            const phone = config.inboundPhoneNumber || ''
            tenants.push({ id: doc.id, company: data.companyName, phone, created: data.createdAt?.toDate?.()?.toISOString() })
            if (phone.includes('830')) {
                sourceTenantId = doc.id
                sourceConfig = data.inboundConfig
            }
        }

        if (!sourceTenantId || !sourceConfig) {
            return NextResponse.json({ success: false, error: 'No 830 number found', tenants })
        }

        // Find latest tenant WITHOUT an inbound phone
        const target = tenants
            .filter(t => !t.phone && t.id !== sourceTenantId)
            .sort((a, b) => (b.created || '').localeCompare(a.created || ''))[0]

        if (!target) {
            return NextResponse.json({ success: false, error: 'No target tenant', tenants })
        }

        await db.collection('tenants').doc(target.id).update({ inboundConfig: sourceConfig })

        return NextResponse.json({
            success: true,
            message: `Restored to ${target.id} (${target.company})`,
            source: sourceTenantId,
            target: target.id,
            tenants,
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
