'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Building2,
    Phone,
    Palette,
    Bot,
    Calendar,
    Shield,
    Loader2,
    Save,
    CheckCircle,
    Clock,
    MessageSquare,
    Wrench,
} from "lucide-react";

// Contractor types for dropdown
const CONTRACTOR_TYPES = [
    { value: 'GENERAL', label: 'General Contractor' },
    { value: 'ROOFING', label: 'Roofing' },
    { value: 'HVAC', label: 'HVAC & Climate Control' },
    { value: 'HARDSCAPING', label: 'Hardscaping & Outdoor Living' },
    { value: 'ADU', label: 'ADU (Accessory Dwelling Units)' },
    { value: 'KITCHEN_BATH', label: 'Kitchen & Bathroom Remodeling' },
    { value: 'SIDING', label: 'Siding & Exterior' },
    { value: 'DECKING', label: 'Decking & Outdoor Structures' },
    { value: 'PLUMBING', label: 'Plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'PAINTING', label: 'Painting & Finishing' },
    { value: 'LANDSCAPING', label: 'Landscaping' },
    { value: 'SOLAR', label: 'Solar Installation' },
    { value: 'WINDOWS_DOORS', label: 'Windows & Doors' },
    { value: 'FLOORING', label: 'Flooring' },
    { value: 'REMODELING', label: 'Home Remodeling' },
];

const TONE_STYLES = [
    { value: 'professional', label: 'Professional', desc: 'Formal, business-like tone' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable conversations' },
    { value: 'casual', label: 'Casual', desc: 'Relaxed, conversational style' },
];

interface Tenant {
    id: string;
    companyName: string;
    slug: string;
    niche: string;
    contractorType: string;
    primaryColor: string;
    accentColor: string;
    twilioFromPhone: string | null;
    twilioSid: string | null;
    retellAgentId: string | null;
    calendarUrl: string | null;
    consentText: string;
    claimTimeoutSec: number;
    aiGreeting: string | null;
    aiServiceList: string | null;
    aiToneStyle: string;
}

export default function SettingsPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contractorType: 'GENERAL',
        primaryColor: '#2563eb',
        accentColor: '#1e40af',
        twilioFromPhone: '',
        twilioSid: '',
        twilioToken: '',
        retellAgentId: '',
        calendarUrl: '',
        claimTimeoutSec: 60,
        aiGreeting: '',
        aiServiceList: '',
        aiToneStyle: 'professional',
    });

    useEffect(() => {
        fetchTenant();
    }, []);

    const fetchTenant = async () => {
        try {
            const response = await fetch('/api/tenants');
            if (response.ok) {
                const data = await response.json();
                setTenant(data.tenant);
                setFormData({
                    companyName: data.tenant.companyName || '',
                    contractorType: data.tenant.contractorType || 'GENERAL',
                    primaryColor: data.tenant.primaryColor || '#2563eb',
                    accentColor: data.tenant.accentColor || '#1e40af',
                    twilioFromPhone: data.tenant.twilioFromPhone || '',
                    twilioSid: data.tenant.twilioSid || '',
                    twilioToken: '', // Don't expose token
                    retellAgentId: data.tenant.retellAgentId || '',
                    calendarUrl: data.tenant.calendarUrl || '',
                    claimTimeoutSec: data.tenant.claimTimeoutSec || 60,
                    aiGreeting: data.tenant.aiGreeting || '',
                    aiServiceList: data.tenant.aiServiceList || '',
                    aiToneStyle: data.tenant.aiToneStyle || 'professional',
                });
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updateData: Record<string, unknown> = { ...formData };
            // Only send token if it was changed
            if (!formData.twilioToken) {
                delete updateData.twilioToken;
            }

            const response = await fetch('/api/tenants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Convert seconds to minutes for display
    const claimTimeoutMinutes = Math.round(formData.claimTimeoutSec / 60);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-[#666666]">Configure your CRM and AI voice agent</p>
                </div>
                {tenant && (
                    <Badge variant="outline" className="text-sm">
                        Slug: {tenant.slug}
                    </Badge>
                )}
            </div>

            {/* Contractor Type & Timeout */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Business Configuration
                    </CardTitle>
                    <CardDescription>Your business type and lead handling settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                placeholder="Acme Roofing"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contractorType">Contractor Type</Label>
                            <select
                                id="contractorType"
                                value={formData.contractorType}
                                onChange={(e) => setFormData(prev => ({ ...prev, contractorType: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                {CONTRACTOR_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-[#9E9E9E]">
                                AI will customize conversations based on your industry
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Claim Timeout */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Claim Timeout</div>
                                <div className="text-sm text-[#666666]">
                                    Time your team has to claim a lead before AI takes over
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-amber-600">
                                {claimTimeoutMinutes} min
                            </div>
                        </div>
                        <div className="pl-13">
                            <input
                                type="range"
                                min={30}
                                max={600}
                                step={30}
                                value={formData.claimTimeoutSec}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    claimTimeoutSec: parseInt(e.target.value)
                                }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-[#9E9E9E] mt-1">
                                <span>30 sec</span>
                                <span>5 min</span>
                                <span>10 min</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Voice Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI Voice Agent
                    </CardTitle>
                    <CardDescription>Customize how your AI agent talks to leads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Tone Style */}
                    <div className="space-y-3">
                        <Label>Conversation Tone</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {TONE_STYLES.map(tone => (
                                <button
                                    key={tone.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, aiToneStyle: tone.value }))}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${formData.aiToneStyle === tone.value
                                            ? 'border-black bg-[#FAFAFA]'
                                            : 'border-[#EEEEEE] hover:border-[#CCCCCC]'
                                        }`}
                                >
                                    <div className="font-medium">{tone.label}</div>
                                    <div className="text-xs text-[#666666] mt-1">{tone.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Custom Greeting */}
                    <div className="space-y-2">
                        <Label htmlFor="aiGreeting">Custom AI Greeting (optional)</Label>
                        <textarea
                            id="aiGreeting"
                            value={formData.aiGreeting}
                            onChange={(e) => setFormData(prev => ({ ...prev, aiGreeting: e.target.value }))}
                            placeholder="Hi {lead_name}! This is Sarah from {company_name}. I'm calling about your recent inquiry for a free estimate..."
                            className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                        />
                        <p className="text-xs text-[#9E9E9E]">
                            Use {'{lead_name}'} and {'{company_name}'} as placeholders. Leave empty for default greeting.
                        </p>
                    </div>

                    {/* Services List */}
                    <div className="space-y-2">
                        <Label htmlFor="aiServiceList">Services Offered</Label>
                        <Input
                            id="aiServiceList"
                            value={formData.aiServiceList}
                            onChange={(e) => setFormData(prev => ({ ...prev, aiServiceList: e.target.value }))}
                            placeholder="roof repair, roof replacement, gutters, inspections"
                        />
                        <p className="text-xs text-[#9E9E9E]">
                            Comma-separated list. AI will mention these when discussing your services.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Integrations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Integrations
                    </CardTitle>
                    <CardDescription>Connect external services for SMS and AI calls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Twilio */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Phone className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Twilio</div>
                                <div className="text-sm text-[#666666]">SMS notifications to your team</div>
                            </div>
                            <Badge variant={formData.twilioSid ? 'default' : 'outline'} className={formData.twilioSid ? 'text-green-600' : 'text-yellow-600'}>
                                {formData.twilioSid ? 'Connected' : 'Not Connected'}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pl-13">
                            <div className="space-y-2">
                                <Label htmlFor="twilioSid">Account SID</Label>
                                <Input
                                    id="twilioSid"
                                    placeholder="ACxxxxxxxxx"
                                    value={formData.twilioSid}
                                    onChange={(e) => setFormData(prev => ({ ...prev, twilioSid: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twilioToken">Auth Token</Label>
                                <Input
                                    id="twilioToken"
                                    type="password"
                                    placeholder="Enter to update"
                                    value={formData.twilioToken}
                                    onChange={(e) => setFormData(prev => ({ ...prev, twilioToken: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twilioFromPhone">From Phone Number</Label>
                                <Input
                                    id="twilioFromPhone"
                                    placeholder="+15551234567"
                                    value={formData.twilioFromPhone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, twilioFromPhone: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Retell */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Retell.ai</div>
                                <div className="text-sm text-[#666666]">AI voice agent for calling leads</div>
                            </div>
                            <Badge variant={formData.retellAgentId ? 'default' : 'outline'} className={formData.retellAgentId ? 'text-green-600' : 'text-yellow-600'}>
                                {formData.retellAgentId ? 'Connected' : 'Not Connected'}
                            </Badge>
                        </div>
                        <div className="space-y-2 pl-13">
                            <Label htmlFor="retellAgentId">Agent ID</Label>
                            <Input
                                id="retellAgentId"
                                placeholder="agent_xxxxxxxxx"
                                value={formData.retellAgentId}
                                onChange={(e) => setFormData(prev => ({ ...prev, retellAgentId: e.target.value }))}
                            />
                            <p className="text-xs text-[#9E9E9E]">
                                Your Retell agent will receive dynamic variables for each call
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Calendar */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Calendar Booking</div>
                                <div className="text-sm text-[#666666]">Cal.com or GoHighLevel</div>
                            </div>
                            <Badge variant={formData.calendarUrl ? 'default' : 'outline'} className={formData.calendarUrl ? 'text-green-600' : 'text-yellow-600'}>
                                {formData.calendarUrl ? 'Connected' : 'Not Connected'}
                            </Badge>
                        </div>
                        <div className="space-y-2 pl-13">
                            <Label htmlFor="calendarUrl">Booking URL</Label>
                            <Input
                                id="calendarUrl"
                                placeholder="https://cal.com/your-company/consultation"
                                value={formData.calendarUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, calendarUrl: e.target.value }))}
                            />
                            <p className="text-xs text-[#9E9E9E]">
                                AI will send this link to leads when booking appointments
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Branding */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Branding
                    </CardTitle>
                    <CardDescription>Customize your landing page appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primaryColor">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primaryColor"
                                    type="color"
                                    className="w-16 h-10 p-1"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                />
                                <Input
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accentColor">Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="accentColor"
                                    type="color"
                                    className="w-16 h-10 p-1"
                                    value={formData.accentColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                                />
                                <Input
                                    value={formData.accentColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TCPA Consent */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        TCPA Consent Language
                    </CardTitle>
                    <CardDescription>
                        2026 compliant consent text shown on all landing pages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-sm">
                        By submitting, you consent to receive calls and texts from{' '}
                        <span className="font-semibold">{formData.companyName || '{companyName}'}</span>, including those using{' '}
                        <span className="font-semibold text-red-600">AI-generated or prerecorded voices</span>,
                        for marketing purposes. Message and data rates may apply. You can revoke consent at any time.
                    </div>
                    <p className="text-xs text-[#666666]">
                        ⚠️ This language is required for 2026 TCPA/FCC compliance. AI disclosure is mandatory.
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pb-8">
                {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Saved successfully
                    </div>
                )}
                <Button size="lg" onClick={handleSave} disabled={isSaving} className="btn-primary">
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
    );
}
