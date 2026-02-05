'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    Save,
    CheckCircle,
    Users,
    ChevronRight,
    Building2,
    MessageSquare,
    DollarSign,
    AudioLines,
    ClipboardCheck,
    Settings2,
    Hammer,
    Home,
    Leaf,
    Paintbrush,
    Snowflake,
    Sun,
    Droplets,
    Zap,
    LayoutGrid,
} from "lucide-react"

// Section components
import { BusinessIdentitySection } from './components/BusinessIdentitySection'
import { LinguisticMapSection } from './components/LinguisticMapSection'
import { FinancialLogicSection } from './components/FinancialLogicSection'
import { ConversationalSection } from './components/ConversationalSection'
import { QualificationSection } from './components/QualificationSection'
import { IntegrationsSection } from './components/IntegrationsSection'

// Schema imports
import {
    type AtomicConfig,
    type IndustryNiche,
    createDefaultAtomicConfig,
    INDUSTRY_PRESETS,
    INDUSTRY_LABELS,
} from '@/lib/atomic-config'

// Service category visual cards with icons
const SERVICE_CATEGORIES: {
    id: IndustryNiche
    label: string
    icon: React.ElementType
    color: string
}[] = [
        { id: 'ROOFING', label: 'Roofing', icon: Home, color: 'bg-orange-100 text-orange-700' },
        { id: 'HVAC', label: 'HVAC', icon: Snowflake, color: 'bg-blue-100 text-blue-700' },
        { id: 'PLUMBING', label: 'Plumbing', icon: Droplets, color: 'bg-cyan-100 text-cyan-700' },
        { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
        { id: 'DECKING', label: 'Decking', icon: LayoutGrid, color: 'bg-amber-100 text-amber-700' },
        { id: 'PAINTING', label: 'Painting', icon: Paintbrush, color: 'bg-purple-100 text-purple-700' },
        { id: 'LANDSCAPING', label: 'Landscaping', icon: Leaf, color: 'bg-green-100 text-green-700' },
        { id: 'SOLAR', label: 'Solar', icon: Sun, color: 'bg-yellow-100 text-yellow-700' },
        { id: 'KITCHEN_BATH', label: 'Kitchen & Bath', icon: Home, color: 'bg-pink-100 text-pink-700' },
        { id: 'WINDOWS_DOORS', label: 'Windows & Doors', icon: Home, color: 'bg-teal-100 text-teal-700' },
        { id: 'REMODELING', label: 'Remodeling', icon: Hammer, color: 'bg-slate-100 text-slate-700' },
        { id: 'GENERAL', label: 'Other', icon: Building2, color: 'bg-gray-100 text-gray-700' },
    ]

// Simplified tab configuration with horizontal layout
const TABS = [
    { id: 'service', label: 'Service Type', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: MessageSquare },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'ai', label: 'AI Voice', icon: AudioLines },
    { id: 'integrations', label: 'Integrations', icon: Settings2 },
] as const

type TabId = typeof TABS[number]['id']

interface Tenant {
    id: string
    companyName: string
    slug: string
    atomicConfig?: AtomicConfig
    // Legacy fields
    twilioFromPhone?: string
    twilioSid?: string
    retellAgentId?: string
    calendarUrl?: string
    claimTimeoutSec?: number
}

