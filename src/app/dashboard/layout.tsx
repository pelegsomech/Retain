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
    Plus,
    Search,
    SlidersHorizontal,
    User,
    LogOut,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const mainNav = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: Users, href: "/dashboard/leads", count: 0 },
    { title: "Landing Pages", icon: FileText, href: "/dashboard/landers" },
    { title: "AI Calls", icon: Phone, href: "/dashboard/calls" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Team members (simulated - would come from Clerk in production)
const teamMembers = [
    { name: "Sandra Perry", role: "Property Manager", avatar: "SP", color: "avatar-teal" },
    { name: "Alex Johnson", role: "Sales Lead", avatar: "AJ", color: "avatar-amber" },
    { name: "Maria Garcia", role: "Marketing", avatar: "MG", color: "avatar-purple" },
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
                {/* Premium Sidebar - Pure white like BizLink */}
                <Sidebar className="border-r border-border bg-white">
                    <SidebarHeader className="px-4 py-5">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-xl font-bold text-foreground tracking-tight">RETAIN</span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-2">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {mainNav.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`
                                                        h-10 px-3 rounded-lg font-medium transition-all duration-150
                                                        ${isActive
                                                            ? 'bg-accent text-foreground'
                                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                        }
                                                    `}
                                                >
                                                    <Link href={item.href} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <item.icon className="h-[18px] w-[18px]" />
                                                            <span className="text-[0.9375rem]">{item.title}</span>
                                                        </div>
                                                        {item.count !== undefined && item.count > 0 && (
                                                            <span className="text-xs font-medium text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                                                                {item.count}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Team Section - Like BizLink Members */}
                        <div className="sidebar-section">Team</div>
                        <div className="px-1 space-y-0.5">
                            {teamMembers.map((member) => (
                                <div key={member.name} className="member-row">
                                    <div className={`avatar-gradient ${member.color}`}>
                                        {member.avatar}
                                    </div>
                                    <div className="member-info">
                                        <div className="member-name">{member.name}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                            <button className="member-row w-full text-left group">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary transition-colors">
                                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                    Invite Member
                                </span>
                            </button>
                        </div>
                    </SidebarContent>

                    <SidebarFooter className="p-3 mt-auto border-t border-border">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <div className="avatar-gradient avatar-blue">PS</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Peleg S.</p>
                                <p className="text-xs text-muted-foreground truncate">Owner</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Clean Header - Like BizLink */}
                    <header className="sticky top-0 z-30 h-16 bg-white border-b border-border">
                        <div className="flex h-full items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

                                {/* Search bar */}
                                <div className="search-bar w-80">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <input placeholder="Search leads, pages..." />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="toolbar-btn">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filters
                                </button>
                                <button className="toolbar-btn">
                                    <User className="h-4 w-4" />
                                    Me
                                </button>
                                <button className="btn-primary">
                                    <Plus className="h-4 w-4" />
                                    Add Lead
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-6">
                        <div className="animate-fade-in">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
