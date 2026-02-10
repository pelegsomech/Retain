'use client'

import { useState, useCallback } from 'react'
import { Switch } from "@/components/ui/switch"
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
            <div className="settings-card p-8 text-center" style={{ borderStyle: 'dashed', borderColor: '#C4A265', background: 'linear-gradient(135deg, #FEFCF9 0%, #F7F6F3 100%)' }}>
                <div className="mx-auto w-16 h-16 bg-[#18181B] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <PhoneIncoming className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#18181B] mb-2">AI Phone Assistant</h3>
                <p className="text-sm text-[#8C8780] max-w-md mx-auto mb-6">
                    Get a dedicated phone number that answers calls 24/7 with AI.
                    Forward your business calls and never miss a customer again.
                </p>

                <div className="max-w-sm mx-auto space-y-4">
                    <div className="space-y-2 text-left">
                        <label className="settings-label" htmlFor="ownerPhoneSetup">Your phone number (for transfers)</label>
                        <input
                            id="ownerPhoneSetup"
                            placeholder="+1 (555) 123-4567"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="settings-label" htmlFor="areaCodeSetup">Preferred area code (optional)</label>
                        <input
                            id="areaCodeSetup"
                            placeholder="310"
                            value={areaCode}
                            onChange={(e) => setAreaCode(e.target.value)}
                            maxLength={3}
                            className="settings-input w-full"
                        />
                        <p className="settings-hint">
                            We&apos;ll try to get a local number in your area
                        </p>
                    </div>

                    {enableError && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 flex items-center gap-2 border border-red-200">
                            <AlertTriangle className="h-4 w-4" />
                            {enableError}
                        </div>
                    )}

                    <button
                        className="w-full py-3 px-6 rounded-xl bg-[#18181B] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#2D2D30] transition-colors disabled:opacity-50"
                        onClick={handleEnable}
                        disabled={isEnabling}
                    >
                        {isEnabling ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Setting up your AI line...
                            </>
                        ) : (
                            <>
                                <Phone className="h-4 w-4" />
                                Enable AI Phone Assistant
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-[#8C8780] pt-2">
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
                </div>
            </div>
        )
    }

    // ============================================
    // ENABLED — FULL CONFIG VIEW
    // ============================================
    return (
        <div className="space-y-4">
            {/* Inbound Number + Status */}
            <div className="settings-card p-6" style={{ background: 'linear-gradient(135deg, #F0FAF0 0%, #F7F6F3 100%)', borderColor: '#C8E6C8' }}>
                <div className="settings-section-header">
                    <div className="settings-icon-circle" style={{ background: '#F0FAF0', color: '#2D6A2D' }}>
                        <PhoneIncoming className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="settings-title">AI Phone Assistant</h3>
                                <span className="settings-badge" style={{ background: '#F0FAF0', color: '#2D6A2D', borderColor: '#C8E6C8' }}>Active</span>
                            </div>
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => checked ? onEnable(ownerPhone) : onDisable()}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-xl border border-[#E8E5E0] p-3">
                        <div>
                            <p className="text-xs text-[#8C8780]">Your AI Phone Number</p>
                            <p className="text-lg font-mono font-bold tracking-wide text-[#18181B]">
                                {config.inboundPhoneNumber}
                            </p>
                        </div>
                        <button
                            onClick={copyNumber}
                            className="settings-chip"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="settings-tip">
                        📱 <strong>Setup:</strong> On your phone, go to Settings → Phone → Call Forwarding → Forward to this number when busy/unanswered. Or set up conditional forwarding through your carrier.
                    </div>
                </div>
            </div>

            {/* Owner Phone */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <PhoneForwarded className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">Owner Phone</h3>
                        <p className="settings-desc">Where VIP calls and transfers go</p>
                    </div>
                </div>
                <div className="mt-4">
                    <input
                        value={config.ownerPhone || ''}
                        onChange={(e) => onUpdate({ ownerPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="settings-input w-full"
                    />
                </div>
            </div>

            {/* VIP Numbers */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="settings-title">VIP Numbers</h3>
                            <span className="settings-badge">{config.vipNumbers?.length || 0}</span>
                        </div>
                        <p className="settings-desc">These callers skip the AI and go directly to you</p>
                    </div>
                </div>
                <div className="mt-4 space-y-3">
                    {config.vipNumbers?.map((vip, i) => (
                        <div key={i} className="flex items-center justify-between bg-[#F7F6F3] rounded-xl px-3 py-2">
                            <div>
                                <span className="text-sm font-medium text-[#18181B]">{vip.label}</span>
                                <span className="text-xs text-[#8C8780] ml-2">{vip.phone}</span>
                            </div>
                            <button onClick={() => removeVipNumber(i)} className="text-[#8C8780] hover:text-red-500 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <input
                            placeholder="Label (e.g. Mom)"
                            value={newVipLabel}
                            onChange={(e) => setNewVipLabel(e.target.value)}
                            className="settings-input w-1/3"
                        />
                        <input
                            placeholder="+1 (555) 123-4567"
                            value={newVipPhone}
                            onChange={(e) => setNewVipPhone(e.target.value)}
                            className="settings-input flex-1"
                        />
                        <button
                            onClick={addVipNumber}
                            disabled={!newVipPhone}
                            className="settings-chip disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Business Hours */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">Business Hours</h3>
                        <p className="settings-desc">The AI uses different greetings during and after hours</p>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <label className="settings-label">Timezone</label>
                        <select
                            value={config.timezone || 'America/Los_Angeles'}
                            onChange={(e) => onUpdate({ timezone: e.target.value })}
                            className="settings-input w-full h-10 cursor-pointer"
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
                                    <span className={`text-sm w-10 ${schedule?.enabled ? 'font-medium text-[#18181B]' : 'text-[#8C8780]'}`}>
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
                                                className="settings-input h-8 px-2 text-sm"
                                            />
                                            <span className="text-[#8C8780]">—</span>
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
                                                className="settings-input h-8 px-2 text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-[#8C8780]">Closed</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <hr className="settings-divider" />

                    {/* Greetings */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="settings-label">Business Hours Greeting</label>
                            <input
                                value={config.businessHoursGreeting || ''}
                                onChange={(e) => onUpdate({ businessHoursGreeting: e.target.value })}
                                placeholder="Thank you for calling! How can I help you today?"
                                className="settings-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="settings-label">After Hours Greeting</label>
                            <input
                                value={config.afterHoursGreeting || ''}
                                onChange={(e) => onUpdate({ afterHoursGreeting: e.target.value })}
                                placeholder="We're currently closed, but I can take a message or schedule an appointment."
                                className="settings-input w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Capabilities */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">AI Capabilities</h3>
                        <p className="settings-desc">What your AI assistant can do on calls</p>
                    </div>
                </div>
                <div className="mt-4">
                    {[
                        { key: 'canBookAppointments', icon: Calendar, label: 'Book Appointments', desc: 'Schedule appointments via your connected calendar' },
                        { key: 'canAcceptServiceCalls', icon: Wrench, label: 'Accept Service Calls', desc: 'Take service requests and log them' },
                        { key: 'canProvideQuotes', icon: MessageSquare, label: 'Provide Estimates', desc: 'Share pricing from your service menu' },
                        { key: 'canTransferToOwner', icon: PhoneForwarded, label: 'Transfer to Owner', desc: 'Connect callers to you when requested' },
                        { key: 'canTakeMessages', icon: MessageSquare, label: 'Take Messages', desc: 'Record messages and SMS them to you' },
                        { key: 'canHandleEmergencies', icon: Siren, label: 'Handle Emergencies', desc: 'Detect emergencies and alert you immediately' },
                    ].map(cap => (
                        <div key={cap.key} className="settings-row">
                            <div className="flex items-center gap-3">
                                <cap.icon className="h-4 w-4 text-[#C4A265]" />
                                <div>
                                    <label className="settings-label">{cap.label}</label>
                                    <p className="settings-hint">{cap.desc}</p>
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
                </div>
            </div>

            {/* Service Menu */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle">
                        <Wrench className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="settings-title">Service Menu</h3>
                            <span className="settings-badge">{config.serviceMenu?.length || 0}</span>
                        </div>
                        <p className="settings-desc">Services the AI can discuss and schedule</p>
                    </div>
                </div>
                <div className="mt-4 space-y-3">
                    {config.serviceMenu?.map((svc, i) => (
                        <div key={svc.id} className="flex items-center justify-between bg-[#F7F6F3] rounded-xl px-3 py-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[#18181B]">{svc.name}</span>
                                    <span className="settings-badge">{svc.bookingType}</span>
                                </div>
                                <p className="text-xs text-[#8C8780]">
                                    {svc.description}
                                    {svc.priceRange && ` · ${svc.priceRange}`}
                                    {svc.estimatedDuration && ` · ~${svc.estimatedDuration}`}
                                </p>
                            </div>
                            <button onClick={() => removeServiceItem(i)} className="text-[#8C8780] hover:text-red-500 transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {showAddService ? (
                        <div className="space-y-3 border border-[#E8E5E0] rounded-xl p-3 bg-white">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#18181B]">Service Name *</label>
                                    <input
                                        placeholder="e.g. Roof Repair"
                                        value={newService.name || ''}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                        className="settings-input w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#18181B]">Booking Type</label>
                                    <select
                                        value={newService.bookingType}
                                        onChange={(e) => setNewService({ ...newService, bookingType: e.target.value as ServiceMenuItem['bookingType'] })}
                                        className="settings-input w-full h-10 cursor-pointer"
                                    >
                                        <option value="appointment">Appointment</option>
                                        <option value="service_call">Service Call</option>
                                        <option value="consultation">Consultation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#18181B]">Description</label>
                                <input
                                    placeholder="Brief description of the service"
                                    value={newService.description || ''}
                                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                    className="settings-input w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#18181B]">Price Range (optional)</label>
                                    <input
                                        placeholder="$200 - $500"
                                        value={newService.priceRange || ''}
                                        onChange={(e) => setNewService({ ...newService, priceRange: e.target.value })}
                                        className="settings-input w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#18181B]">Duration (optional)</label>
                                    <input
                                        placeholder="2-4 hours"
                                        value={newService.estimatedDuration || ''}
                                        onChange={(e) => setNewService({ ...newService, estimatedDuration: e.target.value })}
                                        className="settings-input w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addServiceItem}
                                    disabled={!newService.name}
                                    className="settings-chip active flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Plus className="h-3 w-3" /> Add
                                </button>
                                <button
                                    onClick={() => setShowAddService(false)}
                                    className="settings-chip"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="settings-chip w-full flex items-center justify-center gap-2"
                            onClick={() => setShowAddService(true)}
                        >
                            <Plus className="h-4 w-4" /> Add Service
                        </button>
                    )}
                </div>
            </div>

            {/* Emergency Keywords */}
            <div className="settings-card p-6">
                <div className="settings-section-header">
                    <div className="settings-icon-circle" style={{ background: '#FEF2F2', color: '#DC3545' }}>
                        <Siren className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="settings-title">Emergency Keywords</h3>
                        <p className="settings-desc">When the AI hears these words, it immediately alerts you</p>
                    </div>
                </div>
                <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {config.emergencyKeywords?.map((kw, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => removeEmergencyKeyword(i)}
                            >
                                {kw}
                                <X className="h-3 w-3" />
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            placeholder="Add keyword..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addEmergencyKeyword()}
                            className="settings-input flex-1"
                        />
                        <button
                            onClick={addEmergencyKeyword}
                            disabled={!newKeyword}
                            className="settings-chip disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
