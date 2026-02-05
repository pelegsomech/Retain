'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-4 w-4 text-red-600" />
                        </div>
                        Twilio
                        <Badge
                            variant={legacyIntegrations.twilioSid ? 'default' : 'outline'}
                            className={legacyIntegrations.twilioSid ? 'text-green-600 ml-auto' : 'text-yellow-600 ml-auto'}
                        >
                            {legacyIntegrations.twilioSid ? 'Connected' : 'Not Connected'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>SMS notifications to your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="twilioSid">Account SID</Label>
                            <Input
                                id="twilioSid"
                                placeholder="ACxxxxxxxxx"
                                value={legacyIntegrations.twilioSid}
                                onChange={(e) => onLegacyChange('twilioSid', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twilioFromPhone">From Phone Number</Label>
                            <Input
                                id="twilioFromPhone"
                                placeholder="+15551234567"
                                value={legacyIntegrations.twilioFromPhone}
                                onChange={(e) => onLegacyChange('twilioFromPhone', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Retell */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Bot className="h-4 w-4 text-purple-600" />
                        </div>
                        Retell.ai
                        <Badge
                            variant={legacyIntegrations.retellAgentId ? 'default' : 'outline'}
                            className={legacyIntegrations.retellAgentId ? 'text-green-600 ml-auto' : 'text-yellow-600 ml-auto'}
                        >
                            {legacyIntegrations.retellAgentId ? 'Connected' : 'Not Connected'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>AI voice agent for calling leads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="retellAgentId">Agent ID</Label>
                        <Input
                            id="retellAgentId"
                            placeholder="agent_xxxxxxxxx"
                            value={legacyIntegrations.retellAgentId}
                            onChange={(e) => onLegacyChange('retellAgentId', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Your Retell agent will receive dynamic variables from your Atomic Config
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        Calendar Booking
                        <Badge
                            variant={ti.calendar_provider ? 'default' : 'outline'}
                            className={ti.calendar_provider ? 'text-green-600 ml-auto' : 'text-yellow-600 ml-auto'}
                        >
                            {ti.calendar_provider ? 'Connected' : 'Not Connected'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>Where the AI books appointments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="calendar_provider">Calendar Provider</Label>
                        <select
                            id="calendar_provider"
                            value={ti.calendar_provider || ''}
                            onChange={(e) => updateField('calendar_provider', (e.target.value || null) as CalendarProvider | null)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                        <Label htmlFor="calendar_id">Booking URL / Calendar ID</Label>
                        <Input
                            id="calendar_id"
                            placeholder="https://cal.com/your-company/consultation"
                            value={ti.calendar_id || ''}
                            onChange={(e) => updateField('calendar_id', e.target.value || null)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sms_confirmation">SMS Confirmation</Label>
                            <p className="text-xs text-muted-foreground">
                                Send booking confirmation via SMS
                            </p>
                        </div>
                        <Switch
                            id="sms_confirmation"
                            checked={ti.sms_confirmation}
                            onCheckedChange={(checked) => updateField('sms_confirmation', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Webhook */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Webhook className="h-4 w-4 text-blue-600" />
                        </div>
                        Webhooks
                    </CardTitle>
                    <CardDescription>Send call outcomes to your systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook_url">Webhook URL</Label>
                        <Input
                            id="webhook_url"
                            placeholder="https://api.yourdomain.com/v1/call-complete"
                            value={ti.webhook_url || ''}
                            onChange={(e) => updateField('webhook_url', e.target.value || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Receives POST with call outcomes: {ti.call_outcome_options.join(', ')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
