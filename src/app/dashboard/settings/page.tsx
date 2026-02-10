'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure your AI agent in seconds
                    </p>
                </div>
                <Link
                    href="/dashboard/settings/team"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                >
                    <Users className="h-4 w-4" />
                    Team
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Company Name */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5" />
                        Company Name
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        value={companyName}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        placeholder="Terra Decks"
                        className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        How the AI introduces your company on calls
                    </p>
                </CardContent>
            </Card>

            {/* Service Type */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">What service do you provide?</CardTitle>
                    <CardDescription>
                        This automatically configures how the AI talks about your work
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {SERVICE_CATEGORIES.map(category => {
                            const Icon = category.icon
                            const isSelected = serviceType === category.id
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => handleServiceTypeChange(category.id)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-black bg-black/5 shadow-sm'
                                        : 'border-transparent bg-muted/50 hover:bg-muted'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium">{category.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Preview */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        AI Preview
                    </CardTitle>
                    <CardDescription>
                        How your AI agent will talk to leads
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-white rounded-lg p-4 border shadow-sm space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                <Phone className="h-4 w-4 text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    "Hi, is this <span className="font-semibold text-blue-600">[Name]</span>?
                                    Great! This is Alex with <span className="font-semibold text-blue-600">{companyName || '[Company]'}</span>.
                                    I saw you reached out about a <span className="font-semibold text-blue-600">{linguistics.noun_singular}</span> —
                                    just following up to see how I can help."
                                </p>
                                <p className="text-sm">
                                    "The easiest next step is a quick <span className="font-semibold text-blue-600">{linguistics.visit_title}</span> —
                                    our <span className="font-semibold text-blue-600">{linguistics.specialist_title}</span> comes out,
                                    checks things out, and gives you real options with pricing."
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className={currentCategory.color}>
                            {currentCategory.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Auto-configured terminology
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Call Timer */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5" />
                        AI Call Timer
                    </CardTitle>
                    <CardDescription>
                        How long to wait before AI calls a new lead
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold">{callTimerSeconds}s</span>
                        <span className="text-sm text-muted-foreground">
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>30s (instant)</span>
                        <span>300s (5 min)</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                        💡 When a lead comes in, your team has this long to claim it before the AI calls automatically.
                    </p>
                </CardContent>
            </Card>

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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                    <Card className="mt-4">
                        <CardContent className="pt-6 space-y-6">
                            {/* Twilio */}
                            <div className="space-y-2">
                                <Label>Twilio Phone Number</Label>
                                <Input
                                    value={twilioPhone}
                                    onChange={(e) => setTwilioPhone(e.target.value)}
                                    placeholder="+1234567890"
                                />
                                <p className="text-xs text-muted-foreground">
                                    The phone number AI calls from
                                </p>
                            </div>

                            <Separator />

                            {/* Retell */}
                            <div className="space-y-2">
                                <Label>Retell Agent ID</Label>
                                <Input
                                    value={retellAgentId}
                                    onChange={(e) => setRetellAgentId(e.target.value)}
                                    placeholder="agent_xxxxx"
                                />
                            </div>

                            <Separator />

                            {/* Cal.com Integration */}
                            <div className="space-y-2">
                                <Label>Cal.com API Key</Label>
                                <Input
                                    type="password"
                                    value={calcomApiKey}
                                    onChange={(e) => setCalcomApiKey(e.target.value)}
                                    placeholder="cal_live_xxxxx"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get from Cal.com → Settings → Developer
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Cal.com Event Type ID</Label>
                                <Input
                                    type="number"
                                    value={calcomEventTypeId}
                                    onChange={(e) => setCalcomEventTypeId(e.target.value)}
                                    placeholder="1234567"
                                />
                                <p className="text-xs text-muted-foreground">
                                    From cal.com/event-types/[ID]
                                </p>
                            </div>

                            {calcomApiKey && calcomEventTypeId && (
                                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg p-3">
                                    <CheckCircle className="h-4 w-4" />
                                    Calendar connected — AI can book appointments
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white border shadow-lg rounded-full px-6 py-3">
                {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Saved
                    </div>
                )}
                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-full"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
