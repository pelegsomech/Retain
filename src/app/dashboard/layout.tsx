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
    ListTodo,
    Activity,
    Users,
    Settings,
    Sparkles,
    TrendingUp,
    Target,
    BarChart3,
    Plus,
    Search,
    SlidersHorizontal,
    User,
    LogOut,
    ArrowUpDown,
} from "lucide-react";
import Link from "next/link";

// Main navigation - matches BizLink exactly
const mainNav = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Leads", icon: ListTodo, href: "/dashboard/leads", count: 2 },
    { title: "Activity", icon: Activity, href: "/dashboard/calls" },
    { title: "Pages", icon: Users, href: "/dashboard/landers" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Projects section
const projects = [
    { title: "Landing Pages", icon: Sparkles, count: 7 },
    { title: "Campaigns", icon: TrendingUp },
    { title: "Analytics", icon: BarChart3 },
    { title: "AI Calls", icon: Target },
];

// Team members with actual photos/gradients
const members = [
    { name: "Sandra Perry", role: "Property Manager", initials: "SP", color: "member-avatar-amber" },
    { name: "Antony Cardenas", role: "Sales Manager", initials: "AC", color: "member-avatar-purple" },
    { name: "Jamal Connolly", role: "Growth Marketer", initials: "JC", color: "member-avatar-teal" },
    { name: "Cara Carr", role: "SEO Specialist", initials: "CC", color: "member-avatar-rose" },
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
                {/* Sidebar - BizLink exact */}
                <Sidebar className="border-r border-border bg-white w-[240px]">
                    <SidebarHeader className="px-5 py-6">
                        <Link href="/dashboard" className="block">
                            <span className="text-[18px] font-semibold text-foreground tracking-tight">
                                RETAIN
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
                                                        {item.count !== undefined && (
                                                            <span className="nav-item-count">{item.count}</span>
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Projects Section */}
                        <div className="section-label">Projects</div>
                        <div>
                            {projects.map((project) => (
                                <div key={project.title} className="project-item">
                                    <project.icon className="project-icon" />
                                    <span>{project.title}</span>
                                    {project.count && (
                                        <span className="project-count">{project.count}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Members Section */}
                        <div className="section-label flex items-center justify-between pr-4">
                            <span>Members</span>
                            <Plus className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                        </div>
                        <div>
                            {members.map((member) => (
                                <div key={member.name} className="member-item">
                                    <div className={`member-avatar ${member.color}`}>
                                        {member.initials}
                                    </div>
                                    <div className="member-info">
                                        <div className="member-name">{member.name}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-border">
                        <div className="member-item py-3">
                            <div className="member-avatar member-avatar-blue">PS</div>
                            <div className="member-info">
                                <div className="member-name">Peleg S.</div>
                                <div className="member-role">Owner</div>
                            </div>
                            <LogOut className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Header - BizLink exact */}
                    <header className="sticky top-0 z-30 h-[72px] bg-white border-b border-border">
                        <div className="flex h-full items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-2" />

                                {/* Search */}
                                <div className="search-input">
                                    <Search />
                                    <input placeholder="Search customer..." />
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button className="toolbar-btn">
                                    <ArrowUpDown />
                                    Sort by
                                </button>
                                <button className="toolbar-btn">
                                    <SlidersHorizontal />
                                    Filters
                                </button>
                                <button className="toolbar-btn">
                                    <User />
                                    Me
                                </button>
                                <button className="btn-primary ml-2">
                                    <Plus />
                                    Add Lead
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-6 bg-background">
                        <div className="animate-fade-in">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
