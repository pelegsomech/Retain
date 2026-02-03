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
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    BarChart3,
    Phone,
    Zap
} from "lucide-react";
import Link from "next/link";

// Force dynamic rendering - Clerk requires runtime env vars
export const dynamic = 'force-dynamic';

const sidebarItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads" },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

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
                        <div className="flex items-center gap-3">
                            <UserButton afterSignOutUrl="/" />
                            <span className="text-sm text-muted-foreground">Account</span>
                        </div>
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
