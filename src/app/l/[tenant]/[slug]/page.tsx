import { notFound } from 'next/navigation';
import { LeadCaptureForm } from '@/components/lander/lead-form';
import { Zap, Shield, Clock, Star } from 'lucide-react';

// Demo tenant data - In production, this would come from DB
const DEMO_TENANTS: Record<string, {
    id: string;
    companyName: string;
    niche: string;
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
    consentText: string;
}> = {
    'demo-roofing': {
        id: 'demo-tenant-1',
        companyName: 'Elite Roofing Co',
        niche: 'roofing',
        primaryColor: '#dc2626',
        accentColor: '#991b1b',
        consentText: 'By submitting, you consent to receive calls and texts from Elite Roofing Co, including those using AI-generated or prerecorded voices, for marketing purposes. You can revoke consent anytime.',
    },
    'demo-decking': {
        id: 'demo-tenant-2',
        companyName: 'Premier Deck Builders',
        niche: 'decking',
        primaryColor: '#16a34a',
        accentColor: '#15803d',
        consentText: 'By submitting, you consent to receive calls and texts from Premier Deck Builders, including those using AI-generated or prerecorded voices, for marketing purposes. You can revoke consent anytime.',
    },
};

const DEMO_PAGES: Record<string, {
    id: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    heroImageUrl?: string;
    formFields: Array<{ name: string; type: 'text' | 'tel' | 'email'; label: string; required: boolean; placeholder?: string }>;
}> = {
    'free-quote': {
        id: 'demo-page-1',
        headline: 'Get Your Free Quote Today',
        subheadline: 'Professional service with a satisfaction guarantee. Request your free estimate in 60 seconds.',
        ctaText: 'Get My Free Quote →',
        formFields: [
            { name: 'firstName', type: 'text', label: 'First Name', required: true, placeholder: 'John' },
            { name: 'lastName', type: 'text', label: 'Last Name', required: false, placeholder: 'Smith' },
            { name: 'phone', type: 'tel', label: 'Phone Number', required: true, placeholder: '(555) 123-4567' },
            { name: 'email', type: 'email', label: 'Email (optional)', required: false, placeholder: 'john@example.com' },
        ],
    },
    'spring-special': {
        id: 'demo-page-2',
        headline: 'Spring Special: 20% Off',
        subheadline: 'Limited time offer! Book now and save on your next project.',
        ctaText: 'Claim My Discount →',
        formFields: [
            { name: 'firstName', type: 'text', label: 'Your Name', required: true, placeholder: 'Your name' },
            { name: 'phone', type: 'tel', label: 'Best Phone Number', required: true, placeholder: '(555) 123-4567' },
        ],
    },
};

interface PageProps {
    params: Promise<{ tenant: string; slug: string }>;
}

export default async function LandingPage({ params }: PageProps) {
    const { tenant: tenantSlug, slug: pageSlug } = await params;

    // In production, fetch from DB
    const tenant = DEMO_TENANTS[tenantSlug];
    const page = DEMO_PAGES[pageSlug];

    if (!tenant || !page) {
        notFound();
    }

    const trustBadges = [
        { icon: Shield, text: 'Licensed & Insured' },
        { icon: Clock, text: 'Fast Response' },
        { icon: Star, text: '5-Star Reviews' },
    ];

    return (
        <div
            className="min-h-screen"
            style={{
                background: `linear-gradient(135deg, ${tenant.primaryColor}10 0%, white 50%, ${tenant.accentColor}10 100%)`
            }}
        >
            {/* Header */}
            <header className="py-4 px-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6" style={{ color: tenant.primaryColor }} />
                    <span className="font-bold text-xl">{tenant.companyName}</span>
                </div>
                <a
                    href="tel:+15551234567"
                    className="text-sm font-medium hover:underline"
                    style={{ color: tenant.primaryColor }}
                >
                    Call Now: (555) 123-4567
                </a>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left - Content */}
                    <div className="text-center lg:text-left">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-6"
                            style={{
                                backgroundColor: `${tenant.primaryColor}15`,
                                color: tenant.primaryColor
                            }}
                        >
                            {tenant.niche.charAt(0).toUpperCase() + tenant.niche.slice(1)} Specialists
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {page.headline}
                        </h1>

                        <p className="text-xl text-gray-600 mb-8">
                            {page.subheadline}
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            {trustBadges.map((badge, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-600">
                                    <badge.icon className="h-5 w-5" style={{ color: tenant.primaryColor }} />
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
                            fields={page.formFields}
                            ctaText={page.ctaText}
                            consentText={tenant.consentText}
                            primaryColor={tenant.primaryColor}
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
    const tenant = DEMO_TENANTS[tenantSlug];
    const page = DEMO_PAGES[pageSlug];

    if (!tenant || !page) {
        return { title: 'Page Not Found' };
    }

    return {
        title: `${page.headline} | ${tenant.companyName}`,
        description: page.subheadline,
    };
}
