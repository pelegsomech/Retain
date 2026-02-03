'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Phone, Palette, Bot, Calendar, Shield, Loader2, Save, CheckCircle } from "lucide-react";

interface Tenant {
    id: string;
    companyName: string;
    slug: string;
    niche: string;
    primaryColor: string;
    accentColor: string;
    twilioFromPhone: string | null;
    twilioSid: string | null;
    retellAgentId: string | null;
    calendarUrl: string | null;
    consentText: string;
    claimTimeoutSec: number;
}

export default function SettingsPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        primaryColor: '#2563eb',
        accentColor: '#1e40af',
        twilioFromPhone: '',
        twilioSid: '',
        twilioToken: '',
        retellAgentId: '',
        calendarUrl: '',
        claimTimeoutSec: 60,
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
                    primaryColor: data.tenant.primaryColor || '#2563eb',
                    accentColor: data.tenant.accentColor || '#1e40af',
                    twilioFromPhone: data.tenant.twilioFromPhone || '',
                    twilioSid: data.tenant.twilioSid || '',
                    twilioToken: '', // Don't expose token
                    retellAgentId: data.tenant.retellAgentId || '',
                    calendarUrl: data.tenant.calendarUrl || '',
                    claimTimeoutSec: data.tenant.claimTimeoutSec || 60,
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
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and integrations</p>
                </div>
                {tenant && (
                    <Badge variant="outline" className="text-sm">
                        Slug: {tenant.slug}
                    </Badge>
                )}
            </div>

            {/* Company Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                    </CardTitle>
                    <CardDescription>Your business details for landing pages and AI calls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Business Phone</Label>
                            <Input
                                id="phone"
                                value={formData.twilioFromPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, twilioFromPhone: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="claimTimeout">Claim Timeout (seconds)</Label>
                        <Input
                            id="claimTimeout"
                            type="number"
                            min={30}
                            max={300}
                            value={formData.claimTimeoutSec}
                            onChange={(e) => setFormData(prev => ({ ...prev, claimTimeoutSec: parseInt(e.target.value) || 60 }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Time contractors have to claim a lead before AI takes over (30-300 seconds)
                        </p>
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

            {/* Integrations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
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
                                <div className="text-sm text-muted-foreground">SMS notifications</div>
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
                        </div>
                    </div>

                    <Separator />

                    {/* Retell */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Retell.ai</div>
                                <div className="text-sm text-muted-foreground">AI voice agent</div>
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
                                <div className="text-sm text-muted-foreground">Cal.com or GoHighLevel</div>
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
                    <p className="text-xs text-muted-foreground">
                        ⚠️ This language is required for 2026 TCPA/FCC compliance. AI disclosure is mandatory.
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Saved successfully
                    </div>
                )}
                <Button size="lg" onClick={handleSave} disabled={isSaving}>
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
