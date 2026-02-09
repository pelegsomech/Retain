'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Phone,
    PhoneIncoming,
    Shield,
    Clock,
    Bot,
    AlertTriangle,
    Copy,
    Check,
    Plus,
    X,
    Loader2,
    Wrench,
    Calendar,
    MessageSquare,
    Siren,
    PhoneForwarded,
    Trash2,
} from "lucide-react"
import type { InboundConfig, ServiceMenuItem } from '@/lib/firebase-admin'

interface Props {
    config: InboundConfig
    isEnabled: boolean
    onEnable: (ownerPhone: string, areaCode?: string) => Promise<{ success: boolean; phoneNumber?: string; error?: string }>
    onDisable: () => Promise<void>
    onUpdate: (updates: Partial<InboundConfig>) => Promise<void>
}

const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
]

const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern (ET)' },
    { value: 'America/Chicago', label: 'Central (CT)' },
    { value: 'America/Denver', label: 'Mountain (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
    { value: 'America/Anchorage', label: 'Alaska (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
]

export function InboundAssistantSection({ config, isEnabled, onEnable, onDisable, onUpdate }: Props) {
    const [isEnabling, setIsEnabling] = useState(false)
    const [ownerPhone, setOwnerPhone] = useState(config.ownerPhone || '')
    const [areaCode, setAreaCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [enableError, setEnableError] = useState<string | null>(null)

    // VIP numbers
    const [newVipPhone, setNewVipPhone] = useState('')
    const [newVipLabel, setNewVipLabel] = useState('')

    // Service menu
    const [showAddService, setShowAddService] = useState(false)
    const [newService, setNewService] = useState<Partial<ServiceMenuItem>>({
        bookingType: 'appointment',
        requiresOnSiteVisit: true,
    })

    // Emergency keywords
    const [newKeyword, setNewKeyword] = useState('')

    const handleEnable = async () => {
        if (!ownerPhone) {
            setEnableError('Enter your phone number to receive transfers')
            return
        }
        setIsEnabling(true)
        setEnableError(null)
        try {
            const result = await onEnable(ownerPhone, areaCode || undefined)
            if (!result.success) {
                setEnableError(result.error || 'Failed to enable')
            }
        } catch {
            setEnableError('Something went wrong. Please try again.')
        } finally {
            setIsEnabling(false)
        }
    }

    const copyNumber = useCallback(() => {
        if (config.inboundPhoneNumber) {
            navigator.clipboard.writeText(config.inboundPhoneNumber)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [config.inboundPhoneNumber])

    const addVipNumber = () => {
        if (!newVipPhone) return
        const updated = [...(config.vipNumbers || []), { phone: newVipPhone, label: newVipLabel || 'VIP' }]
        onUpdate({ vipNumbers: updated })
        setNewVipPhone('')
        setNewVipLabel('')
    }

    const removeVipNumber = (index: number) => {
        const updated = [...(config.vipNumbers || [])]
        updated.splice(index, 1)
        onUpdate({ vipNumbers: updated })
    }

    const addEmergencyKeyword = () => {
        if (!newKeyword) return
        const updated = [...(config.emergencyKeywords || []), newKeyword.toLowerCase()]
        onUpdate({ emergencyKeywords: updated })
        setNewKeyword('')
    }

    const removeEmergencyKeyword = (index: number) => {
        const updated = [...(config.emergencyKeywords || [])]
        updated.splice(index, 1)
        onUpdate({ emergencyKeywords: updated })
    }

    const addServiceItem = () => {
        if (!newService.name) return
        const item: ServiceMenuItem = {
            id: `svc_${Date.now()}`,
            name: newService.name || '',
            description: newService.description || '',
            estimatedDuration: newService.estimatedDuration || '',
            priceRange: newService.priceRange,
            requiresOnSiteVisit: newService.requiresOnSiteVisit ?? true,
            bookingType: newService.bookingType || 'appointment',
        }
        const updated = [...(config.serviceMenu || []), item]
        onUpdate({ serviceMenu: updated })
        setNewService({ bookingType: 'appointment', requiresOnSiteVisit: true })
        setShowAddService(false)
    }

    const removeServiceItem = (index: number) => {
        const updated = [...(config.serviceMenu || [])]
        updated.splice(index, 1)
        onUpdate({ serviceMenu: updated })
    }

    // ============================================
    // NOT YET ENABLED — SETUP VIEW
    // ============================================
    if (!isEnabled || !config.inboundPhoneNumber) {
        return (
            <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <PhoneIncoming className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">AI Phone Assistant</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Get a dedicated phone number that answers calls 24/7 with AI.
                        Forward your business calls and never miss a customer again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-sm mx-auto">
                    <div className="space-y-2">
                        <Label htmlFor="ownerPhoneSetup">Your phone number (for transfers)</Label>
                        <Input
                            id="ownerPhoneSetup"
                            placeholder="+1 (555) 123-4567"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="areaCodeSetup">Preferred area code (optional)</Label>
                        <Input
                            id="areaCodeSetup"
                            placeholder="310"
                            value={areaCode}
                            onChange={(e) => setAreaCode(e.target.value)}
                            maxLength={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            We'll try to get a local number in your area
                        </p>
                    </div>

                    {enableError && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {enableError}
                        </div>
                    )}

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleEnable}
                        disabled={isEnabling}
                    >
                        {isEnabling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting up your AI line...
                            </>
                        ) : (
                            <>
                                <Phone className="mr-2 h-4 w-4" />
                                Enable AI Phone Assistant
                            </>
                        )}
                    </Button>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground pt-2">
                        <div className="flex flex-col items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Books appts</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>Takes messages</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <PhoneForwarded className="h-4 w-4" />
                            <span>Transfers calls</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ============================================
    // ENABLED — FULL CONFIG VIEW
    // ============================================
    return (
        <div className="space-y-4">
            {/* Inbound Number + Status */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50/30 to-emerald-50/30">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <PhoneIncoming className="h-4 w-4 text-green-600" />
                            </div>
                            AI Phone Assistant
                            <Badge className="text-green-600 bg-green-100">Active</Badge>
                        </CardTitle>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => checked ? onEnable(ownerPhone) : onDisable()}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Your AI Phone Number</p>
                            <p className="text-lg font-mono font-bold tracking-wide">
                                {config.inboundPhoneNumber}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={copyNumber}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground bg-white/50 rounded-lg p-3">
                        📱 <strong>Setup:</strong> On your phone, go to Settings → Phone → Call Forwarding → Forward to this number when busy/unanswered. Or set up conditional forwarding through your carrier.
                    </p>
                </CardContent>
            </Card>

            {/* Owner Phone */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PhoneForwarded className="h-4 w-4 text-blue-600" />
                        </div>
                        Owner Phone
                    </CardTitle>
                    <CardDescription>Where VIP calls and transfers go</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        value={config.ownerPhone || ''}
                        onChange={(e) => onUpdate({ ownerPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                    />
                </CardContent>
            </Card>

            {/* VIP Numbers */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-amber-600" />
                        </div>
                        VIP Numbers
                        <Badge variant="outline" className="ml-auto">{config.vipNumbers?.length || 0}</Badge>
                    </CardTitle>
                    <CardDescription>
                        These callers skip the AI and go directly to you
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Existing VIPs */}
                    {config.vipNumbers?.map((vip, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                            <div>
                                <span className="text-sm font-medium">{vip.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{vip.phone}</span>
                            </div>
                            <button onClick={() => removeVipNumber(i)} className="text-muted-foreground hover:text-red-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {/* Add new VIP */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Label (e.g. Mom)"
                            value={newVipLabel}
                            onChange={(e) => setNewVipLabel(e.target.value)}
                            className="w-1/3"
                        />
                        <Input
                            placeholder="+1 (555) 123-4567"
                            value={newVipPhone}
                            onChange={(e) => setNewVipPhone(e.target.value)}
                            className="flex-1"
                        />
                        <Button variant="outline" size="icon" onClick={addVipNumber} disabled={!newVipPhone}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-purple-600" />
                        </div>
                        Business Hours
                    </CardTitle>
                    <CardDescription>
                        The AI uses different greetings during and after hours
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <select
                            value={config.timezone || 'America/Los_Angeles'}
                            onChange={(e) => onUpdate({ timezone: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        {DAYS.map(day => {
                            const schedule = config.businessHours?.[day.key]
                            return (
                                <div key={day.key} className="flex items-center gap-3">
                                    <Switch
                                        checked={schedule?.enabled ?? false}
                                        onCheckedChange={(checked) => {
                                            const updated = {
                                                ...config.businessHours,
                                                [day.key]: {
                                                    ...schedule,
                                                    enabled: checked,
                                                    start: schedule?.start || '09:00',
                                                    end: schedule?.end || '17:00',
                                                },
                                            }
                                            onUpdate({ businessHours: updated })
                                        }}
                                    />
                                    <span className={`text-sm w-10 ${schedule?.enabled ? 'font-medium' : 'text-muted-foreground'}`}>
                                        {day.label}
                                    </span>
                                    {schedule?.enabled ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="time"
                                                value={schedule.start || '09:00'}
                                                onChange={(e) => {
                                                    const updated = {
                                                        ...config.businessHours,
                                                        [day.key]: { ...schedule, start: e.target.value },
                                                    }
                                                    onUpdate({ businessHours: updated })
                                                }}
                                                className="h-8 px-2 rounded border border-input bg-background text-sm"
                                            />
                                            <span className="text-muted-foreground">—</span>
                                            <input
                                                type="time"
                                                value={schedule.end || '17:00'}
                                                onChange={(e) => {
                                                    const updated = {
                                                        ...config.businessHours,
                                                        [day.key]: { ...schedule, end: e.target.value },
                                                    }
                                                    onUpdate({ businessHours: updated })
                                                }}
                                                className="h-8 px-2 rounded border border-input bg-background text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Closed</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <Separator />

                    {/* Greetings */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Business Hours Greeting</Label>
                            <Input
                                value={config.businessHoursGreeting || ''}
                                onChange={(e) => onUpdate({ businessHoursGreeting: e.target.value })}
                                placeholder="Thank you for calling! How can I help you today?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>After Hours Greeting</Label>
                            <Input
                                value={config.afterHoursGreeting || ''}
                                onChange={(e) => onUpdate({ afterHoursGreeting: e.target.value })}
                                placeholder="We're currently closed, but I can take a message or schedule an appointment."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Bot className="h-4 w-4 text-indigo-600" />
                        </div>
                        AI Capabilities
                    </CardTitle>
                    <CardDescription>What your AI assistant can do on calls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { key: 'canBookAppointments', icon: Calendar, label: 'Book Appointments', desc: 'Schedule appointments via your connected calendar' },
                        { key: 'canAcceptServiceCalls', icon: Wrench, label: 'Accept Service Calls', desc: 'Take service requests and log them' },
                        { key: 'canProvideQuotes', icon: MessageSquare, label: 'Provide Estimates', desc: 'Share pricing from your service menu' },
                        { key: 'canTransferToOwner', icon: PhoneForwarded, label: 'Transfer to Owner', desc: 'Connect callers to you when requested' },
                        { key: 'canTakeMessages', icon: MessageSquare, label: 'Take Messages', desc: 'Record messages and SMS them to you' },
                        { key: 'canHandleEmergencies', icon: Siren, label: 'Handle Emergencies', desc: 'Detect emergencies and alert you immediately' },
                    ].map(cap => (
                        <div key={cap.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <cap.icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <Label>{cap.label}</Label>
                                    <p className="text-xs text-muted-foreground">{cap.desc}</p>
                                </div>
                            </div>
                            <Switch
                                checked={(config.capabilities as Record<string, boolean>)?.[cap.key] ?? true}
                                onCheckedChange={(checked) => {
                                    onUpdate({
                                        capabilities: {
                                            ...config.capabilities,
                                            [cap.key]: checked,
                                        },
                                    })
                                }}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Service Menu */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Wrench className="h-4 w-4 text-orange-600" />
                        </div>
                        Service Menu
                        <Badge variant="outline" className="ml-auto">{config.serviceMenu?.length || 0}</Badge>
                    </CardTitle>
                    <CardDescription>
                        Services the AI can discuss and schedule
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {config.serviceMenu?.map((svc, i) => (
                        <div key={svc.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{svc.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {svc.bookingType}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {svc.description}
                                    {svc.priceRange && ` · ${svc.priceRange}`}
                                    {svc.estimatedDuration && ` · ~${svc.estimatedDuration}`}
                                </p>
                            </div>
                            <button onClick={() => removeServiceItem(i)} className="text-muted-foreground hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {showAddService ? (
                        <div className="space-y-3 border rounded-lg p-3 bg-white">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Service Name *</Label>
                                    <Input
                                        placeholder="e.g. Roof Repair"
                                        value={newService.name || ''}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Booking Type</Label>
                                    <select
                                        value={newService.bookingType}
                                        onChange={(e) => setNewService({ ...newService, bookingType: e.target.value as ServiceMenuItem['bookingType'] })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    >
                                        <option value="appointment">Appointment</option>
                                        <option value="service_call">Service Call</option>
                                        <option value="consultation">Consultation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input
                                    placeholder="Brief description of the service"
                                    value={newService.description || ''}
                                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Price Range (optional)</Label>
                                    <Input
                                        placeholder="$200 - $500"
                                        value={newService.priceRange || ''}
                                        onChange={(e) => setNewService({ ...newService, priceRange: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Duration (optional)</Label>
                                    <Input
                                        placeholder="2-4 hours"
                                        value={newService.estimatedDuration || ''}
                                        onChange={(e) => setNewService({ ...newService, estimatedDuration: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={addServiceItem} disabled={!newService.name}>
                                    <Plus className="mr-1 h-3 w-3" /> Add
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setShowAddService(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full" onClick={() => setShowAddService(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Service
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Emergency Keywords */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Siren className="h-4 w-4 text-red-600" />
                        </div>
                        Emergency Keywords
                    </CardTitle>
                    <CardDescription>
                        When the AI hears these words, it immediately alerts you
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {config.emergencyKeywords?.map((kw, i) => (
                            <Badge
                                key={i}
                                variant="outline"
                                className="text-red-600 border-red-200 bg-red-50 cursor-pointer hover:bg-red-100"
                                onClick={() => removeEmergencyKeyword(i)}
                            >
                                {kw}
                                <X className="h-3 w-3 ml-1" />
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add keyword..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addEmergencyKeyword()}
                        />
                        <Button variant="outline" size="icon" onClick={addEmergencyKeyword} disabled={!newKeyword}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
