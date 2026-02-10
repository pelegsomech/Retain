import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="auth-bg">
            <div className="flex flex-col items-center">
                {/* Brand */}
                <div className="mb-8 text-center fade-in-up">
                    <h1
                        className="text-2xl font-semibold"
                        style={{ letterSpacing: '-0.03em', color: 'var(--foreground)' }}
                    >
                        RETAIN
                    </h1>
                    <p
                        className="mt-1"
                        style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}
                    >
                        AI-powered lead management
                    </p>
                </div>

                <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "shadow-lg border border-border",
                                headerTitle: "text-foreground",
                                headerSubtitle: "text-muted-foreground",
                                socialButtonsBlockButton:
                                    "border-border hover:bg-muted transition-colors",
                                formButtonPrimary:
                                    "bg-foreground hover:bg-foreground/90 text-background",
                                footerActionLink: "text-foreground hover:text-foreground/80",
                            },
                            variables: {
                                borderRadius: '12px',
                                colorPrimary: '#18181B',
                                colorBackground: '#FFFFFF',
                                colorText: '#1A1A1A',
                                colorTextSecondary: '#78716C',
                                fontFamily: 'Inter, sans-serif',
                            },
                        }}
                        signUpUrl="/sign-up"
                    />
                </div>
            </div>
        </div>
    );
}
