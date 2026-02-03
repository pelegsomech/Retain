'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ClaimErrorContent() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message') || 'An error occurred';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
            <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Claim Failed
                </h1>
                <p className="text-gray-600 mb-6">
                    {message}
                </p>
                <p className="text-sm text-gray-500">
                    The lead may have already been claimed or the link has expired.
                </p>
            </div>
        </div>
    );
}

export default function ClaimErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ClaimErrorContent />
        </Suspense>
    );
}
