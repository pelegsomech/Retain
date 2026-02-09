import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
    if (getApps().length > 0) {
        return getApps()[0]
    }

    // For local development, use service account JSON file
    // For production (Firebase Hosting), credentials are automatic
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Production: Parse JSON from environment variable
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ) as ServiceAccount

        return initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID,
            storageBucket: `${serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID}.appspot.com`,
        })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Local development with service account file
        return initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'retaincrm-ab8ab',
            storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'retaincrm-ab8ab'}.appspot.com`,
        })
    } else {
        // Firebase Hosting - automatic credentials
        return initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'retaincrm-ab8ab',
            storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'retaincrm-ab8ab'}.appspot.com`,
        })
    }
}

// Initialize app
const app = initFirebaseAdmin()

// Firestore instance
export const db = getFirestore(app)

// Storage instance
export const storage = getStorage(app)

// Re-export useful Firestore utilities
export { Timestamp, FieldValue }

// Collection references
export const collections = {
    tenants: db.collection('tenants'),
    leads: db.collection('leads'),
    teamMembers: db.collection('teamMembers'),
    landerPages: db.collection('landerPages'),
    events: db.collection('events'),
    inboundCalls: db.collection('inboundCalls'),
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ContractorType =
    | 'GENERAL' | 'ROOFING' | 'HVAC' | 'HARDSCAPING' | 'ADU'
    | 'KITCHEN_BATH' | 'SIDING' | 'DECKING' | 'PLUMBING' | 'ELECTRICAL'
    | 'PAINTING' | 'LANDSCAPING' | 'SOLAR' | 'WINDOWS_DOORS' | 'FLOORING' | 'REMODELING'

export type LeadStatus =
    | 'NEW' | 'SMS_SENT' | 'CLAIMED' | 'AI_CALLING' | 'AI_QUALIFIED'
    | 'BOOKED' | 'CALLBACK_SCHEDULED' | 'DISQUALIFIED' | 'NO_ANSWER' | 'DEAD'

export type EventType =
    | 'LEAD_CREATED' | 'SMS_SENT' | 'CLAIM_CLICKED' | 'CLAIM_TIMEOUT'
    | 'AI_CALL_STARTED' | 'AI_CALL_ENDED' | 'BOOKING_CREATED'
    | 'INBOUND_CALL_RECEIVED' | 'INBOUND_CALL_TRANSFERRED' | 'INBOUND_CALL_COMPLETED'
    | 'INBOUND_EMERGENCY' | 'INBOUND_MESSAGE_TAKEN'

export interface Tenant {
    id: string
    clerkOrgId: string
    companyName: string
    slug: string
    niche: string
    contractorType: ContractorType

    // Branding
    logoUrl?: string
    primaryColor: string
    accentColor: string

    // Twilio
    twilioSid?: string
    twilioToken?: string
    twilioFromPhone?: string

    // Retell
    retellAgentId?: string

    // AI Config
    aiGreeting?: string
    aiServiceList?: string
    aiToneStyle: 'professional' | 'friendly' | 'casual'

    // Calendar
    calendarProvider?: 'CALCOM' | 'GHL'
    calendarUrl?: string
    ghlApiKey?: string
    calcomApiKey?: string
    calcomEventTypeId?: number  // Cal.com event type ID for booking

    // Settings
    claimTimeoutSec: number
    consentText: string
    isActive: boolean

    // Atomic Configuration (new structured config)
    atomicConfig?: import('./atomic-config').AtomicConfig

    // Inbound AI Phone Assistant
    inboundEnabled?: boolean
    inboundConfig?: InboundConfig

    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Lead {
    id: string
    tenantId: string

    // Contact
    firstName: string
    lastName?: string
    phone: string
    email?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    projectNotes?: string

    // Consent
    aiConsentGiven: boolean

    // Status
    status: LeadStatus
    claimedBy?: 'human' | 'ai'

    // Claim tracking
    claimToken?: string
    claimExpiresAt?: Timestamp

    // AI call
    aiCallId?: string
    aiCallOutcome?: string
    aiCallStartedAt?: Timestamp
    aiCallEndedAt?: Timestamp
    aiCallDuration?: number           // Duration in seconds
    aiCallTranscript?: string         // Full call transcript
    aiCallRecordingUrl?: string       // Firebase Storage URL (permanent)
    aiCallSummary?: string            // AI-generated call summary

    // Source
    landerId?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string

    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface TeamMember {
    id: string
    tenantId: string
    name: string
    phone: string
    email?: string
    role: 'sales' | 'manager' | 'owner'
    receiveSMS: boolean
    isActive: boolean
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface LanderPage {
    id: string
    tenantId: string
    slug: string
    isActive: boolean

    // Content
    headline: string
    subheadline?: string
    heroImage?: string
    ctaText: string

    // Form fields
    showEmail: boolean
    showAddress: boolean
    showNotes: boolean

    // Styling
    primaryColor?: string

    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface AppEvent {
    id: string
    tenantId: string
    leadId?: string
    type: EventType
    payload?: Record<string, unknown>
    createdAt: Timestamp
}

// ============================================
// INBOUND AI ASSISTANT TYPES
// ============================================

export interface BusinessHoursSchedule {
    [day: string]: {
        enabled: boolean
        start: string  // 'HH:MM' e.g. '09:00'
        end: string    // 'HH:MM' e.g. '17:00'
    }
}

export interface ServiceMenuItem {
    id: string
    name: string
    description: string
    estimatedDuration: string
    priceRange?: string
    requiresOnSiteVisit: boolean
    bookingType: 'appointment' | 'service_call' | 'consultation'
}

export interface InboundConfig {
    enabled: boolean

    // The AI receptionist's dedicated phone number (Retell-managed)
    inboundPhoneNumber: string
    inboundAgentId: string          // Separate Retell agent ID for inbound
    inboundLlmId?: string           // Retell LLM (Response Engine) ID for inbound

    // Call routing
    vipNumbers: { phone: string; label: string }[]   // Always transfer to owner
    blockedNumbers: string[]

    // Business hours (for routing decisions)
    timezone: string                // 'America/Los_Angeles'
    businessHours: BusinessHoursSchedule

    // Owner's personal phone for transfers
    ownerPhone: string

    // Greeting
    greetingMode: 'business_hours' | 'after_hours' | 'always_same'
    businessHoursGreeting: string
    afterHoursGreeting: string

    // AI capabilities
    capabilities: {
        canBookAppointments: boolean
        canAcceptServiceCalls: boolean
        canProvideQuotes: boolean
        canTransferToOwner: boolean
        canTakeMessages: boolean
        canHandleEmergencies: boolean
    }

    // Emergency keywords that trigger owner alert
    emergencyKeywords: string[]

    // Service menu the AI can offer
    serviceMenu: ServiceMenuItem[]
}

export type InboundCallOutcome =
    | 'appointment_booked' | 'service_call_scheduled' | 'message_taken'
    | 'info_provided' | 'transferred' | 'emergency_escalated' | 'spam_blocked'

export type InboundRouteDecision =
    | 'ai_handled' | 'transferred_to_owner' | 'vip_transfer' | 'blocked' | 'voicemail'

export interface InboundCall {
    id: string
    tenantId: string

    // Call info
    callerPhone: string
    callerName?: string
    twilioCallSid?: string
    callStartedAt: Timestamp
    callEndedAt?: Timestamp
    durationSeconds?: number

    // Routing
    routeDecision: InboundRouteDecision
    transferredAt?: Timestamp

    // AI interaction
    retellCallId?: string
    transcript?: string
    recordingUrl?: string
    callSummary?: string

    // Outcome
    outcome?: InboundCallOutcome

    // If appointment was booked
    appointmentTime?: Timestamp
    appointmentType?: string
    calcomBookingId?: string

    // Follow-up
    followUpRequired: boolean
    followUpNotes?: string
    ownerNotified: boolean

    createdAt: Timestamp
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tenant by Clerk organization ID
 */
export async function getTenantByClerkOrgId(clerkOrgId: string): Promise<Tenant | null> {
    try {
        console.log(`[Firestore] Looking up tenant with clerkOrgId: ${clerkOrgId}`)

        // First, try direct document lookup (faster if doc ID matches)
        const directDoc = await collections.tenants.doc(clerkOrgId).get()
        if (directDoc.exists) {
            console.log(`[Firestore] Found tenant via direct lookup: ${directDoc.id}`)
            return { id: directDoc.id, ...directDoc.data() } as Tenant
        }

        // Fallback to query
        const snapshot = await collections.tenants
            .where('clerkOrgId', '==', clerkOrgId)
            .limit(1)
            .get()

        if (snapshot.empty) {
            console.log(`[Firestore] No tenant found for clerkOrgId: ${clerkOrgId}`)
            return null
        }

        const doc = snapshot.docs[0]
        console.log(`[Firestore] Found tenant via query: ${doc.id}`)
        return { id: doc.id, ...doc.data() } as Tenant
    } catch (error) {
        console.error(`[Firestore] Error looking up tenant for ${clerkOrgId}:`, error)
        throw error
    }
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
    const snapshot = await collections.tenants
        .where('slug', '==', slug)
        .limit(1)
        .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Tenant
}

/**
 * Get lead by ID with tenant data
 */
export async function getLeadWithTenant(leadId: string): Promise<{ lead: Lead; tenant: Tenant } | null> {
    const leadDoc = await collections.leads.doc(leadId).get()
    if (!leadDoc.exists) return null

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead

    const tenantDoc = await collections.tenants.doc(lead.tenantId).get()
    if (!tenantDoc.exists) return null

    const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant

    return { lead, tenant }
}

/**
 * Get active team members for a tenant
 */
export async function getActiveTeamMembers(tenantId: string): Promise<TeamMember[]> {
    const snapshot = await collections.teamMembers
        .where('tenantId', '==', tenantId)
        .where('isActive', '==', true)
        .where('receiveSMS', '==', true)
        .get()

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember))
}

/**
 * Create an event log entry
 */
export async function logEvent(
    tenantId: string,
    type: EventType,
    leadId?: string,
    payload?: Record<string, unknown>
): Promise<string> {
    const docRef = await collections.events.add({
        tenantId,
        leadId: leadId || null,
        type,
        payload: payload || null,
        createdAt: Timestamp.now(),
    })
    return docRef.id
}
