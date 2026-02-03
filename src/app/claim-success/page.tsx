export default function ClaimSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Lead Claimed!
                </h1>
                <p className="text-gray-600 mb-6">
                    You&apos;ve successfully claimed this lead. The AI handoff has been cancelled.
                </p>
                <p className="text-sm text-gray-500">
                    Call the lead now to maximize your chances of booking.
                </p>
            </div>
        </div>
    );
}
