'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Lead Qualification
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                        {enabledCount} of {QUALIFICATION_ITEMS.length} active
                    </span>
                </CardTitle>
                <CardDescription>
                    Choose what the AI verifies during qualification calls
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {QUALIFICATION_ITEMS.map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                            <Label htmlFor={item.key} className="cursor-pointer">
                                {item.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                            id={item.key}
                            checked={qc[item.key]}
                            onCheckedChange={(checked) => updateField(item.key, checked)}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
