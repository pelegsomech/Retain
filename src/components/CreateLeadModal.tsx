'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

interface CreateLeadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateLeadModal({ open, onOpenChange, onSuccess }: CreateLeadModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const formatPhone = (value: string) => {
        // Strip non-digits
        const digits = value.replace(/\D/g, '');
        // Add + prefix if starts with 1 (US) and has enough digits
        if (digits.length >= 10) {
            return '+' + (digits.startsWith('1') ? digits : '1' + digits);
        }
        return value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Format phone for API
            const formattedPhone = formatPhone(formData.phone);

            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    phone: formattedPhone,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create lead');
            }

            // Reset form and close modal
            setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                zip: '',
            });
            onOpenChange(false);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New Lead
                    </DialogTitle>
                    <DialogDescription>
                        Manually add a lead to your pipeline
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(555) 123-4567"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="123 Main Street"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Austin"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="TX"
                                maxLength={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zip">ZIP</Label>
                            <Input
                                id="zip"
                                name="zip"
                                value={formData.zip}
                                onChange={handleChange}
                                placeholder="78701"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Create Lead
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
