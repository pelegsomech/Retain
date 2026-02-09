'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    PhoneIncoming,
    Phone,
    ArrowRight,
    ArrowLeft,
    Check,
    Copy,
    Loader2,
    AlertTriangle,
    Bot,
    Calendar,
    MessageSquare,
    PhoneForwarded,
    Wrench,
    Siren,
    Shield,
    Clock,
    Smartphone,
    CheckCircle2,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Plus,
    X,
    Headphones,
} from "lucide-react"
import type { ServiceMenuItem } from '@/lib/firebase-admin'

// ============================================
// TYPES
// ============================================

interface SetupData {
    ownerPhone: string
    areaCode: string
    companyName: string
    inboundPhoneNumber: string | null
    businessHoursGreeting: string
    afterHoursGreeting: string
    timezone: string
    services: ServiceMenuItem[]
    vipNumbers: { phone: string; label: string }[]
    capabilities: Record<string, boolean>
}

type CarrierKey = 'iphone' | 'android' | 'att' | 'verizon' | 'tmobile' | 'other'

// ============================================
// CARRIER INSTRUCTIONS
// ============================================

const CARRIER_INSTRUCTIONS: Record<CarrierKey, {
    label: string
    icon: string
    steps: string[]
    note?: string
}> = {
    iphone: {
        label: 'iPhone',
        icon: '📱',
        steps: [
            'Open the Settings app on your iPhone',
            'Scroll down and tap Phone',
            'Tap Call Forwarding',
            'Toggle Call Forwarding ON',
            'Tap "Forward To" and enter your AI phone number',
            'Press Back to save — you\'re done!',
        ],
        note: 'This forwards ALL calls. For conditional forwarding (only when busy/unanswered), use your carrier\'s codes below.',
    },
    android: {
        label: 'Android',
        icon: '🤖',
        steps: [
            'Open the Phone app',
            'Tap the ⋮ menu → Settings',
            'Tap Calling accounts → select your SIM',
            'Tap Call Forwarding',
            'Choose "Forward when busy" or "Forward when unanswered"',
            'Enter your AI phone number and tap Enable',
        ],
        note: 'Menu locations may vary by manufacturer. On Samsung, look under Phone → Settings → Supplementary services.',
    },
    att: {
        label: 'AT&T',
        icon: '📞',
        steps: [
            'Open your Phone dialer',
            'Forward when BUSY: Dial *67*[AI NUMBER]# then press Call',
            'Forward when NO ANSWER: Dial *61*[AI NUMBER]# then press Call',
            'Forward when UNREACHABLE: Dial *62*[AI NUMBER]# then press Call',
            'You\'ll hear a confirmation tone for each one',
        ],
        note: 'To disable: Dial ##67#, ##61#, or ##62# respectively. To forward ALL calls: Dial *21*[AI NUMBER]#',
    },
    verizon: {
        label: 'Verizon',
        icon: '📞',
        steps: [
            'Open your Phone dialer',
            'Forward ALL calls: Dial *72 then the AI phone number, press Call',
            'Wait for a confirmation tone or message',
            'For conditional forwarding, dial *71 + AI phone number',
            'Press Call and wait for confirmation',
        ],
        note: 'To disable: Dial *73 and press Call. You may also manage forwarding in the My Verizon app.',
    },
    tmobile: {
        label: 'T-Mobile',
        icon: '📞',
        steps: [
            'Open your Phone dialer',
            'Forward when BUSY: Dial **67*1[AI NUMBER]# then press Call',
            'Forward when NO ANSWER: Dial **61*1[AI NUMBER]# then press Call',
            'Forward when UNREACHABLE: Dial **62*1[AI NUMBER]# then press Call',
            'Wait for confirmation message',
        ],
        note: 'To disable: Dial ##67#, ##61#, or ##62#. Manage in T-Mobile app under Line Settings → Call Forwarding.',
    },
    other: {
        label: 'Other Carrier / Landline',
        icon: '☎️',
        steps: [
            'Contact your phone provider and request "conditional call forwarding"',
            'Ask them to forward calls when BUSY and when NO ANSWER to your AI number',
            'They\'ll set it up for you — it usually takes just a few minutes',
            'For business VoIP systems (RingCentral, Vonage, etc.), find call forwarding in your admin settings',
        ],
        note: 'Most carriers and VoIP platforms support conditional forwarding. Tell them you want calls forwarded to a specific number when you don\'t answer.',
    },
}

