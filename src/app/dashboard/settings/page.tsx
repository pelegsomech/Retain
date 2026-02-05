'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from '@/lib/atomic-config'

// Tab configuration
const TABS = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'language', label: 'Language', icon: MessageSquare },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'voice', label: 'Voice', icon: AudioLines },
    { id: 'qualification', label: 'Qualification', icon: ClipboardCheck },
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
    const [activeTab, setActiveTab] = useState<TabId>('business')

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
                    // Create default config from tenant data
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
            // Deep merge for nested objects
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

    const handleIndustryChange = (niche: IndustryNiche) => {
        if (!atomicConfig) return

        // Get preset for this industry
        const preset = INDUSTRY_PRESETS[niche]

        // Update both business identity and linguistic map
        setAtomicConfig({
            ...atomicConfig,
            business_identity: {
                ...atomicConfig.business_identity,
                industry_niche: niche,
            },
            linguistic_map: { ...preset },
            qualification_checklist: {
                ...atomicConfig.qualification_checklist,
                // Enable insurance for roofing
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
                    // Also save legacy fields
                    ...legacyIntegrations,
                    // Sync company name
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

    return (
        <div className="flex gap-8 max-w-6xl">
            {/* Sidebar Navigation */}
            <div className="w-48 flex-shrink-0">
                <div className="sticky top-8 space-y-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${activeTab === tab.id
                                        ? 'bg-black text-white'
                                        : 'hover:bg-muted'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}

                    <Separator className="my-4" />

                    {/* Team Members Link */}
                    <Link
                        href="/dashboard/settings/team"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-muted group"
                    >
                        <Users className="h-4 w-4" />
                        Team Members
                        <ChevronRight className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100" />
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">
                            Configure your AI agent and business settings
                        </p>
                    </div>
                    {tenant && (
                        <Badge variant="outline" className="text-sm">
                            Slug: {tenant.slug}
                        </Badge>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === 'business' && (
                    <BusinessIdentitySection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                        onIndustryChange={handleIndustryChange}
                    />
                )}

                {activeTab === 'language' && (
                    <LinguisticMapSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                    />
                )}

                {activeTab === 'pricing' && (
                    <FinancialLogicSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                    />
                )}

                {activeTab === 'voice' && (
                    <ConversationalSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                    />
                )}

                {activeTab === 'qualification' && (
                    <QualificationSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                    />
                )}

                {activeTab === 'integrations' && (
                    <IntegrationsSection
                        config={atomicConfig}
                        onChange={handleAtomicConfigChange}
                        legacyIntegrations={legacyIntegrations}
                        onLegacyChange={handleLegacyChange}
                    />
                )}

                {/* Floating Save Button */}
                <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white border shadow-lg rounded-lg px-4 py-3">
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
                        className="btn-primary"
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
        </div>
    )
}
