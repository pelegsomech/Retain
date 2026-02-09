/**
 * Inbound Call Routing Engine
 * 
 * Decides what happens with each inbound call based on:
 * - VIP numbers (always transfer to owner)
 * - Blocked numbers (politely decline)
 * - Business hours (different greeting/behavior)
 * - Emergency keywords (priority escalation)
 */

import type {
    InboundConfig,
    InboundRouteDecision,
    BusinessHoursSchedule,
} from './firebase-admin'

// ============================================
// ROUTE DECISION
// ============================================

export interface RouteResult {
    decision: InboundRouteDecision
    reason: string
    greeting?: string
    vipLabel?: string           // If VIP, who is it
    shouldNotifyOwner: boolean
    isDuringBusinessHours: boolean
}

/**
 * Determine how to route an inbound call
 */
export function routeInboundCall(
    callerPhone: string,
    config: InboundConfig,
): RouteResult {
    const normalizedCaller = normalizePhone(callerPhone)
    const isDuringHours = isWithinBusinessHours(config.timezone, config.businessHours)

    // 1. Check VIP list → always transfer immediately
    const vipMatch = config.vipNumbers.find(
        v => normalizePhone(v.phone) === normalizedCaller
    )
    if (vipMatch) {
        return {
            decision: 'vip_transfer',
            reason: `VIP caller: ${vipMatch.label}`,
            vipLabel: vipMatch.label,
            shouldNotifyOwner: false,  // They'll get the call directly
            isDuringBusinessHours: isDuringHours,
        }
    }

    // 2. Check blocked list → reject
    const isBlocked = config.blockedNumbers.some(
        b => normalizePhone(b) === normalizedCaller
    )
    if (isBlocked) {
        return {
            decision: 'blocked',
            reason: 'Caller is in blocked list',
            shouldNotifyOwner: false,
            isDuringBusinessHours: isDuringHours,
        }
    }

    // 3. AI handles the call with appropriate greeting
    const greeting = getGreeting(config, isDuringHours)

    return {
        decision: 'ai_handled',
        reason: 'Standard inbound call → AI agent',
        greeting,
        shouldNotifyOwner: false,  // Owner gets notified after call completes
        isDuringBusinessHours: isDuringHours,
    }
}

// ============================================
// BUSINESS HOURS
// ============================================

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Check if current time falls within configured business hours
 */
export function isWithinBusinessHours(
    timezone: string,
    schedule: BusinessHoursSchedule,
): boolean {
    try {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        const parts = formatter.formatToParts(now)
        const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || ''
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
        const currentMinutes = hour * 60 + minute

        const daySchedule = schedule[weekday]
        if (!daySchedule || !daySchedule.enabled) {
            return false
        }

        const [startHour, startMin] = daySchedule.start.split(':').map(Number)
        const [endHour, endMin] = daySchedule.end.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } catch {
        // If timezone parsing fails, default to business hours active
        console.warn(`[InboundRouter] Failed to parse timezone: ${timezone}, defaulting to business hours`)
        return true
    }
}

// ============================================
// EMERGENCY DETECTION
// ============================================

/**
 * Check if the caller's message contains emergency keywords
 * Used by Retell custom function during the call
 */
export function detectEmergency(
    transcript: string,
    emergencyKeywords: string[],
): { isEmergency: boolean; matchedKeywords: string[] } {
    const lower = transcript.toLowerCase()
    const matched = emergencyKeywords.filter(kw => lower.includes(kw.toLowerCase()))

    return {
        isEmergency: matched.length > 0,
        matchedKeywords: matched,
    }
}

// ============================================
// GREETING BUILDER
// ============================================

function getGreeting(config: InboundConfig, isDuringBusinessHours: boolean): string {
    if (config.greetingMode === 'always_same') {
        return config.businessHoursGreeting
    }

    return isDuringBusinessHours
        ? config.businessHoursGreeting
        : config.afterHoursGreeting
}

// ============================================
// DEFAULT CONFIG FACTORY
// ============================================

export function createDefaultInboundConfig(
    ownerPhone: string,
    companyName: string,
): InboundConfig {
    return {
        enabled: false,
        inboundPhoneNumber: '',
        inboundAgentId: '',

        vipNumbers: [],
        blockedNumbers: [],

        timezone: 'America/Los_Angeles',
        businessHours: {
            monday: { enabled: true, start: '08:00', end: '18:00' },
            tuesday: { enabled: true, start: '08:00', end: '18:00' },
            wednesday: { enabled: true, start: '08:00', end: '18:00' },
            thursday: { enabled: true, start: '08:00', end: '18:00' },
            friday: { enabled: true, start: '08:00', end: '18:00' },
            saturday: { enabled: true, start: '09:00', end: '14:00' },
            sunday: { enabled: false, start: '09:00', end: '12:00' },
        },

        ownerPhone,

        greetingMode: 'business_hours',
        businessHoursGreeting: `Thank you for calling ${companyName}! How can I help you today?`,
        afterHoursGreeting: `Thank you for calling ${companyName}. We're currently closed, but I'd be happy to help you schedule an appointment or take a message.`,

        capabilities: {
            canBookAppointments: true,
            canAcceptServiceCalls: true,
            canProvideQuotes: false,
            canTransferToOwner: true,
            canTakeMessages: true,
            canHandleEmergencies: true,
        },

        emergencyKeywords: ['flood', 'gas leak', 'fire', 'burst pipe', 'electrical fire', 'emergency', 'urgent'],

        serviceMenu: [],
    }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Normalize phone number to E.164 format for comparison
 */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    return `+${digits}`
}
