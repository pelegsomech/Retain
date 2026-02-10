'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useOrganizationList } from '@clerk/nextjs'
import {
    Phone,
    ArrowRight,
    ArrowLeft,
    Check,
    Copy,
    Loader2,
    AlertTriangle,
    Calendar,
    MessageSquare,
    PhoneForwarded,
    Headphones,
    Sparkles,
    MapPin,
    Building2,
    Zap,
    Flame,
    Droplets,
    Sun,
    Paintbrush,
    TreePine,
    Hammer,
    PlugZap,
    Settings,
} from 'lucide-react'
import confetti from 'canvas-confetti'

// ============================================
// TYPES & CONSTANTS
// ============================================

type OnboardingStep = 'welcome' | 'business' | 'ai-line' | 'live'

interface IndustryOption {
    id: string
    label: string
    icon: React.ElementType
}

const INDUSTRIES: IndustryOption[] = [
    { id: 'ROOFING', label: 'Roofing', icon: Building2 },
    { id: 'HVAC', label: 'HVAC', icon: Flame },
    { id: 'PLUMBING', label: 'Plumbing', icon: Droplets },
    { id: 'ELECTRICAL', label: 'Electrical', icon: PlugZap },
    { id: 'SOLAR', label: 'Solar', icon: Sun },
    { id: 'PAINTING', label: 'Painting', icon: Paintbrush },
    { id: 'LANDSCAPING', label: 'Landscaping', icon: TreePine },
    { id: 'REMODELING', label: 'Remodeling', icon: Hammer },
]

const STEP_ORDER: OnboardingStep[] = ['welcome', 'business', 'ai-line', 'live']

function getStepProgress(step: OnboardingStep): number {
    const index = STEP_ORDER.indexOf(step)
    return ((index) / (STEP_ORDER.length - 1)) * 100
}

// ============================================
// CONFETTI HELPER
// ============================================

