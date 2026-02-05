'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import {
    type AtomicConfig,
    type IndustryNiche,
    type AgentPersona,
    INDUSTRY_NICHES,
    AGENT_PERSONAS,
    INDUSTRY_LABELS,
    PERSONA_LABELS,
    INDUSTRY_PRESETS,
} from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
    onIndustryChange: (niche: IndustryNiche) => void
}

/**
 * Business Identity Section
 * Configures: brand name, industry, agent persona, primary service, service area
 */
export function BusinessIdentitySection({ config, onChange, onIndustryChange }: Props) {
    const bi = config.business_identity

    const updateField = <K extends keyof typeof bi>(key: K, value: typeof bi[K]) => {
        onChange({
            business_identity: {
                ...bi,
                [key]: value,
            },
        })
    }

    const handleIndustryChange = (niche: IndustryNiche) => {
        // Update industry and trigger preset application
        onIndustryChange(niche)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Identity
                </CardTitle>
                <CardDescription>
                    Define your company and how the AI represents you
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Brand Name & Industry */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="brand_name">Brand Name</Label>
                        <Input
                            id="brand_name"
                            value={bi.brand_name}
                            onChange={(e) => updateField('brand_name', e.target.value)}
                            placeholder="Terra Decking"
                        />
                        <p className="text-xs text-muted-foreground">
                            How the AI introduces your company
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="industry_niche">Industry</Label>
                        <select
                            id="industry_niche"
                            value={bi.industry_niche}
                            onChange={(e) => handleIndustryChange(e.target.value as IndustryNiche)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            {INDUSTRY_NICHES.map(niche => (
                                <option key={niche} value={niche}>
                                    {INDUSTRY_LABELS[niche]}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Auto-fills language settings based on industry
                        </p>
                    </div>
                </div>

                {/* Agent Persona */}
                <div className="space-y-3">
                    <Label>Agent Persona</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {AGENT_PERSONAS.map(persona => {
                            const { label, desc } = PERSONA_LABELS[persona]
                            return (
                                <button
                                    key={persona}
                                    type="button"
                                    onClick={() => updateField('agent_persona', persona)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${bi.agent_persona === persona
                                            ? 'border-black bg-[#FAFAFA]'
                                            : 'border-[#EEEEEE] hover:border-[#CCCCCC]'
                                        }`}
                                >
                                    <div className="font-medium">{label}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Primary Service & Service Area */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="primary_service">Primary Service</Label>
                        <Input
                            id="primary_service"
                            value={bi.primary_service}
                            onChange={(e) => updateField('primary_service', e.target.value)}
                            placeholder="custom deck design and installation"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="service_area">Service Area</Label>
                        <Input
                            id="service_area"
                            value={bi.service_area_description}
                            onChange={(e) => updateField('service_area_description', e.target.value)}
                            placeholder="the greater Los Angeles area"
                        />
                    </div>
                </div>

                {/* Local Office City */}
                <div className="space-y-2">
                    <Label htmlFor="office_city">Local Office City</Label>
                    <Input
                        id="office_city"
                        value={bi.local_office_city}
                        onChange={(e) => updateField('local_office_city', e.target.value)}
                        placeholder="Encino"
                    />
                    <p className="text-xs text-muted-foreground">
                        Used by AI to mention local presence
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
