/**
 * Atomic Configuration Schema
 * 
 * Structured configuration for client onboarding that powers:
 * - Settings UI (forms with dropdowns/presets)
 * - Retell AI agent dynamic variables
 * - Lead qualification logic
 */

import { z } from 'zod'

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const INDUSTRY_NICHES = [
    'GENERAL', 'ROOFING', 'HVAC', 'HARDSCAPING', 'ADU', 'KITCHEN_BATH',
    'SIDING', 'DECKING', 'PLUMBING', 'ELECTRICAL', 'PAINTING',
    'LANDSCAPING', 'SOLAR', 'WINDOWS_DOORS', 'FLOORING', 'REMODELING',
] as const

export const AGENT_PERSONAS = [
    'professional',      // Formal, business-like
    'helpful_neighbor',  // Warm, approachable
    'expert',            // Authoritative, knowledgeable
    'direct',            // Efficient, to-the-point
    'casual',            // Relaxed, conversational
] as const

export const FEE_STRATEGIES = [
    'free_estimate',
    'flat_fee',
    'deposit_required',
    'hourly_rate',
] as const

export const SPEECH_PACING_OPTIONS = ['snappy', 'moderate', 'slow'] as const
export const INTERRUPTION_TOLERANCE_OPTIONS = ['low', 'medium', 'high'] as const
export const FORMALITY_LEVELS = ['formal', 'casual', 'first_name_basis'] as const
export const CALENDAR_PROVIDERS = ['google_calendar', 'calendly', 'calcom', 'jobber', 'gohighlevel'] as const
export const PAYMENT_METHODS = ['on_site', 'phone_stripe', 'none'] as const
export const CALL_OUTCOMES = ['booked', 'callback', 'not_interested', 'wrong_number', 'no_answer', 'voicemail'] as const

export type IndustryNiche = typeof INDUSTRY_NICHES[number]
export type AgentPersona = typeof AGENT_PERSONAS[number]
export type FeeStrategy = typeof FEE_STRATEGIES[number]
export type SpeechPacing = typeof SPEECH_PACING_OPTIONS[number]
export type InterruptionTolerance = typeof INTERRUPTION_TOLERANCE_OPTIONS[number]
export type FormalityLevel = typeof FORMALITY_LEVELS[number]
export type CalendarProvider = typeof CALENDAR_PROVIDERS[number]
export type PaymentMethod = typeof PAYMENT_METHODS[number]
export type CallOutcome = typeof CALL_OUTCOMES[number]

// ============================================
// SCHEMA INTERFACES
// ============================================

export interface ClientMetadata {
    client_id: string
    onboarding_date: string  // ISO date
    account_status: 'active' | 'inactive' | 'trial'
}

export interface BusinessIdentity {
    brand_name: string
    industry_niche: IndustryNiche
    agent_persona: AgentPersona
    primary_service: string
    service_area_description: string
    local_office_city: string
}

export interface LinguisticMap {
    noun_singular: string      // e.g., "deck", "roof", "system"
    noun_plural: string        // e.g., "decks", "roofs", "systems"
    visit_title: string        // e.g., "design consultation", "diagnostic"
    specialist_title: string   // e.g., "Project Designer", "Technician"
    primary_action_verb: string // e.g., "build", "repair", "install"
    urgency_hook: string       // e.g., "the spring rush", "before the summer heat"
}

export interface FinancialLogic {
    fee_strategy: FeeStrategy
    fee_amount: number         // In cents (0 for free_estimate)
    fee_currency: string
    is_refundable: boolean
    credit_to_project: boolean
    credit_window_days: number
    payment_collection_method: PaymentMethod
}

export interface ConversationalParameters {
    latency_fillers: string[]        // ["Gotcha", "Mm-hm", "Sure thing"]
    speech_pacing: SpeechPacing
    interruption_tolerance: InterruptionTolerance
    sentence_length_max: number      // Max words per sentence for LLM
    use_disfluencies: boolean        // Add "ums" and "uhs"
    formality_level: FormalityLevel
}

