/**
 * One-shot script: Restore inbound config from old tenant to current tenant
 * 
 * Usage: npx tsx scripts/restore-inbound.ts
 * 
 * Finds the tenant with inboundConfig.inboundPhoneNumber containing "830"
 * and copies that config to the most recently created tenant.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const PROJECT_ID = 'retaincrm-ab8ab'

if (getApps().length === 0) {
    initializeApp({
        projectId: PROJECT_ID,
        storageBucket: `${PROJECT_ID}.appspot.com`,
    })
}

const db = getFirestore()

async function main() {
    console.log('🔍 Scanning tenants collection...\n')

    // Get all tenants
    const snapshot = await db.collection('tenants').get()
    console.log(`Found ${snapshot.size} tenant(s)\n`)

    let sourceTenant: { id: string; data: Record<string, unknown> } | null = null
    let latestTenant: { id: string; data: Record<string, unknown>; createdAt: number } | null = null

    for (const doc of snapshot.docs) {
        const data = doc.data()
        const config = data.inboundConfig as Record<string, unknown> | undefined

        console.log(`📋 Tenant: ${doc.id}`)
        console.log(`   Company: ${data.companyName || '(none)'}`)
        console.log(`   Clerk Org: ${data.clerkOrgId || '(none)'}`)
        console.log(`   Inbound Phone: ${config?.inboundPhoneNumber || '(none)'}`)
        console.log(`   Agent ID: ${config?.inboundAgentId || '(none)'}`)
        console.log(`   LLM ID: ${config?.inboundLlmId || '(none)'}`)
        console.log(`   Created: ${data.createdAt?.toDate?.() || '(unknown)'}`)
        console.log('')

        // Check if this tenant has the 830 number
        const phone = String(config?.inboundPhoneNumber || '')
        if (phone.includes('830') || phone.includes('8304536659')) {
            sourceTenant = { id: doc.id, data }
            console.log(`   ✅ FOUND SOURCE TENANT (has 830 number)\n`)
        }

        // Track latest tenant by createdAt
        const createdAt = data.createdAt?.toMillis?.() || 0
        if (!latestTenant || createdAt > latestTenant.createdAt) {
            latestTenant = { id: doc.id, data, createdAt }
        }
    }

    if (!sourceTenant) {
        console.log('❌ No tenant found with the 830 phone number.')
        console.log('   Listing all inbound configs found above. Please check manually.')
        return
    }

    if (!latestTenant) {
        console.log('❌ No target tenant found.')
        return
    }

    if (sourceTenant.id === latestTenant.id) {
        console.log('ℹ️  The source and target tenant are the same — no migration needed!')
        console.log(`   Tenant ${sourceTenant.id} already has the phone number.`)
        return
    }

    console.log('─'.repeat(50))
    console.log(`📤 SOURCE: ${sourceTenant.id} (${sourceTenant.data.companyName})`)
    console.log(`📥 TARGET: ${latestTenant.id} (${latestTenant.data.companyName})`)
    console.log('')

    const inboundConfig = sourceTenant.data.inboundConfig
    console.log('Copying inboundConfig:')
    console.log(JSON.stringify(inboundConfig, null, 2))
    console.log('')

    // Write inbound config to target tenant
    await db.collection('tenants').doc(latestTenant.id).update({
        inboundConfig,
    })

    console.log(`✅ Successfully restored inboundConfig to tenant ${latestTenant.id}`)
    console.log('   Refresh the settings page to see the number.')
}

main().catch(console.error)
