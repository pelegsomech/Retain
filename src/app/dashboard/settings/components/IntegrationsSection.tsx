'use client'

import { Switch } from "@/components/ui/switch"
import { Phone, Bot, Calendar, Webhook } from "lucide-react"
import {
    type AtomicConfig,
    type CalendarProvider,
    CALENDAR_PROVIDERS,
} from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
    // Legacy fields for integrations (not in atomicConfig)
    legacyIntegrations: {
        twilioSid: string
        twilioFromPhone: string
        retellAgentId: string
        calendarUrl: string
    }
    onLegacyChange: (field: string, value: string) => void
}

const CALENDAR_LABELS: Record<CalendarProvider, string> = {
    google_calendar: 'Google Calendar',
    calendly: 'Calendly',
    calcom: 'Cal.com',
    jobber: 'Jobber',
    gohighlevel: 'GoHighLevel',
}

/**
 * Technical Integrations Section
 * Configures: Twilio, Retell, Calendar, webhooks
 */
export function IntegrationsSection({ config, onChange, legacyIntegrations, onLegacyChange }: Props) {
    const ti = config.technical_integration

    const updateField = <K extends keyof typeof ti>(key: K, value: typeof ti[K]) => {
        onChange({
            technical_integration: {
                ...ti,
                [key]: value,
            },
        })
    }

    return (
        <div className="space-y-4">
            {/* Twilio */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="settings-title">Twilio</h3>
                            <span className={`settings-badge ${legacyIntegrations.twilioSid ? '!bg-[#F0FAF0] !text-[#2D6A2D] !border-[#C8E6C8]' : ''}`}>
                                {legacyIntegrations.twilioSid ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        <p className="settings-desc">SMS notifications to your team</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="twilioSid">Account SID</label>
                        <input
                            id="twilioSid"
                            placeholder="ACxxxxxxxxx"
                            value={legacyIntegrations.twilioSid}
                            onChange={(e) => onLegacyChange('twilioSid', e.target.value)}
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="twilioFromPhone">From Phone Number</label>
                        <input
                            id="twilioFromPhone"
                            placeholder="+15551234567"
                            value={legacyIntegrations.twilioFromPhone}
                            onChange={(e) => onLegacyChange('twilioFromPhone', e.target.value)}
                            className="settings-input w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Retell */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="settings-title">Retell.ai</h3>
                            <span className={`settings-badge ${legacyIntegrations.retellAgentId ? '!bg-[#F0FAF0] !text-[#2D6A2D] !border-[#C8E6C8]' : ''}`}>
                                {legacyIntegrations.retellAgentId ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        <p className="settings-desc">AI voice agent for calling leads</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <label className="settings-label" htmlFor="retellAgentId">Agent ID</label>
                    <input
                        id="retellAgentId"
                        placeholder="agent_xxxxxxxxx"
                        value={legacyIntegrations.retellAgentId}
                        onChange={(e) => onLegacyChange('retellAgentId', e.target.value)}
                        className="settings-input w-full"
                    />
                    <p className="settings-hint">
                        Your Retell agent will receive dynamic variables from your Atomic Config
                    </p>
                </div>
            </div>

            {/* Calendar */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="settings-title">Calendar Booking</h3>
                            <span className={`settings-badge ${ti.calendar_provider ? '!bg-[#F0FAF0] !text-[#2D6A2D] !border-[#C8E6C8]' : ''}`}>
                                {ti.calendar_provider ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        <p className="settings-desc">Where the AI books appointments</p>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="calendar_provider">Calendar Provider</label>
                        <select
                            id="calendar_provider"
                            value={ti.calendar_provider || ''}
                            onChange={(e) => updateField('calendar_provider', (e.target.value || null) as CalendarProvider | null)}
                            className="settings-input w-full h-10 cursor-pointer"
                        >
                            <option value="">None</option>
                            {CALENDAR_PROVIDERS.map(provider => (
                                <option key={provider} value={provider}>
                                    {CALENDAR_LABELS[provider]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="calendar_id">Booking URL / Calendar ID</label>
                        <input
                            id="calendar_id"
                            placeholder="https://cal.com/your-company/consultation"
                            value={ti.calendar_id || ''}
                            onChange={(e) => updateField('calendar_id', e.target.value || null)}
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="settings-label" htmlFor="sms_confirmation">SMS Confirmation</label>
                            <p className="settings-hint">
                                Send booking confirmation via SMS
                            </p>
                        </div>
                        <Switch
                            id="sms_confirmation"
                            checked={ti.sms_confirmation}
                            onCheckedChange={(checked) => updateField('sms_confirmation', checked)}
                        />
                    </div>
                </div>
            </div>

            {/* Webhook */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Webhook className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">Webhooks</h3>
                        <p className="settings-desc">Send call outcomes to your systems</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <label className="settings-label" htmlFor="webhook_url">Webhook URL</label>
                    <input
                        id="webhook_url"
                        placeholder="https://api.yourdomain.com/v1/call-complete"
                        value={ti.webhook_url || ''}
                        onChange={(e) => updateField('webhook_url', e.target.value || null)}
                        className="settings-input w-full"
                    />
                    <p className="settings-hint">
                        Receives POST with call outcomes: {ti.call_outcome_options.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    )
}