const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern (ET)' },
    { value: 'America/Chicago', label: 'Central (CT)' },
    { value: 'America/Denver', label: 'Mountain (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
    { value: 'America/Anchorage', label: 'Alaska (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
]

const TOTAL_STEPS = 5

// ============================================
// MAIN COMPONENT
// ============================================

export default function InboundSetupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isProvisioning, setIsProvisioning] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [selectedCarrier, setSelectedCarrier] = useState<CarrierKey | null>(null)
    const [alreadyEnabled, setAlreadyEnabled] = useState(false)

    const [setupData, setSetupData] = useState<SetupData>({
        ownerPhone: '',
        areaCode: '',
        companyName: '',
        inboundPhoneNumber: null,
        businessHoursGreeting: '',
        afterHoursGreeting: '',
        timezone: 'America/New_York',
        services: [],
        vipNumbers: [],
        capabilities: {
            canBookAppointments: true,
            canAcceptServiceCalls: true,
            canProvideQuotes: true,
            canTransferToOwner: true,
            canTakeMessages: true,
            canHandleEmergencies: true,
        },
    })

    // VIP input state
    const [newVipPhone, setNewVipPhone] = useState('')
    const [newVipLabel, setNewVipLabel] = useState('')

    // Service input state
    const [showAddService, setShowAddService] = useState(false)
    const [newService, setNewService] = useState<Partial<ServiceMenuItem>>({
        bookingType: 'appointment',
        requiresOnSiteVisit: true,
    })

    // ============================================
    // FETCH EXISTING DATA
    // ============================================

    useEffect(() => {
        fetchTenantData()
    }, [])

    const fetchTenantData = async () => {
        try {
            const res = await fetch('/api/tenants')
            if (res.ok) {
                const data = await res.json()
                if (data?.tenant) {
                    const t = data.tenant
                    setSetupData(prev => ({
                        ...prev,
                        ownerPhone: t.twilioFromPhone || t.inboundConfig?.ownerPhone || '',
                        companyName: t.companyName || '',
                        inboundPhoneNumber: t.inboundConfig?.inboundPhoneNumber || null,
                        businessHoursGreeting: t.inboundConfig?.businessHoursGreeting || '',
                        afterHoursGreeting: t.inboundConfig?.afterHoursGreeting || '',
                        timezone: t.inboundConfig?.timezone || 'America/New_York',
                        services: t.inboundConfig?.serviceMenu || [],
                        vipNumbers: t.inboundConfig?.vipNumbers || [],
                    }))

                    // If already enabled, skip to step 3 (call forwarding)
                    if (t.inboundEnabled && t.inboundConfig?.inboundPhoneNumber) {
                        setAlreadyEnabled(true)
                        setStep(3)
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch tenant:', e)
        } finally {
            setIsLoading(false)
        }
    }

    // ============================================
    // HANDLERS
    // ============================================

    const handleProvision = async () => {
        if (!setupData.ownerPhone) {
            setError('Please enter your phone number')
            return
        }
        setIsProvisioning(true)
        setError(null)
        try {
            const res = await fetch('/api/inbound/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'enable',
                    config: { ownerPhone: setupData.ownerPhone },
                    areaCode: setupData.areaCode || undefined,
                }),
            })
            const data = await res.json()
            if (data.success && data.phoneNumber) {
                setSetupData(prev => ({ ...prev, inboundPhoneNumber: data.phoneNumber }))
                setStep(3)
            } else {
                setError(data.error || 'Failed to provision. Please try again.')
            }
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsProvisioning(false)
        }
    }

    const handleTestCall = async () => {
        setIsTesting(true)
        setTestResult(null)
        // Simulate a brief wait — in production you'd call a test endpoint
        await new Promise(r => setTimeout(r, 3000))
        setTestResult('success')
        setIsTesting(false)
    }

    const handleSaveConfig = async () => {
        try {
            await fetch('/api/inbound/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    config: {
                        businessHoursGreeting: setupData.businessHoursGreeting,
                        afterHoursGreeting: setupData.afterHoursGreeting,
                        timezone: setupData.timezone,
                        serviceMenu: setupData.services,
                        vipNumbers: setupData.vipNumbers,
                        capabilities: setupData.capabilities,
                    },
                }),
            })
        } catch (e) {
            console.error('Failed to save config:', e)
        }
    }

    const handleComplete = async () => {
        await handleSaveConfig()
        router.push('/dashboard/settings')
    }

    const copyNumber = useCallback(() => {
        if (setupData.inboundPhoneNumber) {
            navigator.clipboard.writeText(setupData.inboundPhoneNumber)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [setupData.inboundPhoneNumber])

    const addVipNumber = () => {
        if (!newVipPhone) return
        setSetupData(prev => ({
            ...prev,
            vipNumbers: [...prev.vipNumbers, { phone: newVipPhone, label: newVipLabel || 'VIP' }],
        }))
        setNewVipPhone('')
        setNewVipLabel('')
    }

    const removeVipNumber = (i: number) => {
        setSetupData(prev => ({
            ...prev,
            vipNumbers: prev.vipNumbers.filter((_, idx) => idx !== i),
        }))
    }

    const addServiceItem = () => {
        if (!newService.name) return
        const item: ServiceMenuItem = {
            id: `svc_${Date.now()}`,
            name: newService.name || '',
            description: newService.description || '',
            estimatedDuration: newService.estimatedDuration || '',
            priceRange: newService.priceRange,
            requiresOnSiteVisit: newService.requiresOnSiteVisit ?? true,
            bookingType: newService.bookingType || 'appointment',
        }
        setSetupData(prev => ({
            ...prev,
            services: [...prev.services, item],
        }))
        setNewService({ bookingType: 'appointment', requiresOnSiteVisit: true })
        setShowAddService(false)
    }

    const removeServiceItem = (i: number) => {
        setSetupData(prev => ({
            ...prev,
            services: prev.services.filter((_, idx) => idx !== i),
        }))
    }

    const goNext = () => {
        if (step === 4) handleSaveConfig()
        setStep(s => Math.min(s + 1, TOTAL_STEPS))
    }
    const goBack = () => setStep(s => Math.max(s - 1, 1))

    // ============================================
    // LOADING
    // ============================================

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
        )
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="max-w-2xl mx-auto py-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div
                    className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}
                >
                    <PhoneIncoming className="h-8 w-8 text-white" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                    AI Phone Assistant Setup
                </h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: 4 }}>
                    Get your AI receptionist answering calls in minutes
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                        const s = i + 1
                        const isActive = s === step
                        const isComplete = s < step
                        const labels = ['Your Info', 'Get Number', 'Forward Calls', 'Customize', 'Go Live']
                        return (
                            <div key={s} className="flex flex-col items-center" style={{ flex: 1 }}>
                                <div
                                    className="flex items-center justify-center rounded-full transition-all"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        background: isComplete
                                            ? '#10b981'
                                            : isActive
                                                ? '#6366f1'
                                                : 'var(--muted)',
                                        color: isComplete || isActive ? 'white' : 'var(--muted-foreground)',
                                        fontWeight: 600,
                                        fontSize: '0.8125rem',
                                    }}
                                >
                                    {isComplete ? <Check className="h-4 w-4" /> : s}
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                                        marginTop: 4,
                                    }}
                                >
                                    {labels[i]}
                                </span>
                            </div>
                        )
                    })}
                </div>
                <div className="h-1 rounded-full" style={{ background: 'var(--muted)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        }}
                    />
                </div>
            </div>

            {/* ============================================ */}
            {/* STEP 1: YOUR INFO */}
            {/* ============================================ */}
            {step === 1 && (
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Let's get you set up</CardTitle>
                        <CardDescription>
                            We'll create a dedicated phone number for your AI assistant.
                            When customers call and you don't pick up, the AI handles it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="ownerPhone">Your phone number *</Label>
                            <Input
                                id="ownerPhone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={setupData.ownerPhone}
                                onChange={(e) => setSetupData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                This is where VIP calls and transfers get sent. It's also where you'll receive SMS summaries.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="areaCode">Preferred area code (optional)</Label>
                            <Input
                                id="areaCode"
                                placeholder="310"
                                value={setupData.areaCode}
                                onChange={(e) => setSetupData(prev => ({ ...prev, areaCode: e.target.value }))}
                                maxLength={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                We'll get a local number in your area so callers see a familiar area code.
                            </p>
                        </div>

                        {/* What the AI does */}
                        <div
                            className="rounded-xl p-4 space-y-3"
                            style={{ background: '#6366f108', border: '1px solid #6366f115' }}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Sparkles className="h-4 w-4" style={{ color: '#6366f1' }} />
                                What your AI receptionist can do
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: Calendar, label: 'Book appointments' },
                                    { icon: MessageSquare, label: 'Take messages' },
                                    { icon: PhoneForwarded, label: 'Transfer calls to you' },
                                    { icon: Wrench, label: 'Handle service requests' },
                                    { icon: Siren, label: 'Detect emergencies' },
                                    { icon: Headphones, label: 'Answer 24/7' },
                                ].map(feat => (
                                    <div key={feat.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <feat.icon className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
                                        {feat.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ============================================ */}
            {/* STEP 2: PROVISION NUMBER */}
            {/* ============================================ */}
            {step === 2 && (
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Get your AI phone number</CardTitle>
                        <CardDescription>
                            We'll provision a dedicated phone number for your AI assistant.
                            This takes about 10 seconds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {setupData.inboundPhoneNumber ? (
                            <>
                                {/* Already provisioned */}
                                <div
                                    className="text-center p-6 rounded-xl"
                                    style={{ background: '#10b98108', border: '1px solid #10b98120' }}
                                >
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={{ color: '#10b981' }} />
                                    <p className="text-sm text-muted-foreground mb-2">Your AI phone number is</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                            {setupData.inboundPhoneNumber}
                                        </span>
                                        <button
                                            onClick={copyNumber}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            {copied ? <Check className="h-5 w-5" style={{ color: '#10b981' }} /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Provision CTA */}
                                <div className="text-center p-6 rounded-xl" style={{ background: 'var(--muted)' }}>
                                    <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" style={{ opacity: 0.5 }} />
                                    <p className="text-sm text-muted-foreground mb-4">
                                        We'll set up your number
                                        {setupData.areaCode && ` with area code (${setupData.areaCode})`}
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={handleProvision}
                                        disabled={isProvisioning}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            border: 'none',
                                        }}
                                    >
                                        {isProvisioning ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Setting up your line...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Activate AI Phone Number
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </>
                        )}

                        <div className="text-xs text-muted-foreground text-center">
                            Your number will be ready instantly. You can change it later in Settings.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ============================================ */}
            {/* STEP 3: CALL FORWARDING */}
            {/* ============================================ */}
            {step === 3 && (
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Set up call forwarding</CardTitle>
                        <CardDescription>
                            Forward calls from your business phone to your AI number.
                            Choose your phone type or carrier below for step-by-step instructions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* AI Number reminder */}
                        {setupData.inboundPhoneNumber && (
                            <div
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ background: '#6366f108', border: '1px solid #6366f115' }}
                            >
                                <div>
                                    <p className="text-xs text-muted-foreground">Forward to this number:</p>
                                    <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.125rem' }}>
                                        {setupData.inboundPhoneNumber}
                                    </p>
                                </div>
                                <button
                                    onClick={copyNumber}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    {copied ? <Check className="h-4 w-4" style={{ color: '#10b981' }} /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                </button>
                            </div>
                        )}

                        {/* Carrier selector */}
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.entries(CARRIER_INSTRUCTIONS) as [CarrierKey, typeof CARRIER_INSTRUCTIONS[CarrierKey]][]).map(([key, carrier]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCarrier(selectedCarrier === key ? null : key)}
                                    className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                                    style={{
                                        background: selectedCarrier === key ? '#6366f110' : 'var(--muted)',
                                        border: `2px solid ${selectedCarrier === key ? '#6366f1' : 'transparent'}`,
                                        color: selectedCarrier === key ? '#6366f1' : 'var(--foreground)',
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>{carrier.icon}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: selectedCarrier === key ? 600 : 400 }}>
                                        {carrier.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Instructions */}
                        {selectedCarrier && (
                            <div
                                className="rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2"
                                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                            >
                                <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                    {CARRIER_INSTRUCTIONS[selectedCarrier].icon} {CARRIER_INSTRUCTIONS[selectedCarrier].label} Instructions
                                </h4>
                                <ol className="space-y-2">
                                    {CARRIER_INSTRUCTIONS[selectedCarrier].steps.map((instruction, i) => {
                                        // Replace [AI NUMBER] with actual number
                                        const text = setupData.inboundPhoneNumber
                                            ? instruction.replace(/\[AI NUMBER\]/g, setupData.inboundPhoneNumber)
                                            : instruction
                                        return (
                                            <li
                                                key={i}
                                                className="flex gap-3"
                                                style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}
                                            >
                                                <span
                                                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                                                    style={{
                                                        width: 22,
                                                        height: 22,
                                                        background: '#6366f115',
                                                        color: '#6366f1',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <span>{text}</span>
                                            </li>
                                        )
                                    })}
                                </ol>
                                {CARRIER_INSTRUCTIONS[selectedCarrier].note && (
                                    <div
                                        className="text-xs p-3 rounded-lg"
                                        style={{ background: '#f59e0b08', border: '1px solid #f59e0b15', color: '#92400e' }}
                                    >
                                        💡 {CARRIER_INSTRUCTIONS[selectedCarrier].note}
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            className="text-center p-3 rounded-lg text-xs text-muted-foreground"
                            style={{ background: 'var(--muted)' }}
                        >
                            <strong>Recommended:</strong> Use conditional forwarding (busy/no-answer) so the AI only picks up when you can't.
                            You'll still ring first and can answer normally.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ============================================ */}
            {/* STEP 4: CUSTOMIZE */}
            {/* ============================================ */}
            {step === 4 && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl text-center">Customize your assistant</CardTitle>
                            <CardDescription className="text-center">
                                Set up greetings, services, and preferences. You can always change these later.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Greetings */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Bot className="h-3.5 w-3.5 text-purple-600" />
                                </div>
                                Greetings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs">Business hours greeting</Label>
                                <Input
                                    value={setupData.businessHoursGreeting}
                                    onChange={(e) => setSetupData(prev => ({ ...prev, businessHoursGreeting: e.target.value }))}
                                    placeholder={`Thank you for calling ${setupData.companyName || 'our office'}! How can I help you today?`}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">After hours greeting</Label>
                                <Input
                                    value={setupData.afterHoursGreeting}
                                    onChange={(e) => setSetupData(prev => ({ ...prev, afterHoursGreeting: e.target.value }))}
                                    placeholder="We're currently closed, but I can take a message or schedule an appointment."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Timezone</Label>
                                <select
                                    value={setupData.timezone}
                                    onChange={(e) => setSetupData(prev => ({ ...prev, timezone: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    {TIMEZONES.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* VIP Numbers */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                VIP Numbers
                                <span className="text-xs text-muted-foreground font-normal ml-auto">(optional)</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                These callers skip the AI and go straight to you
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {setupData.vipNumbers.map((vip, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                    <div>
                                        <span className="text-sm font-medium">{vip.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{vip.phone}</span>
                                    </div>
                                    <button onClick={() => removeVipNumber(i)} className="text-muted-foreground hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Label (e.g. Wife)"
                                    value={newVipLabel}
                                    onChange={(e) => setNewVipLabel(e.target.value)}
                                    className="w-1/3"
                                />
                                <Input
                                    placeholder="+1 (555) 123-4567"
                                    value={newVipPhone}
                                    onChange={(e) => setNewVipPhone(e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="outline" size="icon" onClick={addVipNumber} disabled={!newVipPhone}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Wrench className="h-3.5 w-3.5 text-orange-600" />
                                </div>
                                Services
                                <span className="text-xs text-muted-foreground font-normal ml-auto">(optional)</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Services the AI can discuss and schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {setupData.services.map((svc, i) => (
                                <div key={svc.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                    <div>
                                        <span className="text-sm font-medium">{svc.name}</span>
                                        {svc.priceRange && <span className="text-xs text-muted-foreground ml-2">{svc.priceRange}</span>}
                                    </div>
                                    <button onClick={() => removeServiceItem(i)} className="text-muted-foreground hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {showAddService ? (
                                <div className="space-y-2 border rounded-lg p-3 bg-white">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Service name *</Label>
                                            <Input
                                                placeholder="e.g. Roof Repair"
                                                value={newService.name || ''}
                                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Price range</Label>
                                            <Input
                                                placeholder="$200 - $500"
                                                value={newService.priceRange || ''}
                                                onChange={(e) => setNewService({ ...newService, priceRange: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={addServiceItem} disabled={!newService.name}>
                                            <Plus className="mr-1 h-3 w-3" /> Add
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setShowAddService(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" className="w-full" onClick={() => setShowAddService(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Service
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ============================================ */}
            {/* STEP 5: GO LIVE */}
            {/* ============================================ */}
            {step === 5 && (
                <Card>
                    <CardHeader className="text-center">
                        <div
                            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3"
                            style={{ background: '#10b98115' }}
                        >
                            <CheckCircle2 className="h-8 w-8" style={{ color: '#10b981' }} />
                        </div>
                        <CardTitle className="text-xl">You're all set!</CardTitle>
                        <CardDescription>
                            Your AI phone assistant is ready to take calls. Here's a quick test to make sure everything works.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Test section */}
                        <div
                            className="p-5 rounded-xl text-center space-y-4"
                            style={{ background: 'var(--muted)' }}
                        >
                            <Smartphone className="h-10 w-10 mx-auto text-muted-foreground" style={{ opacity: 0.5 }} />
                            <div>
                                <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                                    Test your setup
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Call your business phone from another phone and let it ring.
                                    It should forward to your AI after a few rings.
                                </p>
                            </div>

                            {setupData.inboundPhoneNumber && (
                                <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 border">
                                    <span className="text-xs text-muted-foreground">AI Number:</span>
                                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                        {setupData.inboundPhoneNumber}
                                    </span>
                                    <button onClick={copyNumber}>
                                        {copied ? <Check className="h-3.5 w-3.5" style={{ color: '#10b981' }} /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Or call the AI number directly to hear your assistant in action.
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Your setup summary</h4>
                            <div className="space-y-1.5">
                                {[
                                    { label: 'AI Phone Number', value: setupData.inboundPhoneNumber || 'Pending', icon: Phone },
                                    { label: 'Transfers go to', value: setupData.ownerPhone, icon: PhoneForwarded },
                                    { label: 'Business hours greeting', value: setupData.businessHoursGreeting || 'Default', icon: Bot },
                                    { label: 'VIP numbers', value: `${setupData.vipNumbers.length} configured`, icon: Shield },
                                    { label: 'Services', value: `${setupData.services.length} configured`, icon: Wrench },
                                ].map(row => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                                        style={{ background: 'var(--muted)', fontSize: '0.8125rem' }}
                                    >
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <row.icon className="h-3.5 w-3.5" />
                                            {row.label}
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className="text-center p-3 rounded-lg text-xs"
                            style={{ background: '#10b98108', border: '1px solid #10b98115', color: '#065f46' }}
                        >
                            ✅ You can review and change all settings anytime from the <strong>Settings</strong> page.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ============================================ */}
            {/* NAVIGATION */}
            {/* ============================================ */}
            <div className="flex items-center justify-between mt-6">
                {step > 1 ? (
                    <Button variant="outline" onClick={goBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                ) : (
                    <div />
                )}

                {step < TOTAL_STEPS ? (
                    step === 2 && !setupData.inboundPhoneNumber ? (
                        // On step 2 without a number, the CTA is inside the card
                        <div />
                    ) : (
                        <Button onClick={goNext}>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )
                ) : (
                    <Button
                        onClick={handleComplete}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                        }}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Complete Setup
                    </Button>
                )}
            </div>
        </div>
    )
}