export interface QualificationChecklist {
    ask_property_ownership: boolean
    ask_decision_makers: boolean
    ask_budget_range: boolean
    ask_timeline: boolean
    ask_insurance_claim: boolean     // For roofing/water damage
    ask_financing_interest: boolean
    ask_permit_status: boolean
}

export interface TechnicalIntegration {
    calendar_provider: CalendarProvider | null
    calendar_id: string | null
    sms_confirmation: boolean
    webhook_url: string | null
    call_outcome_options: CallOutcome[]
}

export interface AtomicConfig {
    client_metadata: ClientMetadata
    business_identity: BusinessIdentity
    linguistic_map: LinguisticMap
    financial_logic: FinancialLogic
    conversational_parameters: ConversationalParameters
    qualification_checklist: QualificationChecklist
    technical_integration: TechnicalIntegration
}

// ============================================
// ZOD VALIDATORS
// ============================================

export const ClientMetadataSchema = z.object({
    client_id: z.string(),
    onboarding_date: z.string(),
    account_status: z.enum(['active', 'inactive', 'trial']),
})

export const BusinessIdentitySchema = z.object({
    brand_name: z.string().min(1),
    industry_niche: z.enum(INDUSTRY_NICHES),
    agent_persona: z.enum(AGENT_PERSONAS),
    primary_service: z.string().min(1),
    service_area_description: z.string(),
    local_office_city: z.string(),
})

export const LinguisticMapSchema = z.object({
    noun_singular: z.string().min(1),
    noun_plural: z.string().min(1),
    visit_title: z.string().min(1),
    specialist_title: z.string().min(1),
    primary_action_verb: z.string().min(1),
    urgency_hook: z.string(),
})

export const FinancialLogicSchema = z.object({
    fee_strategy: z.enum(FEE_STRATEGIES),
    fee_amount: z.number().min(0),
    fee_currency: z.string().default('USD'),
    is_refundable: z.boolean(),
    credit_to_project: z.boolean(),
    credit_window_days: z.number().min(0),
    payment_collection_method: z.enum(PAYMENT_METHODS),
})

export const ConversationalParametersSchema = z.object({
    latency_fillers: z.array(z.string()),
    speech_pacing: z.enum(SPEECH_PACING_OPTIONS),
    interruption_tolerance: z.enum(INTERRUPTION_TOLERANCE_OPTIONS),
    sentence_length_max: z.number().min(5).max(50),
    use_disfluencies: z.boolean(),
    formality_level: z.enum(FORMALITY_LEVELS),
})

export const QualificationChecklistSchema = z.object({
    ask_property_ownership: z.boolean(),
    ask_decision_makers: z.boolean(),
    ask_budget_range: z.boolean(),
    ask_timeline: z.boolean(),
    ask_insurance_claim: z.boolean(),
    ask_financing_interest: z.boolean(),
    ask_permit_status: z.boolean(),
})

export const TechnicalIntegrationSchema = z.object({
    calendar_provider: z.enum(CALENDAR_PROVIDERS).nullable(),
    calendar_id: z.string().nullable(),
    sms_confirmation: z.boolean(),
    webhook_url: z.string().url().nullable().or(z.literal('')),
    call_outcome_options: z.array(z.enum(CALL_OUTCOMES)),
})

export const AtomicConfigSchema = z.object({
    client_metadata: ClientMetadataSchema,
    business_identity: BusinessIdentitySchema,
    linguistic_map: LinguisticMapSchema,
    financial_logic: FinancialLogicSchema,
    conversational_parameters: ConversationalParametersSchema,
    qualification_checklist: QualificationChecklistSchema,
    technical_integration: TechnicalIntegrationSchema,
})

// ============================================
// INDUSTRY PRESETS
// ============================================

