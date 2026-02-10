'use client'

import { Switch } from "@/components/ui/switch"
import { ClipboardCheck } from "lucide-react"
import { type AtomicConfig } from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
}

const QUALIFICATION_ITEMS = [
    {
        key: 'ask_property_ownership' as const,
        label: 'Property Ownership',
        desc: 'Confirm the lead owns the property',
    },
    {
        key: 'ask_decision_makers' as const,
        label: 'Decision Makers',
        desc: 'Ask if all decision-makers will be present',
    },
    {
        key: 'ask_budget_range' as const,
        label: 'Budget Range',
        desc: 'Inquire about budget expectations',
    },
    {
        key: 'ask_timeline' as const,
        label: 'Project Timeline',
        desc: 'Ask when they want to start the project',
    },
    {
        key: 'ask_insurance_claim' as const,
        label: 'Insurance Claim',
        desc: 'Check if this is an insurance-related project',
    },
    {
        key: 'ask_financing_interest' as const,
        label: 'Financing Interest',
        desc: 'Ask about interest in financing options',
    },
    {
        key: 'ask_permit_status' as const,
        label: 'Permit Status',
        desc: 'Inquire about existing permits',
    },
]

/**
 * Qualification Checklist Section
 * Configures: what questions the AI asks to qualify leads
 */
export function QualificationSection({ config, onChange }: Props) {
    const qc = config.qualification_checklist

    const updateField = (key: keyof typeof qc, value: boolean) => {
        onChange({
            qualification_checklist: {
                ...qc,
                [key]: value,
            },
        })
    }

    const enabledCount = Object.values(qc).filter(Boolean).length

    return (
        <div className="settings-card p-6">
            <div className="settings-section-header">
                <div className="settings-icon-circle">
                    <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="settings-title">Lead Qualification</h3>
                        <span className="settings-badge">
                            {enabledCount} of {QUALIFICATION_ITEMS.length} active
                        </span>
                    </div>
                    <p className="settings-desc">Choose what the AI verifies during qualification calls</p>
                </div>
            </div>

            <div className="mt-5">
                {QUALIFICATION_ITEMS.map(item => (
                    <div key={item.key} className="settings-row">
                        <div>
                            <label className="settings-label cursor-pointer" htmlFor={item.key}>
                                {item.label}
                            </label>
                            <p className="settings-hint">{item.desc}</p>
                        </div>
                        <Switch
                            id={item.key}
                            checked={qc[item.key]}
                            onCheckedChange={(checked) => updateField(item.key, checked)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
