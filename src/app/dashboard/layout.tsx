'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    BarChart3,
    Phone,
    Zap,
    User
} from "lucide-react";
import Link from "next/link";

const sidebarItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads" },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Conditional Clerk import - only use if configured
function AccountButton() {
    const hasClerk = typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (hasClerk) {
        // Dynamic import would go here if Clerk is configured
        // For now, show placeholder
    }

    return (
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">Account</span>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">RETAIN</span>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Menu</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {sidebarItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild>
                                                <Link href={item.href}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter className="border-t p-4">
                        <AccountButton />
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                        <SidebarTrigger />
                        <div className="flex-1" />
                    </header>
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
