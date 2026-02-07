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
    useSidebar,
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
    Menu,
} from "lucide-react";
import Link from "next/link";

const mainNav = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads" },
    { title: "Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function DashboardHeader() {
    const { isMobile, toggleSidebar } = useSidebar();

    return (
        <header className="header justify-between">
            <div className="flex items-center gap-2">
                {isMobile && (
                    <button className="btn-icon md:hidden" onClick={toggleSidebar}>
                        <Menu className="w-[18px] h-[18px]" style={{ strokeWidth: 1.75 }} />
                    </button>
                )}
                <div className="search-input">
                    <Search />
                    <input placeholder="Search leads, pages..." />
                </div>
            </div>

            <div className="flex items-center gap-1.5">
                <button className="btn-icon">
                    <Bell className="w-[16px] h-[16px]" style={{ strokeWidth: 1.75 }} />
                </button>
                <button className="btn-primary">
                    <Plus className="w-[15px] h-[15px]" style={{ strokeWidth: 2 }} />
                    <span className="hidden sm:inline">New Lead</span>
                </button>
            </div>
        </header>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <Sidebar
                    collapsible="icon"
                    className="border-r"
                    style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
                >
                    <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
                        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                            <Link href="/dashboard" className="block group-data-[collapsible=icon]:hidden">
                                <span className="text-[1.125rem] font-semibold text-foreground" style={{ letterSpacing: '-0.025em' }}>
                                    RETAIN
                                </span>
                                <span className="block text-[0.6875rem] mt-0.5" style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>
                                    Lead Platform
                                </span>
                            </Link>
                            <SidebarTrigger
                                className="btn-icon"
                                style={{ color: 'var(--muted-foreground)', width: 28, height: 28 }}
                            />
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup className="px-2 group-data-[collapsible=icon]:px-1.5">
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-0.5">
                                    {mainNav.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.title}
                                                    className={`
                                                        nav-item-btn
                                                        ${isActive ? 'nav-item-btn-active' : ''}
                                                    `}
                                                >
                                                    <Link href={item.href}>
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

                    <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
                            <div className="member-avatar member-avatar-black">PS</div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <div className="member-name">Peleg S.</div>
                                <div className="member-role">Owner</div>
                            </div>
                            <LogOut className="w-[15px] h-[15px] cursor-pointer group-data-[collapsible=icon]:hidden" style={{ color: 'var(--muted-foreground)', strokeWidth: 1.75 }} />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col min-h-screen min-w-0">
                    <DashboardHeader />
                    <div className="flex-1 p-4 md:p-5 bg-background overflow-x-hidden">
                        <div className="animate-fade-in max-w-[1400px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
