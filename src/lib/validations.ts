import { z } from 'zod'

// Lead form submission validation
export const leadFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
})

export type LeadFormInput = z.infer<typeof leadFormSchema>

// Tenant settings validation
export const tenantSettingsSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    niche: z.string().min(1, 'Niche is required'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    calendarProvider: z.enum(['CALCOM', 'GHL']).optional(),
    calendarUrl: z.string().url().optional().or(z.literal('')),
    twilioFromPhone: z.string().optional(),
    claimTimeoutSec: z.number().min(30).max(300).default(60),
    consentText: z.string().optional(),
})

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>

// API response wrapper
export const apiErrorSchema = z.object({
    error: z.string(),
    code: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