export const INDUSTRY_PRESETS: Record<IndustryNiche, LinguisticMap> = {
    GENERAL: {
        noun_singular: 'project',
        noun_plural: 'projects',
        visit_title: 'consultation',
        specialist_title: 'Project Manager',
        primary_action_verb: 'complete',
        urgency_hook: 'before your calendar fills up',
    },
    ROOFING: {
        noun_singular: 'roof',
        noun_plural: 'roofs',
        visit_title: 'inspection',
        specialist_title: 'Roofing Specialist',
        primary_action_verb: 'replace',
        urgency_hook: 'before the next storm',
    },
    HVAC: {
        noun_singular: 'system',
        noun_plural: 'systems',
        visit_title: 'diagnostic',
        specialist_title: 'HVAC Technician',
        primary_action_verb: 'repair',
        urgency_hook: 'before the summer heat',
    },
    HARDSCAPING: {
        noun_singular: 'patio',
        noun_plural: 'outdoor spaces',
        visit_title: 'design consultation',
        specialist_title: 'Project Designer',
        primary_action_verb: 'build',
        urgency_hook: 'before the spring rush',
    },
    ADU: {
        noun_singular: 'ADU',
        noun_plural: 'ADUs',
        visit_title: 'site evaluation',
        specialist_title: 'ADU Specialist',
        primary_action_verb: 'build',
        urgency_hook: 'before permit regulations change',
    },
    KITCHEN_BATH: {
        noun_singular: 'space',
        noun_plural: 'spaces',
        visit_title: 'design consultation',
        specialist_title: 'Design Consultant',
        primary_action_verb: 'remodel',
        urgency_hook: 'before the holiday season',
    },
    SIDING: {
        noun_singular: 'exterior',
        noun_plural: 'exteriors',
        visit_title: 'estimate',
        specialist_title: 'Siding Pro',
        primary_action_verb: 'update',
        urgency_hook: 'before winter weather sets in',
    },
    DECKING: {
        noun_singular: 'deck',
        noun_plural: 'decks',
        visit_title: 'design consultation',
        specialist_title: 'Project Designer',
        primary_action_verb: 'build',
        urgency_hook: 'the spring rush',
    },
    PLUMBING: {
        noun_singular: 'plumbing',
        noun_plural: 'plumbing systems',
        visit_title: 'diagnostic',
        specialist_title: 'Master Plumber',
        primary_action_verb: 'fix',
        urgency_hook: 'before it becomes an emergency',
    },
    ELECTRICAL: {
        noun_singular: 'electrical system',
        noun_plural: 'electrical systems',
        visit_title: 'inspection',
        specialist_title: 'Licensed Electrician',
        primary_action_verb: 'upgrade',
        urgency_hook: 'for safety compliance',
    },
    PAINTING: {
        noun_singular: 'home',
        noun_plural: 'homes',
        visit_title: 'color consultation',
        specialist_title: 'Paint Pro',
        primary_action_verb: 'transform',
        urgency_hook: 'while the weather is good',
    },
    LANDSCAPING: {
        noun_singular: 'yard',
        noun_plural: 'outdoor spaces',
        visit_title: 'design consultation',
        specialist_title: 'Landscape Designer',
        primary_action_verb: 'transform',
        urgency_hook: 'before planting season ends',
    },
    SOLAR: {
        noun_singular: 'solar system',
        noun_plural: 'solar installations',
        visit_title: 'site assessment',
        specialist_title: 'Solar Consultant',
        primary_action_verb: 'install',
        urgency_hook: 'before incentives expire',
    },
    WINDOWS_DOORS: {
        noun_singular: 'window',
        noun_plural: 'windows and doors',
        visit_title: 'measurement appointment',
        specialist_title: 'Window Specialist',
        primary_action_verb: 'replace',
        urgency_hook: 'before energy bills spike',
    },
    FLOORING: {
        noun_singular: 'floor',
        noun_plural: 'floors',
        visit_title: 'measurement consultation',
        specialist_title: 'Flooring Specialist',
        primary_action_verb: 'install',
        urgency_hook: 'before the busy season',
    },
    REMODELING: {
        noun_singular: 'home',
        noun_plural: 'spaces',
        visit_title: 'design consultation',
        specialist_title: 'Remodeling Expert',
        primary_action_verb: 'transform',
        urgency_hook: 'before contractors book up',
    },
}

// ============================================
// DEFAULT CONFIG FACTORY
// ============================================

