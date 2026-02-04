import { notFound } from 'next/navigation';
import { LeadCaptureForm } from '@/components/lander/lead-form';
import { Zap, Shield, Clock, Star } from 'lucide-react';
import {
    collections,
    getTenantBySlug,
    type Tenant,
    type LanderPage,
} from '@/lib/firebase-admin';

interface PageProps {
    params: Promise<{ tenant: string; slug: string }>;
}

export default async function LandingPage({ params }: PageProps) {
    const { tenant: tenantSlug, slug: pageSlug } = await params;

    // Fetch tenant from Firestore
    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
        notFound();
    }

    // Fetch landing page from Firestore
    const pageSnapshot = await collections.landerPages
        .where('tenantId', '==', tenant.id)
        .where('slug', '==', pageSlug)
        .where('isActive', '==', true)
        .limit(1)
        .get();

    if (pageSnapshot.empty) {
        notFound();
    }

    const pageDoc = pageSnapshot.docs[0];
    const page = { id: pageDoc.id, ...pageDoc.data() } as LanderPage & {
        name?: string;
        subheadline?: string;
        ctaText?: string;
        formFields?: Array<{ name: string; type: 'text' | 'tel' | 'email'; label: string; required: boolean; placeholder?: string }>;
    };

    // Default form fields if not defined
    const formFields = page.formFields || [
        { name: 'firstName', type: 'text' as const, label: 'First Name', required: true, placeholder: 'John' },
        { name: 'lastName', type: 'text' as const, label: 'Last Name', required: false, placeholder: 'Smith' },
        { name: 'phone', type: 'tel' as const, label: 'Phone Number', required: true, placeholder: '(555) 123-4567' },
        { name: 'email', type: 'email' as const, label: 'Email (optional)', required: false, placeholder: 'john@example.com' },
    ];

    const trustBadges = [
        { icon: Shield, text: 'Licensed & Insured' },
        { icon: Clock, text: 'Fast Response' },
        { icon: Star, text: '5-Star Reviews' },
    ];

    const primaryColor = page.primaryColor || tenant.primaryColor || '#2563eb';

    return (
        <div
            className="min-h-screen"
            style={{
                background: `linear-gradient(135deg, ${primaryColor}10 0%, white 50%, ${tenant.accentColor || primaryColor}10 100%)`
            }}
        >
            {/* Header */}
            <header className="py-4 px-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6" style={{ color: primaryColor }} />
                    <span className="font-bold text-xl">{tenant.companyName}</span>
                </div>
                {tenant.twilioFromPhone && (
                    <a
                        href={`tel:${tenant.twilioFromPhone}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: primaryColor }}
                    >
                        Call Now: {tenant.twilioFromPhone}
                    </a>
                )}
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left - Content */}
                    <div className="text-center lg:text-left">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
                            style={{
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor
                            }}
                        >
                            {(tenant.contractorType || tenant.niche || 'Home Services').charAt(0).toUpperCase() +
                                (tenant.contractorType || tenant.niche || 'home services').slice(1)} Specialists
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {page.headline}
                        </h1>

                        <p className="text-xl text-gray-600 mb-8">
                            {page.subheadline || 'Get your free estimate today. Professional service guaranteed.'}
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            {trustBadges.map((badge, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-600">
                                    <badge.icon className="h-5 w-5" style={{ color: primaryColor }} />
                                    <span className="text-sm font-medium">{badge.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right - Form */}
                    <div className="lg:pl-8">
                        <LeadCaptureForm
                            tenantId={tenant.id}
                            landingPageId={page.id}
                            fields={formFields}
                            ctaText={page.ctaText || 'Get My Free Quote →'}
                            consentText={tenant.consentText || 'By submitting, you consent to receive calls and texts, including those using AI-generated voices, for marketing purposes.'}
                            primaryColor={primaryColor}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white/50">
                © {new Date().getFullYear()} {tenant.companyName}. All rights reserved.
            </footer>
        </div>
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { tenant: tenantSlug, slug: pageSlug } = await params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
        return { title: 'Page Not Found' };
    }

    const pageSnapshot = await collections.landerPages
        .where('tenantId', '==', tenant.id)
        .where('slug', '==', pageSlug)
        .limit(1)
        .get();

    if (pageSnapshot.empty) {
        return { title: 'Page Not Found' };
    }

    const page = pageSnapshot.docs[0].data() as LanderPage & { subheadline?: string };

    return {
        title: `${page.headline} | ${tenant.companyName}`,
        description: page.subheadline || 'Get your free estimate today',
    };
}
