export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="onboarding-bg">
            {/* Minimal top bar — just the brand */}
            <div
                className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
                style={{ background: 'transparent' }}
            >
                <span
                    className="font-semibold"
                    style={{
                        fontSize: '1rem',
                        letterSpacing: '-0.025em',
                        color: 'var(--foreground)',
                        opacity: 0.7,
                    }}
                >
                    RETAIN
                </span>
            </div>

            {children}
        </div>
    );
}
