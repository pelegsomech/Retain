'use client';

import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
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
    Phone,
    FileText,
    BarChart3,
    Settings,
    Plus,
    Search,
    Bell,
    LogOut,
} from "lucide-react";
import Link from "next/link";

// RETAIN Navigation - Contractor CRM focused
const mainNav = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads" },
    { title: "Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                {/* Sidebar - 240px, clean white */}
                <Sidebar className="w-[240px] bg-[#FAFAFA] border-r border-[#EEEEEE]">
                    <SidebarHeader className="px-4 py-6">
                        <Link href="/dashboard" className="block">
                            <span className="text-xl font-bold text-foreground tracking-tight">
                                RETAIN
                            </span>
                            <span className="block text-xs text-[#9E9E9E] mt-0.5">
                                Lead Platform
                            </span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* Main Navigation */}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {mainNav.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton asChild className="h-auto p-0 bg-transparent hover:bg-transparent">
                                                    <Link
                                                        href={item.href}
                                                        className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                                                    >
                                                        <item.icon className="nav-item-icon" />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-[#EEEEEE]">
                        <div className="member-item py-3">
                            <div className="member-avatar member-avatar-black">PS</div>
                            <div className="flex-1 min-w-0">
                                <div className="member-name">Peleg S.</div>
                                <div className="member-role">Owner</div>
                            </div>
                            <LogOut className="w-4 h-4 text-[#9E9E9E] cursor-pointer hover:text-foreground" />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Header - 64px */}
                    <header className="header justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-[#666666] hover:text-foreground -ml-2" />

                            {/* Search */}
                            <div className="search-input">
                                <Search />
                                <input placeholder="Search leads, pages..." />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="btn-icon">
                                <Bell className="w-4 h-4" />
                            </button>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                New Lead
                            </button>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-6 bg-background">
                        <div className="animate-fade-in max-w-[1440px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
