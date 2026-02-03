'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Phone, Mail, Palette, Bot, Calendar, Shield } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and integrations</p>
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
                            <Input id="companyName" defaultValue="Elite Roofing Co" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Business Phone</Label>
                            <Input id="phone" defaultValue="(555) 123-4567" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Contact Email</Label>
                        <Input id="email" type="email" defaultValue="contact@eliteroofing.com" />
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
                                <Input id="primaryColor" defaultValue="#dc2626" />
                                <div className="w-10 h-10 rounded-md bg-red-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accentColor">Accent Color</Label>
                            <div className="flex gap-2">
                                <Input id="accentColor" defaultValue="#991b1b" />
                                <div className="w-10 h-10 rounded-md bg-red-800" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            Drag & drop your logo here, or click to upload
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
                    <CardDescription>Connect your external services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Twilio */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Phone className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <div className="font-medium">Twilio</div>
                                <div className="text-sm text-muted-foreground">SMS notifications</div>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">Not Connected</Badge>
                    </div>

                    <Separator />

                    {/* Retell */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium">Retell.ai</div>
                                <div className="text-sm text-muted-foreground">AI voice agent</div>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">Not Connected</Badge>
                    </div>

                    <Separator />

                    {/* Calendar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="font-medium">Cal.com / GoHighLevel</div>
                                <div className="text-sm text-muted-foreground">Appointment booking</div>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">Not Connected</Badge>
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
                        <span className="font-semibold">{'{companyName}'}</span>, including those using{' '}
                        <span className="font-semibold text-red-600">AI-generated or prerecorded voices</span>,
                        for marketing purposes. Message and data rates may apply. You can revoke consent at any time.
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ⚠️ This language is required for 2026 TCPA compliance. AI disclosure is mandatory.
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button size="lg">Save Changes</Button>
            </div>
        </div>
    );
}
