'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useOrganizationList } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2, CheckCircle } from 'lucide-react';

const NICHES = [
    { value: 'roofing', label: 'Roofing' },
    { value: 'decking', label: 'Decking & Patios' },
    { value: 'siding', label: 'Siding' },
    { value: 'windows', label: 'Windows & Doors' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'painting', label: 'Painting' },
    { value: 'remodeling', label: 'General Remodeling' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useUser();
    const { createOrganization, setActive } = useOrganizationList();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        niche: '',
        phone: '',
        primaryColor: '#2563eb',
    });

    const handleNext = async () => {
        if (step === 1 && formData.companyName && formData.niche) {
            setStep(2);
        } else if (step === 2) {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!createOrganization || !formData.companyName) return;

        setIsSubmitting(true);

        try {
            // 1. Create Clerk organization
            const org = await createOrganization({
                name: formData.companyName,
            });

            // 2. Set as active organization
            if (setActive) {
                await setActive({ organization: org.id });
            }

            // 3. Create tenant in our database
            const response = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clerkOrgId: org.id,
                    companyName: formData.companyName,
                    niche: formData.niche,
                    phone: formData.phone,
                    primaryColor: formData.primaryColor,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create tenant');
            }

            // 4. Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Onboarding failed:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Tell us about your business"
                            : "Almost done! Just a few more details"
                        }
                    </CardDescription>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        <div className="w-8 h-0.5 bg-gray-300">
                            <div className={`h-full bg-blue-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
                        </div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    placeholder="Elite Roofing Co"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="niche">Industry *</Label>
                                <Select
                                    value={formData.niche}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NICHES.map(niche => (
                                            <SelectItem key={niche.value} value={niche.value}>
                                                {niche.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Business Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Brand Color</Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="color"
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

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800">You&apos;re almost ready!</p>
                                    <p className="text-sm text-green-700">
                                        After setup, you&apos;ll be able to create landing pages and start capturing leads immediately.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting || (step === 1 && (!formData.companyName || !formData.niche))}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : step === 2 ? (
                                'Complete Setup'
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