export function createDefaultAtomicConfig(
    clientId: string,
    brandName: string,
    industryNiche: IndustryNiche = 'GENERAL'
): AtomicConfig {
    const linguisticPreset = INDUSTRY_PRESETS[industryNiche]

    return {
        client_metadata: {
            client_id: clientId,
            onboarding_date: new Date().toISOString().split('T')[0],
            account_status: 'active',
        },
        business_identity: {
            brand_name: brandName,
            industry_niche: industryNiche,
            agent_persona: 'helpful_neighbor',
            primary_service: linguisticPreset.noun_singular + ' services',
            service_area_description: 'the local area',
            local_office_city: '',
        },
        linguistic_map: { ...linguisticPreset },
        financial_logic: {
            fee_strategy: 'free_estimate',
            fee_amount: 0,
            fee_currency: 'USD',
            is_refundable: false,
            credit_to_project: true,
            credit_window_days: 30,
            payment_collection_method: 'none',
        },
        conversational_parameters: {
            latency_fillers: ['Gotcha', 'Mm-hm', 'Sure thing', 'Let me see'],
            speech_pacing: 'snappy',
            interruption_tolerance: 'high',
            sentence_length_max: 15,
            use_disfluencies: true,
            formality_level: 'first_name_basis',
        },
        qualification_checklist: {
            ask_property_ownership: true,
            ask_decision_makers: true,
            ask_budget_range: false,
            ask_timeline: true,
            ask_insurance_claim: industryNiche === 'ROOFING',
            ask_financing_interest: false,
            ask_permit_status: false,
        },
        technical_integration: {
            calendar_provider: null,
            calendar_id: null,
            sms_confirmation: true,
            webhook_url: null,
            call_outcome_options: ['booked', 'callback', 'not_interested', 'wrong_number'],
        },
    }
}

// ============================================
// RETELL VARIABLE BUILDER
// ============================================

/**
 * Build the retell_llm_dynamic_variables object from an AtomicConfig
 * These variables are injected into the Retell agent prompt at call time
 */
export function buildRetellVariables(
    config: AtomicConfig,
    leadContext: {
        firstName: string
        lastName?: string
        address?: string
        city?: string
        projectNotes?: string
    }
): Record<string, string> {
    const bi = config.business_identity
    const lm = config.linguistic_map
    const cp = config.conversational_parameters
    const qc = config.qualification_checklist
    const ti = config.technical_integration
    const fl = config.financial_logic

    // Build qualification prompt based on checklist
    const qualificationAsks: string[] = []
    if (qc.ask_property_ownership) qualificationAsks.push('confirm property ownership')
    if (qc.ask_decision_makers) qualificationAsks.push('confirm decision-maker presence')
    if (qc.ask_budget_range) qualificationAsks.push('ask about budget range')
    if (qc.ask_timeline) qualificationAsks.push('ask about project timeline')
    if (qc.ask_insurance_claim) qualificationAsks.push('ask if this is an insurance claim')
    if (qc.ask_financing_interest) qualificationAsks.push('ask about financing interest')
    if (qc.ask_permit_status) qualificationAsks.push('ask about permit status')

    // Build fee description
    let feeDescription = 'free'
    if (fl.fee_strategy === 'flat_fee') {
        feeDescription = `$${(fl.fee_amount / 100).toFixed(0)}`
    } else if (fl.fee_strategy === 'deposit_required') {
        feeDescription = `$${(fl.fee_amount / 100).toFixed(0)} deposit`
    }

    return {
        // Business Identity
        brand_name: bi.brand_name,
        agent_persona: bi.agent_persona,
        primary_service: bi.primary_service,
        service_area: bi.service_area_description,
        office_city: bi.local_office_city,
        industry: bi.industry_niche.toLowerCase().replace('_', ' '),

        // Linguistic Map (for slot-filling in prompts)
        noun_singular: lm.noun_singular,
        noun_plural: lm.noun_plural,
        visit_title: lm.visit_title,
        specialist_title: lm.specialist_title,
        action_verb: lm.primary_action_verb,
        urgency_hook: lm.urgency_hook,

        // Conversational Style
        latency_fillers: cp.latency_fillers.join(', '),
        speech_pacing: cp.speech_pacing,
        formality: cp.formality_level,
        use_disfluencies: cp.use_disfluencies ? 'true' : 'false',
        max_sentence_words: String(cp.sentence_length_max),
        interruption_tolerance: cp.interruption_tolerance,

        // Qualification
        qualification_asks: qualificationAsks.length > 0
            ? qualificationAsks.join('; ')
            : 'no specific qualification questions',

        // Financial
        fee_description: feeDescription,
        credit_to_project: fl.credit_to_project ? 'true' : 'false',

        // Calendar
        calendar_link: ti.calendar_id || '',
        has_calendar: ti.calendar_provider ? 'true' : 'false',
        sms_confirmation: ti.sms_confirmation ? 'true' : 'false',

        // Lead Context
        lead_name: leadContext.firstName,
        lead_full_name: `${leadContext.firstName} ${leadContext.lastName || ''}`.trim(),
        lead_address: leadContext.address || 'not provided',
        lead_city: leadContext.city || 'your area',
        project_notes: leadContext.projectNotes || '',
    }
}

