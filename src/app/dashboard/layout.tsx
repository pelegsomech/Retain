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
    FileText,
    Settings,
    BarChart3,
    Phone,
    Sparkles,
    LogOut,
    Bell,
    Search,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sidebarItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads" },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "AI Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
];

const bottomItems = [
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
                {/* Premium Sidebar */}
                <Sidebar className="border-r border-sidebar-border/60">
                    <SidebarHeader className="px-5 py-5">
                        <Link href="/dashboard" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <span className="font-bold text-lg tracking-tight">RETAIN</span>
                                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                    Lead Platform
                                </span>
                            </div>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-3">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {sidebarItems.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`
                                                        h-11 px-3.5 rounded-lg font-medium transition-all duration-200
                                                        ${isActive
                                                            ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-sm'
                                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                        }
                                                    `}
                                                >
                                                    <Link href={item.href} className="flex items-center gap-3">
                                                        <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : ''}`} />
                                                        <span className="text-sm">{item.title}</span>
                                                        {isActive && (
                                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="px-3 pb-4 mt-auto">
                        <div className="divider mb-4" />
                        <SidebarMenu className="space-y-1">
                            {bottomItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className={`
                                                h-11 px-3.5 rounded-lg font-medium transition-all duration-200
                                                ${isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                }
                                            `}
                                        >
                                            <Link href={item.href} className="flex items-center gap-3">
                                                <item.icon className="h-[18px] w-[18px]" />
                                                <span className="text-sm">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>

                        {/* Account Section */}
                        <div className="mt-4 p-3 rounded-xl bg-accent/50 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm">
                                    P
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Peleg S.</p>
                                    <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Premium Header */}
                    <header className="sticky top-0 z-30 h-16 border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
                        <div className="flex h-full items-center gap-4 px-6">
                            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search leads, pages..."
                                        className="pl-9 h-10 bg-accent/50 border-border/50 focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Notifications */}
                                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-foreground">
                                    <Bell className="h-[18px] w-[18px]" />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                                </Button>

                                {/* Quick Action */}
                                <Button size="sm" className="h-10 px-4 font-medium shadow-sm">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    New Lead
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-8 bg-accent/20">
                        <div className="animate-fade-in">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
