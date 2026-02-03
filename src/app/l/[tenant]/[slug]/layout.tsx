export default function LandingPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Landing pages don't use the dashboard layout
    // They're standalone pages with their own branding
    return <>{children}</>;
}