function fireConfetti() {
    const count = 200
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function OnboardingPage() {
    const router = useRouter()
    const { user, isLoaded: userLoaded } = useUser()
    const { createOrganization, setActive } = useOrganizationList()

    const [step, setStep] = useState<OnboardingStep>('welcome')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isProvisioning, setIsProvisioning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [animKey, setAnimKey] = useState(0) // trigger re-animation on step change

    // Form state
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [ownerPhone, setOwnerPhone] = useState('')
    const [areaCode, setAreaCode] = useState('')

    // Provisioned data
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

    // Guard: if user already has an org, they've already onboarded → redirect to dashboard
    useEffect(() => {
        if (userLoaded && user) {
            // Check if user already belongs to an organization
            const memberships = user.organizationMemberships
            if (memberships && memberships.length > 0) {
                // Already onboarded — go to dashboard
                router.replace('/dashboard')
                return
            }
        }
    }, [user, userLoaded, router])

    // ============================================
    // NAVIGATION
    // ============================================

    const goToStep = (nextStep: OnboardingStep) => {
        setAnimKey(k => k + 1)
        setError(null)
        setStep(nextStep)
    }

    // ============================================
    // API HANDLERS
    // ============================================

    const handleCreateBusiness = async () => {
        if (!companyName.trim() || !industry) {
            setError('Please fill in your company name and select an industry.')
            return
        }
        if (!createOrganization) {
            setError('Authentication not ready. Please refresh and try again.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // 1. Create Clerk organization
            const org = await createOrganization({ name: companyName.trim() })

            // 2. Set as active
            if (setActive) {
                await setActive({ organization: org.id })
            }

            // 3. Create tenant in Firestore
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clerkOrgId: org.id,
                    companyName: companyName.trim(),
                    niche: industry.toLowerCase(),
                    phone: ownerPhone || undefined,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to create your account.')
            }

            goToStep('ai-line')
        } catch (err) {
            console.error('Business creation failed:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleProvisionNumber = async () => {
        setIsProvisioning(true)
        setError(null)

        try {
            // Update owner phone on tenant if provided
            if (ownerPhone) {
                await fetch('/api/tenants', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ twilioFromPhone: ownerPhone }),
                })
            }

            // Enable inbound + provision number
            const res = await fetch('/api/inbound/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'enable',
                    config: { ownerPhone: ownerPhone || '' },
                    areaCode: areaCode || undefined,
                }),
            })

            const data = await res.json()

            if (data.success && data.phoneNumber) {
                setPhoneNumber(data.phoneNumber)
                goToStep('live')
                // Fire confetti with a slight delay for dramatic effect
                setTimeout(() => fireConfetti(), 400)
            } else {
                setError(data.error || 'Failed to provision your number. Please try again.')
            }
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsProvisioning(false)
        }
    }

    const copyNumber = useCallback(() => {
        if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [phoneNumber])

    // ============================================
    // LOADING STATE
    // ============================================

    if (!userLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2
                    className="h-6 w-6 animate-spin"
                    style={{ color: 'var(--muted-foreground)' }}
                />
            </div>
        )
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            {/* Progress bar */}
            <div className="onboarding-progress">
                <div
                    className="onboarding-progress-fill"
                    style={{ width: `${getStepProgress(step)}%` }}
                />
            </div>

            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                {/* ============================================ */}
                {/* STEP 0: WELCOME GATE */}
                {/* ============================================ */}
                {step === 'welcome' && (
                    <div key={`welcome-${animKey}`} className="onboarding-card fade-in-up text-center">
                        {/* Greeting */}
                        <div style={{ marginBottom: 32 }}>
                            <div
                                className="mx-auto flex items-center justify-center"
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 18,
                                    background: 'var(--muted)',
                                    marginBottom: 24,
                                }}
                            >
                                <Zap
                                    style={{
                                        width: 28,
                                        height: 28,
                                        color: 'var(--foreground)',
                                        strokeWidth: 1.75,
                                    }}
                                />
                            </div>

                            <h1
                                style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.03em',
                                    color: 'var(--foreground)',
                                    lineHeight: 1.2,
                                    marginBottom: 8,
                                }}
                            >
                                Welcome{user?.firstName ? `, ${user.firstName}` : ''}
                            </h1>
                            <p
                                style={{
                                    fontSize: '1rem',
                                    color: 'var(--muted-foreground)',
                                    lineHeight: 1.5,
                                    maxWidth: 360,
                                    margin: '0 auto',
                                }}
                            >
                                Ready to give your business a 24/7 AI receptionist that never misses a call?
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div
                            className="stagger-children"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                marginBottom: 32,
                                textAlign: 'left',
                            }}
                        >
                            {[
                                { icon: Phone, text: 'Get a dedicated AI business line' },
                                { icon: Calendar, text: 'Book appointments automatically' },
                                { icon: MessageSquare, text: 'Take messages when you\'re busy' },
                                { icon: Headphones, text: 'Answer calls 24/7, even at 2AM' },
                            ].map((item) => (
                                <div
                                    key={item.text}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '12px 16px',
                                        background: 'var(--muted)',
                                        borderRadius: 12,
                                    }}
                                >
                                    <item.icon
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: 'var(--foreground)',
                                            strokeWidth: 1.75,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 500,
                                            color: 'var(--foreground)',
                                        }}
                                    >
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button
                                onClick={() => goToStep('business')}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    height: 48,
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    gap: 8,
                                }}
                            >
                                Set Up My AI Line
                                <ArrowRight style={{ width: 16, height: 16 }} />
                            </button>

                            <button
                                onClick={() => router.push('/dashboard')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--muted-foreground)',
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    padding: '8px 0',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                            >
                                Skip for now →
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 1: YOUR BUSINESS */}
                {/* ============================================ */}
                {step === 'business' && (
                    <div key={`business-${animKey}`} className="onboarding-card fade-in-up">
                        {/* Back button */}
                        <button
                            onClick={() => goToStep('welcome')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                fontSize: '0.8125rem',
                                color: 'var(--muted-foreground)',
                                cursor: 'pointer',
                                padding: 0,
                                marginBottom: 24,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                        >
                            <ArrowLeft style={{ width: 14, height: 14 }} />
                            Back
                        </button>

                        <div style={{ marginBottom: 28 }}>
                            <h2
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.025em',
                                    color: 'var(--foreground)',
                                    marginBottom: 6,
                                }}
                            >
                                Tell us about your business
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                This helps your AI assistant speak knowledgeably to your callers.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Company name */}
                            <div>
                                <label
                                    htmlFor="companyName"
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 6,
                                    }}
                                >
                                    Company name
                                </label>
                                <input
                                    id="companyName"
                                    type="text"
                                    placeholder="e.g. Elite Roofing Co"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && companyName && industry && handleCreateBusiness()}
                                    style={{
                                        width: '100%',
                                        height: 48,
                                        padding: '0 16px',
                                        fontSize: '0.9375rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 12,
                                        background: 'var(--card)',
                                        color: 'var(--foreground)',
                                        outline: 'none',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--foreground)'
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,24,27,0.06)'
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Industry */}
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 10,
                                    }}
                                >
                                    What do you do?
                                </label>
                                <div
                                    className="stagger-children"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: 8,
                                    }}
                                >
                                    {INDUSTRIES.map((ind) => (
                                        <button
                                            key={ind.id}
                                            type="button"
                                            className={`industry-chip ${industry === ind.id ? 'selected' : ''}`}
                                            onClick={() => setIndustry(ind.id)}
                                        >
                                            <div className="chip-icon">
                                                <ind.icon style={{ width: 18, height: 18, strokeWidth: 1.75 }} />
                                            </div>
                                            <span className="chip-label">{ind.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Phone number */}
                            <div>
                                <label
                                    htmlFor="ownerPhone"
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 6,
                                    }}
                                >
                                    Your phone number
                                </label>
                                <input
                                    id="ownerPhone"
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    value={ownerPhone}
                                    onChange={(e) => setOwnerPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && companyName && industry && handleCreateBusiness()}
                                    style={{
                                        width: '100%',
                                        height: 48,
                                        padding: '0 16px',
                                        fontSize: '0.9375rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 12,
                                        background: 'var(--card)',
                                        color: 'var(--foreground)',
                                        outline: 'none',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--foreground)'
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,24,27,0.06)'
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 6 }}>
                                    Where the AI transfers urgent calls and sends you summaries.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '12px 14px',
                                        background: '#FEF2F2',
                                        borderRadius: 10,
                                        fontSize: '0.8125rem',
                                        color: '#DC2626',
                                    }}
                                >
                                    <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                    {error}
                                </div>
                            )}

                            {/* Continue */}
                            <button
                                onClick={handleCreateBusiness}
                                disabled={isSubmitting || !companyName.trim() || !industry}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    height: 48,
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    gap: 8,
                                    opacity: (!companyName.trim() || !industry) ? 0.5 : 1,
                                    cursor: (!companyName.trim() || !industry) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                                        Creating your account...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight style={{ width: 16, height: 16 }} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 2: YOUR AI LINE */}
                {/* ============================================ */}
                {step === 'ai-line' && (
                    <div key={`ailine-${animKey}`} className="onboarding-card fade-in-up">
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <div
                                className="mx-auto flex items-center justify-center pulse-ring"
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 18,
                                    background: 'var(--muted)',
                                    marginBottom: 20,
                                }}
                            >
                                <Phone
                                    style={{
                                        width: 28,
                                        height: 28,
                                        color: 'var(--foreground)',
                                        strokeWidth: 1.75,
                                    }}
                                />
                            </div>

                            <h2
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.025em',
                                    color: 'var(--foreground)',
                                    marginBottom: 6,
                                }}
                            >
                                Get your AI business line
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', maxWidth: 380, margin: '0 auto' }}>
                                We&apos;ll create a dedicated phone number for your AI receptionist. This is the number you&apos;ll put on your Google listing, website, and business cards.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Area code */}
                            <div>
                                <label
                                    htmlFor="areaCode"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 6,
                                    }}
                                >
                                    <MapPin style={{ width: 14, height: 14 }} />
                                    Preferred area code
                                    <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    id="areaCode"
                                    type="text"
                                    placeholder="310"
                                    maxLength={3}
                                    value={areaCode}
                                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ''))}
                                    style={{
                                        width: 120,
                                        height: 48,
                                        padding: '0 16px',
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        border: '1px solid var(--border)',
                                        borderRadius: 12,
                                        background: 'var(--card)',
                                        color: 'var(--foreground)',
                                        outline: 'none',
                                        textAlign: 'center',
                                        letterSpacing: '0.1em',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--foreground)'
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,24,27,0.06)'
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                    autoFocus
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 6 }}>
                                    We&apos;ll try to get a local number so callers see a familiar code.
                                </p>
                            </div>

                            {/* What happens */}
                            <div
                                style={{
                                    padding: '16px',
                                    background: 'var(--muted)',
                                    borderRadius: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 10,
                                    }}
                                >
                                    <Sparkles style={{ width: 14, height: 14 }} />
                                    What happens when someone calls
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { icon: Headphones, text: 'AI answers professionally with your business name' },
                                        { icon: Calendar, text: 'Books appointments on your calendar' },
                                        { icon: MessageSquare, text: 'Takes messages and texts you summaries' },
                                        { icon: PhoneForwarded, text: 'Transfers urgent calls directly to you' },
                                    ].map((item) => (
                                        <div
                                            key={item.text}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                fontSize: '0.75rem',
                                                color: 'var(--muted-foreground)',
                                            }}
                                        >
                                            <item.icon style={{ width: 14, height: 14, flexShrink: 0, strokeWidth: 1.75 }} />
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '12px 14px',
                                        background: '#FEF2F2',
                                        borderRadius: 10,
                                        fontSize: '0.8125rem',
                                        color: '#DC2626',
                                    }}
                                >
                                    <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                    {error}
                                </div>
                            )}

                            {/* Activate button */}
                            <button
                                onClick={handleProvisionNumber}
                                disabled={isProvisioning}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    height: 52,
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    gap: 8,
                                }}
                            >
                                {isProvisioning ? (
                                    <>
                                        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                                        Setting up your line...
                                    </>
                                ) : (
                                    <>
                                        <Zap style={{ width: 18, height: 18 }} />
                                        Activate My AI Line
                                    </>
                                )}
                            </button>

                            {/* Skip */}
                            <button
                                onClick={() => router.push('/dashboard')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--muted-foreground)',
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    padding: '4px 0',
                                    textAlign: 'center',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                            >
                                I&apos;ll set this up later →
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 3: YOU'RE LIVE */}
                {/* ============================================ */}
                {step === 'live' && (
                    <div key={`live-${animKey}`} className="onboarding-card fade-in-up text-center">
                        {/* Success icon */}
                        <div style={{ marginBottom: 24 }}>
                            <div
                                className="mx-auto flex items-center justify-center scale-in"
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: 20,
                                    background: '#10b981',
                                    marginBottom: 20,
                                }}
                            >
                                <Check
                                    style={{
                                        width: 32,
                                        height: 32,
                                        color: 'white',
                                        strokeWidth: 2.5,
                                    }}
                                />
                            </div>

                            <h2
                                style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.03em',
                                    color: 'var(--foreground)',
                                    marginBottom: 8,
                                }}
                            >
                                You&apos;re live! 🎉
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', maxWidth: 360, margin: '0 auto' }}>
                                Your AI receptionist is ready to answer calls for <strong style={{ color: 'var(--foreground)' }}>{companyName}</strong>
                            </p>
                        </div>

                        {/* Phone number */}
                        {phoneNumber && (
                            <div
                                style={{
                                    padding: '20px',
                                    background: 'var(--muted)',
                                    borderRadius: 14,
                                    marginBottom: 28,
                                }}
                            >
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: 8, fontWeight: 500 }}>
                                    YOUR AI BUSINESS LINE
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                    <span className="phone-display">{phoneNumber}</span>
                                    <button
                                        onClick={copyNumber}
                                        style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8,
                                            padding: 8,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {copied ? (
                                            <Check style={{ width: 16, height: 16, color: '#10b981' }} />
                                        ) : (
                                            <Copy style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick start tips */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Next steps
                            </p>

                            <div className="quickstart-card" onClick={() => copyNumber()}>
                                <div className="qs-icon">
                                    <MapPin style={{ width: 18, height: 18, color: 'var(--foreground)', strokeWidth: 1.75 }} />
                                </div>
                                <div>
                                    <div className="qs-title">Update your Google listing</div>
                                    <div className="qs-desc">Put this number on your Google Business profile so new leads reach your AI</div>
                                </div>
                            </div>

                            <div className="quickstart-card" onClick={() => router.push('/dashboard/inbound-setup')}>
                                <div className="qs-icon">
                                    <PhoneForwarded style={{ width: 18, height: 18, color: 'var(--foreground)', strokeWidth: 1.75 }} />
                                </div>
                                <div>
                                    <div className="qs-title">Set up call forwarding</div>
                                    <div className="qs-desc">Forward your existing number to your AI line for calls you can&apos;t answer</div>
                                </div>
                            </div>

                            <div className="quickstart-card" onClick={() => router.push('/dashboard/settings')}>
                                <div className="qs-icon">
                                    <Settings style={{ width: 18, height: 18, color: 'var(--foreground)', strokeWidth: 1.75 }} />
                                </div>
                                <div>
                                    <div className="qs-title">Customize your assistant</div>
                                    <div className="qs-desc">Set greetings, services, business hours, and more in Settings</div>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                height: 48,
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                borderRadius: 12,
                                gap: 8,
                            }}
                        >
                            Go to Dashboard
                            <ArrowRight style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