export default function SettingsPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<TabId>('service')

    // Atomic config state
    const [atomicConfig, setAtomicConfig] = useState<AtomicConfig | null>(null)

    // Legacy integrations (kept separate for backwards compat)
    const [legacyIntegrations, setLegacyIntegrations] = useState({
        twilioSid: '',
        twilioFromPhone: '',
        retellAgentId: '',
        calendarUrl: '',
    })

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

                // Initialize atomic config (use existing or create default)
                if (t.atomicConfig) {
                    setAtomicConfig(t.atomicConfig)
                } else {
                    const defaultConfig = createDefaultAtomicConfig(
                        t.id,
                        t.companyName,
                        'GENERAL'
                    )
                    setAtomicConfig(defaultConfig)
                }

                // Initialize legacy fields
                setLegacyIntegrations({
                    twilioSid: t.twilioSid || '',
                    twilioFromPhone: t.twilioFromPhone || '',
                    retellAgentId: t.retellAgentId || '',
                    calendarUrl: t.calendarUrl || '',
                })
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAtomicConfigChange = (updates: Partial<AtomicConfig>) => {
        if (!atomicConfig) return
        setAtomicConfig({
            ...atomicConfig,
            ...updates,
            business_identity: updates.business_identity
                ? { ...atomicConfig.business_identity, ...updates.business_identity }
                : atomicConfig.business_identity,
            linguistic_map: updates.linguistic_map
                ? { ...atomicConfig.linguistic_map, ...updates.linguistic_map }
                : atomicConfig.linguistic_map,
            financial_logic: updates.financial_logic
                ? { ...atomicConfig.financial_logic, ...updates.financial_logic }
                : atomicConfig.financial_logic,
            conversational_parameters: updates.conversational_parameters
                ? { ...atomicConfig.conversational_parameters, ...updates.conversational_parameters }
                : atomicConfig.conversational_parameters,
            qualification_checklist: updates.qualification_checklist
                ? { ...atomicConfig.qualification_checklist, ...updates.qualification_checklist }
                : atomicConfig.qualification_checklist,
            technical_integration: updates.technical_integration
                ? { ...atomicConfig.technical_integration, ...updates.technical_integration }
                : atomicConfig.technical_integration,
        })
    }

    const handleServiceCategoryChange = (niche: IndustryNiche) => {
        if (!atomicConfig) return

        const preset = INDUSTRY_PRESETS[niche]

        setAtomicConfig({
            ...atomicConfig,
            business_identity: {
                ...atomicConfig.business_identity,
                industry_niche: niche,
            },
            linguistic_map: { ...preset },
            qualification_checklist: {
                ...atomicConfig.qualification_checklist,
                ask_insurance_claim: niche === 'ROOFING',
            },
        })
    }

    const handleLegacyChange = (field: string, value: string) => {
        setLegacyIntegrations(prev => ({ ...prev, [field]: value }))
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
                    atomicConfig,
                    ...legacyIntegrations,
                    companyName: atomicConfig.business_identity.brand_name,
                }),
            })

            if (response.ok) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                const error = await response.json()
                console.error('Save failed:', error)
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !atomicConfig) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const currentCategory = SERVICE_CATEGORIES.find(
        c => c.id === atomicConfig.business_identity.industry_niche
    ) || SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1]

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure your AI agent and business profile
                    </p>
                </div>
                <Link
                    href="/dashboard/settings/team"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
                >
                    <Users className="h-4 w-4" />
                    Team
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Horizontal Tabs */}
            <div className="border-b">
                <nav className="flex gap-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-black text-black'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Service Type Tab */}
                {activeTab === 'service' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>What type of service do you provide?</CardTitle>
                            <CardDescription>
                                Select your industry to auto-configure AI language and qualification settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {SERVICE_CATEGORIES.map(category => {
                                    const Icon = category.icon
                                    const isSelected = atomicConfig.business_identity.industry_niche === category.id
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleServiceCategoryChange(category.id)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-black bg-[#FAFAFA] shadow-sm'
                                                    : 'border-transparent bg-muted/50 hover:bg-muted hover:border-[#CCCCCC]'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-medium text-center">{category.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Preview of auto-configured settings */}
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className={currentCategory.color}>
                                        {currentCategory.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">Auto-configured:</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    AI will schedule a <span className="font-medium text-foreground">"{atomicConfig.linguistic_map.visit_title}"</span> with
                                    your <span className="font-medium text-foreground">"{atomicConfig.linguistic_map.specialist_title}"</span> to
                                    <span className="font-medium text-foreground"> {atomicConfig.linguistic_map.primary_action_verb}</span> their
                                    <span className="font-medium text-foreground"> {atomicConfig.linguistic_map.noun_singular}</span>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Branding Tab - Combined Business Identity + Language */}
                {activeTab === 'branding' && (
                    <div className="space-y-6">
                        <BusinessIdentitySection
                            config={atomicConfig}
                            onChange={handleAtomicConfigChange}
                            onIndustryChange={handleServiceCategoryChange}
                        />
                        <LinguisticMapSection
                            config={atomicConfig}
                            onChange={handleAtomicConfigChange}
                        />
                    </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                    <FinancialLogicSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                    />
                )}

                {/* AI Voice Tab - Combined Conversational + Qualification */}
                {activeTab === 'ai' && (
                    <div className="space-y-6">
                        <ConversationalSection
                            config={atomicConfig}
                            onChange={handleAtomicConfigChange}
                        />
                        <QualificationSection
                            config={atomicConfig}
                            onChange={handleAtomicConfigChange}
                        />
                    </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <IntegrationsSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                        legacyIntegrations={legacyIntegrations}
                        onLegacyChange={handleLegacyChange}
                    />
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
