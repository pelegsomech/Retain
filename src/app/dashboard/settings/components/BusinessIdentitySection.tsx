'use client'

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
        <div className="settings-card p-6">
            <div className="settings-section-header">
                <div className="settings-icon-circle">
                    <Building2 className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="settings-title">Business Identity</h3>
                    <p className="settings-desc">Define your company and how the AI represents you</p>
                </div>
            </div>

            <div className="mt-5 space-y-6">
                {/* Brand Name */}
                <div className="space-y-2">
                    <label className="settings-label" htmlFor="brand_name">Brand Name</label>
                    <input
                        id="brand_name"
                        value={bi.brand_name}
                        onChange={(e) => updateField('brand_name', e.target.value)}
                        placeholder="Terra Decking"
                        className="settings-input w-full"
                    />
                    <p className="settings-hint">
                        How the AI introduces your company to leads
                    </p>
                </div>

                {/* Agent Persona */}
                <div className="space-y-3">
                    <label className="settings-label">Agent Persona</label>
                    <div className="grid grid-cols-3 gap-3">
                        {AGENT_PERSONAS.map(persona => {
                            const { label, desc } = PERSONA_LABELS[persona]
                            const isSelected = bi.agent_persona === persona
                            return (
                                <button
                                    key={persona}
                                    type="button"
                                    onClick={() => updateField('agent_persona', persona)}
                                    className={`settings-card-chip text-left ${isSelected ? 'active' : ''}`}
                                >
                                    <div className="font-medium text-sm">{label}</div>
                                    <div className="text-xs text-[#8C8780] mt-1">{desc}</div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Primary Service & Service Area */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="primary_service">Primary Service</label>
                        <input
                            id="primary_service"
                            value={bi.primary_service}
                            onChange={(e) => updateField('primary_service', e.target.value)}
                            placeholder="custom deck design and installation"
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="service_area">Service Area</label>
                        <input
                            id="service_area"
                            value={bi.service_area_description}
                            onChange={(e) => updateField('service_area_description', e.target.value)}
                            placeholder="the greater Los Angeles area"
                            className="settings-input w-full"
                        />
                    </div>
                </div>

                {/* Local Office City */}
                <div className="space-y-2">
                    <label className="settings-label" htmlFor="office_city">Local Office City</label>
                    <input
                        id="office_city"
                        value={bi.local_office_city}
                        onChange={(e) => updateField('local_office_city', e.target.value)}
                        placeholder="Encino"
                        className="settings-input w-full"
                    />
                    <p className="settings-hint">
                        Used by AI to mention local presence
                    </p>
                </div>
            </div>
        </div>
    )
}
