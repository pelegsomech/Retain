const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const path = require('path');

const ServiceAccount = require(path.join(__dirname, '..', 'service-account.json'));
initializeApp({ credential: cert(ServiceAccount) });
const db = getFirestore();

async function createTestLead() {
    const tenantId = 'user_39B2SuGjxDhdMN3MvkUyQmdXW3V';

    // Create a test lead with a short timeout (will expire in 10 seconds)
    const leadRef = db.collection('leads').doc();

    // Set claim to expire 10 seconds from now so it triggers AI quickly
    const claimExpiry = new Date(Date.now() + 10 * 1000);

    await leadRef.set({
        tenantId: tenantId,
        firstName: 'Test',
        lastName: 'RetellCall',
        phone: '+18186522500', // User's real phone number for testing
        email: 'test@example.com',
        city: 'Los Angeles',
        address: '123 Test St',
        source: 'manual-test',
        notes: 'Testing Retell AI integration',
        status: 'SMS_SENT',  // Set to SMS_SENT so it will be picked up by cron
        claimExpiresAt: Timestamp.fromDate(claimExpiry),
        claimToken: 'test-token-' + Date.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    console.log(`Created test lead: ${leadRef.id}`);
    console.log(`Lead will expire at: ${claimExpiry.toISOString()}`);
    console.log(`Tenant: ${tenantId}`);
    console.log(`\nWait 10-15 seconds, then run:`);
    console.log(`curl -H "Authorization: Bearer retain-cron-2024" "https://retain-backend--retaincrm-ab8ab.us-central1.hosted.app/api/cron/check-timeouts"`);
}

createTestLead().then(() => process.exit(0));
