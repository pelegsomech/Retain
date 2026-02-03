import { notFound, redirect } from 'next/navigation';
import { processClaimClick } from '@/lib/escalation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Phone, Clock } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) {
        notFound();
    }

    const result = await processClaimClick(token);

    if (result.success) {
        // Successfully claimed - show success page
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">Lead Claimed!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            You&apos;ve successfully claimed this lead. The AI will not call them.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-center gap-2 font-semibold">
                                <Phone className="h-4 w-4" />
                                Call them now!
                            </div>
                            <p className="text-sm text-gray-500">
                                Speed to contact is key. The faster you call, the higher your close rate.
                            </p>
                        </div>

                        <Link href="/dashboard/leads">
                            <Button className="w-full">
                                View Lead Details →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Failed to claim - show error page
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
            <Card className="max-w-md w-full shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {result.error?.includes('expired') ? (
                            <Clock className="h-8 w-8 text-red-600" />
                        ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                        )}
                    </div>
                    <CardTitle className="text-2xl text-red-800">
                        {result.error?.includes('expired') ? 'Link Expired' : 'Already Claimed'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        {result.error?.includes('expired') ? (
                            <>The claim window has closed. Our AI has already contacted this lead.</>
                        ) : (
                            <>This lead has already been claimed or processed.</>
                        )}
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            💡 <strong>Tip:</strong> Claims are valid for 60 seconds. Next time, act faster!
                        </p>
                    </div>

                    <Link href="/dashboard/leads">
                        <Button variant="outline" className="w-full">
                            View All Leads
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

export async function generateMetadata() {
    return {
        title: 'Claim Lead | RETAIN',
        description: 'Claim this lead before the AI calls them',
    };
}
