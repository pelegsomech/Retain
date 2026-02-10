'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Slider } from "@/components/ui/slider"
import {
    Loader2,
    Save,
    CheckCircle,
    Users,
    ChevronRight,
    ChevronDown,
    Building2,
    Home,
    Leaf,
    Paintbrush,
    Snowflake,
    Sun,
    Droplets,
    Zap,
    LayoutGrid,
    Hammer,
    Phone,
    Clock,
    MessageSquare,
    Settings2,
    Sparkles,
} from "lucide-react"

import {
    type AtomicConfig,
    type IndustryNiche,
    createDefaultAtomicConfig,
    INDUSTRY_PRESETS,
} from '@/lib/atomic-config'

import type { InboundConfig } from '@/lib/firebase-admin'
import { InboundAssistantSection } from './components/InboundAssistantSection'
import { createDefaultInboundConfig } from '@/lib/inbound-router'

// Service categories with icons and colors
const SERVICE_CATEGORIES: {
    id: IndustryNiche
    label: string
    icon: React.ElementType
    color: string
    description: string
}[] = [
        { id: 'HVAC', label: 'HVAC', icon: Snowflake, color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'Heating & cooling' },
        { id: 'ROOFING', label: 'Roofing', icon: Home, color: 'bg-orange-100 text-orange-700 border-orange-200', description: 'Roof repair & install' },
        { id: 'PLUMBING', label: 'Plumbing', icon: Droplets, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', description: 'Pipes & fixtures' },
        { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: 'Wiring & panels' },
        { id: 'DECKING', label: 'Decking', icon: LayoutGrid, color: 'bg-amber-100 text-amber-700 border-amber-200', description: 'Decks & patios' },
        { id: 'PAINTING', label: 'Painting', icon: Paintbrush, color: 'bg-purple-100 text-purple-700 border-purple-200', description: 'Interior & exterior' },
        { id: 'LANDSCAPING', label: 'Landscaping', icon: Leaf, color: 'bg-green-100 text-green-700 border-green-200', description: 'Yards & gardens' },
        { id: 'SOLAR', label: 'Solar', icon: Sun, color: 'bg-amber-100 text-amber-700 border-amber-200', description: 'Solar installation' },
        { id: 'REMODELING', label: 'Remodeling', icon: Hammer, color: 'bg-slate-100 text-slate-700 border-slate-200', description: 'Home renovation' },
        { id: 'GENERAL', label: 'Other', icon: Building2, color: 'bg-gray-100 text-gray-700 border-gray-200', description: 'General services' },
    ]

interface Tenant {
    id: string
    companyName: string
    slug: string
    atomicConfig?: AtomicConfig
    claimTimeoutSec?: number
    twilioFromPhone?: string
    twilioSid?: string
    retellAgentId?: string
    calendarUrl?: string
    calcomApiKey?: string
    calcomEventTypeId?: number
    inboundEnabled?: boolean
    inboundConfig?: InboundConfig
}

export default function SettingsPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Core settings
    const [companyName, setCompanyName] = useState('')
    const [serviceType, setServiceType] = useState<IndustryNiche>('GENERAL')
    const [callTimerSeconds, setCallTimerSeconds] = useState(60)

    // Integration settings (advanced)
    const [twilioPhone, setTwilioPhone] = useState('')
    const [retellAgentId, setRetellAgentId] = useState('')
    const [calendarUrl, setCalendarUrl] = useState('')
    const [calcomApiKey, setCalcomApiKey] = useState('')
    const [calcomEventTypeId, setCalcomEventTypeId] = useState('')

    // Atomic config (auto-generated from service type)
    const [atomicConfig, setAtomicConfig] = useState<AtomicConfig | null>(null)

    // Inbound AI Phone Assistant
    const [inboundEnabled, setInboundEnabled] = useState(false)
    const [inboundConfig, setInboundConfig] = useState<InboundConfig | null>(null)

    useEffect(() => {
        fetchTenant()
    }, [])

    const fetchTenant = async () => {
        try {
            const response = await fetch('/api/tenants')
            if (response.ok) {
                const data = await response.json()
                const t = data.tenant as Tenant
                setTenant(t)

                // Initialize from tenant
                setCompanyName(t.companyName || '')
                setCallTimerSeconds(t.claimTimeoutSec || 60)
                setTwilioPhone(t.twilioFromPhone || '')
                setRetellAgentId(t.retellAgentId || '')
                setCalendarUrl(t.calendarUrl || '')
                setCalcomApiKey(t.calcomApiKey || '')
                setCalcomEventTypeId(t.calcomEventTypeId ? String(t.calcomEventTypeId) : '')

                // Initialize atomic config
                if (t.atomicConfig) {
                    setAtomicConfig(t.atomicConfig)
                    setServiceType(t.atomicConfig.business_identity.industry_niche)
                } else {
                    const defaultConfig = createDefaultAtomicConfig(t.id, t.companyName, 'GENERAL')
                    setAtomicConfig(defaultConfig)
                }

                // Initialize inbound config
                const hasInboundNumber = !!t.inboundConfig?.inboundPhoneNumber
                setInboundEnabled(t.inboundEnabled || hasInboundNumber || false)
                setInboundConfig(
                    t.inboundConfig || createDefaultInboundConfig(
                        t.twilioFromPhone || '',
                        t.companyName,
                    )
                )
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleServiceTypeChange = (niche: IndustryNiche) => {
        setServiceType(niche)

        // Auto-update atomic config with preset
        const preset = INDUSTRY_PRESETS[niche]
        if (atomicConfig) {
            setAtomicConfig({
                ...atomicConfig,
                business_identity: {
                    ...atomicConfig.business_identity,
                    industry_niche: niche,
                    brand_name: companyName,
                },
                linguistic_map: { ...preset },
                qualification_checklist: {
                    ...atomicConfig.qualification_checklist,
                    ask_insurance_claim: niche === 'ROOFING',
                },
            })
        }
    }

    const handleCompanyNameChange = (name: string) => {
        setCompanyName(name)
        if (atomicConfig) {
            setAtomicConfig({
                ...atomicConfig,
                business_identity: {
                    ...atomicConfig.business_identity,
                    brand_name: name,
                },
            })
        }
    }

    const handleSave = async () => {
        if (!atomicConfig) return

        setIsSaving(true)
        setSaveSuccess(false)

        try {
            const response = await fetch('/api/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    claimTimeoutSec: callTimerSeconds,
                    twilioFromPhone: twilioPhone,
                    retellAgentId,
                    calendarUrl,
                    calcomApiKey: calcomApiKey || undefined,
                    calcomEventTypeId: calcomEventTypeId ? parseInt(calcomEventTypeId) : undefined,
                    atomicConfig,
                }),
            })

            if (response.ok) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                console.error('Save failed:', await response.json())
            }
        } catch (error) {
            console.error('Failed to save:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Inbound config handlers
    const handleInboundEnable = useCallback(async (ownerPhone: string, areaCode?: string) => {
        const response = await fetch('/api/inbound/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'enable',
                config: { ownerPhone },
                areaCode,
            }),
        })
        const data = await response.json()
        if (data.success) {
            setInboundEnabled(true)
            // Refresh tenant to get updated config
            fetchTenant()
        }
        return data
    }, [])

    const handleInboundDisable = useCallback(async () => {
        await fetch('/api/inbound/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disable' }),
        })
        setInboundEnabled(false)
        if (inboundConfig) {
            setInboundConfig({ ...inboundConfig, enabled: false })
        }
    }, [inboundConfig])

    const handleInboundUpdate = useCallback(async (updates: Partial<InboundConfig>) => {
        const updated = { ...inboundConfig, ...updates } as InboundConfig
        setInboundConfig(updated)

        await fetch('/api/inbound/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                config: updates,
            }),
        })
    }, [inboundConfig])

    if (isLoading || !atomicConfig) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const currentCategory = SERVICE_CATEGORIES.find(c => c.id === serviceType) || SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1]
    const linguistics = atomicConfig.linguistic_map

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
            {/* Header */}
            <div className="settings-header">
                <div>
                    <h1 className="settings-header-title">Settings</h1>
                    <p className="settings-header-subtitle">
                        Configure your AI assistant in seconds
                    </p>
                </div>
                <Link
                    href="/dashboard/settings/team"
                    className="settings-chip flex items-center gap-2"
                >
                    <Users className="h-4 w-4" />
                    Team
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Company Name */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">Company Name</h3>
                        <p className="settings-desc">How the AI introduces your company on calls</p>
                    </div>
                </div>
                <div className="mt-4">
                    <input
                        value={companyName}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        placeholder="Terra Decks"
                        className="settings-input w-full text-lg"
                    />
                </div>
            </div>

            {/* Service Type */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">What service do you provide?</h3>
                        <p className="settings-desc">This automatically configures how the AI talks about your work</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                    {SERVICE_CATEGORIES.map(category => {
                        const Icon = category.icon
                        const isSelected = serviceType === category.id
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleServiceTypeChange(category.id)}
                                className={`settings-card-chip flex flex-col items-center gap-2 ${isSelected ? 'active' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#18181B] text-white' : 'bg-[#F7F6F3] text-[#C4A265]'}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium">{category.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* AI Preview */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle accent">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">AI Preview</h3>
                        <p className="settings-desc">How your AI agent will talk to leads</p>
                    </div>
                </div>
                <div className="settings-preview mt-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                &quot;Hi, is this <span className="highlight">[Name]</span>?
                                Great! This is Alex with <span className="highlight">{companyName || '[Company]'}</span>.
                                I saw you reached out about a <span className="highlight">{linguistics.noun_singular}</span> —
                                just following up to see how I can help.&quot;
                            </p>
                            <p className="text-sm">
                                &quot;The easiest next step is a quick <span className="highlight">{linguistics.visit_title}</span> —
                                our <span className="highlight">{linguistics.specialist_title}</span> comes out,
                                checks things out, and gives you real options with pricing.&quot;
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <span className="settings-badge">{currentCategory.label}</span>
                    <span className="text-xs text-[#8C8780]">
                        Auto-configured terminology
                    </span>
                </div>
            </div>

            {/* Call Timer */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">AI Call Timer</h3>
                        <p className="settings-desc">How long to wait before AI calls a new lead</p>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-[#18181B]">{callTimerSeconds}s</span>
                        <span className="settings-badge">
                            {callTimerSeconds < 60 ? 'Quick response' : callTimerSeconds < 120 ? 'Standard' : 'Delayed'}
                        </span>
                    </div>
                    <Slider
                        value={[callTimerSeconds]}
                        onValueChange={(v: number[]) => setCallTimerSeconds(v[0])}
                        min={30}
                        max={300}
                        step={15}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[#8C8780]">
                        <span>30s (instant)</span>
                        <span>300s (5 min)</span>
                    </div>
                    <div className="settings-tip">
                        💡 When a lead comes in, your team has this long to claim it before the AI calls automatically.
                    </div>
                </div>
            </div>

            {/* AI Phone Assistant (Inbound) */}
            {inboundConfig && (
                <InboundAssistantSection
                    config={inboundConfig}
                    isEnabled={inboundEnabled}
                    onEnable={handleInboundEnable}
                    onDisable={handleInboundDisable}
                    onUpdate={handleInboundUpdate}
                />
            )}

            {/* Advanced Settings Toggle */}
            <div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="settings-chip flex items-center gap-2"
                >
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                    <div className="settings-card p-6 mt-4 space-y-6">
                        {/* Twilio */}
                        <div className="space-y-2">
                            <label className="settings-label">Twilio Phone Number</label>
                            <input
                                value={twilioPhone}
                                onChange={(e) => setTwilioPhone(e.target.value)}
                                placeholder="+1234567890"
                                className="settings-input w-full"
                            />
                            <p className="settings-hint">
                                The phone number AI calls from
                            </p>
                        </div>

                        <hr className="settings-divider" />

                        {/* Retell */}
                        <div className="space-y-2">
                            <label className="settings-label">Retell Agent ID</label>
                            <input
                                value={retellAgentId}
                                onChange={(e) => setRetellAgentId(e.target.value)}
                                placeholder="agent_xxxxx"
                                className="settings-input w-full"
                            />
                        </div>

                        <hr className="settings-divider" />

                        {/* Cal.com Integration */}
                        <div className="space-y-2">
                            <label className="settings-label">Cal.com API Key</label>
                            <input
                                type="password"
                                value={calcomApiKey}
                                onChange={(e) => setCalcomApiKey(e.target.value)}
                                placeholder="cal_live_xxxxx"
                                className="settings-input w-full"
                            />
                            <p className="settings-hint">
                                Get from Cal.com → Settings → Developer
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="settings-label">Cal.com Event Type ID</label>
                            <input
                                type="number"
                                value={calcomEventTypeId}
                                onChange={(e) => setCalcomEventTypeId(e.target.value)}
                                placeholder="1234567"
                                className="settings-input w-full"
                            />
                            <p className="settings-hint">
                                From cal.com/event-types/[ID]
                            </p>
                        </div>

                        {calcomApiKey && calcomEventTypeId && (
                            <div className="settings-success flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Calendar connected — AI can book appointments
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <button
                className="settings-save-btn"
                onClick={handleSave}
                disabled={isSaving}
            >
                {saveSuccess && (
                    <span className="save-success">
                        <CheckCircle className="h-4 w-4" />
                        Saved
                    </span>
                )}
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Save Changes
                    </>
                )}
            </button>
        </div>
    )
}