// ============================================
// MIGRATION HELPER
// ============================================

/**
 * Convert legacy flat tenant fields to AtomicConfig
 * Used for backwards compatibility during migration
 */
export function migrateFromLegacyTenant(tenant: {
    id: string
    companyName: string
    contractorType?: string
    niche?: string
    aiGreeting?: string
    aiServiceList?: string
    aiToneStyle?: string
    calendarUrl?: string
    calendarProvider?: string
}): AtomicConfig {
    const industryNiche = (tenant.contractorType || tenant.niche || 'GENERAL') as IndustryNiche
    const config = createDefaultAtomicConfig(tenant.id, tenant.companyName, industryNiche)

    // Override with any existing values
    if (tenant.aiServiceList) {
        config.business_identity.primary_service = tenant.aiServiceList
    }

    if (tenant.aiToneStyle) {
        const toneMap: Record<string, AgentPersona> = {
            professional: 'professional',
            friendly: 'helpful_neighbor',
            casual: 'casual',
        }
        config.business_identity.agent_persona = toneMap[tenant.aiToneStyle] || 'helpful_neighbor'
    }

    if (tenant.calendarUrl) {
        config.technical_integration.calendar_id = tenant.calendarUrl
        config.technical_integration.calendar_provider = (tenant.calendarProvider?.toLowerCase() as CalendarProvider) || 'calcom'
    }

    return config
}

// ============================================
// UI DISPLAY HELPERS
// ============================================

export const INDUSTRY_LABELS: Record<IndustryNiche, string> = {
    GENERAL: 'General Contractor',
    ROOFING: 'Roofing',
    HVAC: 'HVAC & Climate Control',
    HARDSCAPING: 'Hardscaping & Outdoor Living',
    ADU: 'ADU (Accessory Dwelling Units)',
    KITCHEN_BATH: 'Kitchen & Bathroom Remodeling',
    SIDING: 'Siding & Exterior',
    DECKING: 'Decking & Outdoor Structures',
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    PAINTING: 'Painting & Finishing',
    LANDSCAPING: 'Landscaping',
    SOLAR: 'Solar Installation',
    WINDOWS_DOORS: 'Windows & Doors',
    FLOORING: 'Flooring',
    REMODELING: 'Home Remodeling',
}

export const PERSONA_LABELS: Record<AgentPersona, { label: string; desc: string }> = {
    professional: { label: 'Professional', desc: 'Formal, business-like tone' },
    helpful_neighbor: { label: 'Helpful Neighbor', desc: 'Warm, approachable conversations' },
    expert: { label: 'Expert', desc: 'Authoritative, knowledgeable tone' },
    direct: { label: 'Direct', desc: 'Efficient, to-the-point' },
    casual: { label: 'Casual', desc: 'Relaxed, conversational style' },
}

export const FEE_STRATEGY_LABELS: Record<FeeStrategy, string> = {
    free_estimate: 'Free Estimate',
    flat_fee: 'Flat Service Fee',
    deposit_required: 'Deposit Required',
    hourly_rate: 'Hourly Rate',
}
