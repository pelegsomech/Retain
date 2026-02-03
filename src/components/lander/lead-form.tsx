'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Phone, Mail, MapPin, User } from 'lucide-react';

interface FormField {
    name: string;
    type: 'text' | 'tel' | 'email' | 'textarea';
    label: string;
    required: boolean;
    placeholder?: string;
}

interface LeadFormProps {
    tenantId: string;
    landingPageId: string;
    fields: FormField[];
    ctaText: string;
    consentText: string;
    primaryColor: string;
    onSuccess?: () => void;
}

export function LeadCaptureForm({
    tenantId,
    landingPageId,
    fields,
    ctaText,
    consentText,
    primaryColor,
    onSuccess,
}: LeadFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Get UTM params from URL
        const urlParams = new URLSearchParams(window.location.search);

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tenantId,
                    landingPageId,
                    consentText: consentText.replace('{companyName}', 'the company'),
                    utmSource: urlParams.get('utm_source'),
                    utmMedium: urlParams.get('utm_medium'),
                    utmCampaign: urlParams.get('utm_campaign'),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit');
            }

            setIsSuccess(true);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-8 pb-8 text-center">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${primaryColor}20` }}
                    >
                        <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                    <p className="text-muted-foreground">
                        We&apos;ve received your request. Someone will contact you shortly.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'tel': return <Phone className="h-4 w-4 text-muted-foreground" />;
            case 'email': return <Mail className="h-4 w-4 text-muted-foreground" />;
            default: return <User className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    {getIcon(field.type)}
                                </div>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type === 'textarea' ? 'text' : field.type}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="pl-10"
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [field.name]: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                    ))}

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-semibold"
                        style={{ backgroundColor: primaryColor }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            ctaText
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        {consentText}
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
