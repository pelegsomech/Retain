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
    ArrowUpDown,
    LogOut,
} from "lucide-react";
import Link from "next/link";

// Main navigation
const mainNav = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Tasks", icon: ListTodo, href: "/dashboard/leads", count: 2 },
    { title: "Activity", icon: Activity, href: "/dashboard/calls" },
    { title: "Customers", icon: Users, href: "/dashboard/landers" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Projects section
const projects = [
    { title: "BizConnect", icon: Sparkles, count: 7 },
    { title: "Growth Hub", icon: TrendingUp },
    { title: "Conversion Path", icon: Target },
    { title: "Marketing", icon: BarChart3 },
];

// Team members
const members = [
    { name: "Sandra Perry", role: "Product Manager", initials: "SP", color: "member-avatar-amber" },
    { name: "Antony Cardenas", role: "Sales Manager", initials: "AC", color: "member-avatar-gray" },
    { name: "Jamal Connolly", role: "Growth Marketer", initials: "JC", color: "member-avatar-green" },
    { name: "Cara Carr", role: "SEO Specialist", initials: "CC", color: "member-avatar-blue" },
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
                {/* Sidebar - 240px, #FAFAFA */}
                <Sidebar className="w-[240px] bg-[#FAFAFA] border-r border-[#EEEEEE]">
                    <SidebarHeader className="px-4 py-6">
                        <Link href="/dashboard" className="block">
                            <span className="text-lg font-semibold text-foreground">
                                BizLink
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
                                <div key={project.title} className="nav-item">
                                    <project.icon className="nav-item-icon" />
                                    <span>{project.title}</span>
                                    {project.count && (
                                        <span className="nav-item-count">{project.count}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Members Section */}
                        <div className="section-label flex items-center justify-between pr-4">
                            <span>Members</span>
                            <Plus className="w-4 h-4 text-[#9E9E9E] cursor-pointer hover:text-foreground" />
                        </div>
                        <div>
                            {members.map((member) => (
                                <div key={member.name} className="member-item">
                                    <div className={`member-avatar ${member.color}`}>
                                        {member.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="member-name">{member.name}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-[#EEEEEE]">
                        <div className="member-item py-3">
                            <div className="member-avatar member-avatar-black">IL</div>
                            <div className="flex-1 min-w-0">
                                <div className="member-name">Iona Rollins</div>
                            </div>
                            <LogOut className="w-4 h-4 text-[#9E9E9E] cursor-pointer hover:text-foreground" />
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Header - 64px, white */}
                    <header className="header justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-[#666666] hover:text-foreground -ml-2" />

                            {/* Search */}
                            <div className="search-input">
                                <Search />
                                <input placeholder="Search customer..." />
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button className="btn-icon">
                                <ArrowUpDown className="w-4 h-4" />
                                Sort by
                            </button>
                            <button className="btn-icon">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </button>
                            <button className="btn-icon">
                                <Users className="w-4 h-4" />
                                Me
                            </button>
                            <button className="btn-primary ml-2">
                                <Plus className="w-4 h-4" />
                                Add customer
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
