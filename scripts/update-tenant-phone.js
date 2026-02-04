const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const ServiceAccount = require(path.join(__dirname, '..', 'service-account.json'));
initializeApp({ credential: cert(ServiceAccount) });
const db = getFirestore();

async function updateTenantPhone() {
    // Get all tenants to find the test one
    const tenants = await db.collection('tenants').get();

    console.log('Found tenants:');
    for (const doc of tenants.docs) {
        const data = doc.data();
        console.log(`- ${doc.id}: ${data.companyName || 'No name'}, twilioFromPhone: ${data.twilioFromPhone || 'NOT SET'}`);
    }

    // Update the first tenant with the new Retell/Twilio phone number
    if (tenants.docs.length > 0) {
        const firstTenant = tenants.docs[0];
        await db.collection('tenants').doc(firstTenant.id).update({
            twilioFromPhone: '+13238448244'
        });
        console.log(`\nUpdated tenant ${firstTenant.id} with twilioFromPhone: +13238448244`);
    }
}

updateTenantPhone().then(() => process.exit(0));
