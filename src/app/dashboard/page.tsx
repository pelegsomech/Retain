'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Users,
    Clock,
    Bot,
    UserCheck,
    Calendar,
    Zap,
    ArrowRight,
    Phone,
    FileText,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Sparkles
} from "lucide-react";

interface DashboardData {
    tenant: {
        companyName: string;
        niche: string;
    };
    stats: {
        totalLeads: number;
        leadsToday: number;
        pendingClaims: number;
        aiCalling: number;
        bookedToday: number;
        avgSpeedToLead: number;
    };
    recentLeads: Array<{
        id: string;
        firstName: string;
        lastName: string | null;
        phone: string;
        status: string;
        claimedBy: string | null;
        createdAt: string;
    }>;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    NEW: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    SMS_SENT: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    CLAIMED: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    AI_CALLING: { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
    BOOKED: { color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const tenantRes = await fetch('/api/tenants');
            const tenantData = tenantRes.ok ? await tenantRes.json() : null;

            const leadsRes = await fetch('/api/leads?limit=5');
            const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [], total: 0 };

            const analyticsRes = await fetch('/api/analytics');
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

            setData({
                tenant: tenantData?.tenant || { companyName: 'Your Company', niche: 'construction' },
                stats: {
                    totalLeads: analyticsData?.overview?.totalLeads || 0,
                    leadsToday: analyticsData?.overview?.leadsToday || 0,
                    pendingClaims: leadsData.leads.filter((l: { status: string }) => l.status === 'SMS_SENT').length,
                    aiCalling: leadsData.leads.filter((l: { status: string }) => l.status === 'AI_CALLING').length,
                    bookedToday: analyticsData?.overview?.bookedLeads || 0,
                    avgSpeedToLead: analyticsData?.overview?.avgSpeedToLead || 0,
                },
                recentLeads: leadsData.leads.slice(0, 5),
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffMs / 86400000)}d ago`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Welcome Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back{data?.tenant?.companyName && data.tenant.companyName !== 'Your Company' ? `, ${data.tenant.companyName}` : ''}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your leads today
                    </p>
                </div>
                <Button className="shadow-sm" asChild>
                    <Link href="/dashboard/landers">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Landing Page
                    </Link>
                </Button>
            </div>

            {/* Live Activity Banner */}
            {(data?.stats.pendingClaims || 0) > 0 && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg animate-slide-up">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <Activity className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                                <div className="font-semibold text-lg">
                                    {data?.stats.pendingClaims} lead{(data?.stats.pendingClaims || 0) > 1 ? 's' : ''} waiting to be claimed!
                                </div>
                                <div className="text-white/80 text-sm">
                                    Claim now before AI takes over
                                </div>
                            </div>
                        </div>
                        <Button variant="secondary" className="bg-white text-orange-600 hover:bg-white/90 shadow-md" asChild>
                            <Link href="/dashboard/leads?status=SMS_SENT">
                                View Leads
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-5">
                <Card className="stat-card group">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                                <p className="text-3xl font-bold mt-1 tracking-tight">{data?.stats.totalLeads || 0}</p>
                            </div>
                            <div className="icon-container-primary group-hover:scale-110 transition-transform">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
                            <span className="text-emerald-600 font-medium">All time</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="stat-card group">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Today</p>
                                <p className="text-3xl font-bold mt-1 tracking-tight">+{data?.stats.leadsToday || 0}</p>
                            </div>
                            <div className="icon-container-success group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>New leads today</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="stat-card group">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Speed</p>
                                <p className="text-3xl font-bold mt-1 tracking-tight">
                                    {data?.stats.avgSpeedToLead ? `${data.stats.avgSpeedToLead}s` : '—'}
                                </p>
                            </div>
                            <div className="icon-container-warning group-hover:scale-110 transition-transform">
                                <Zap className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                            <span>Time to first contact</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="stat-card group">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Booked</p>
                                <p className="text-3xl font-bold mt-1 tracking-tight">{data?.stats.bookedToday || 0}</p>
                            </div>
                            <div className="icon-container-primary group-hover:scale-110 transition-transform">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                            <span>Appointments scheduled</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Recent Leads */}
                <Card className="col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg">Recent Leads</CardTitle>
                            <CardDescription>Latest form submissions</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/dashboard/leads">
                                View All
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!data?.recentLeads?.length ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground mb-4">No leads yet. Create a landing page to get started!</p>
                                <Button variant="outline" asChild>
                                    <Link href="/dashboard/landers">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Create Page
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.recentLeads.map((lead) => {
                                    const statusConfig = STATUS_CONFIG[lead.status] || { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-100' };
                                    return (
                                        <div
                                            key={lead.id}
                                            className="item-row"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm">
                                                    {lead.firstName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                        <Phone className="h-3 w-3" />
                                                        {lead.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {lead.claimedBy && (
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        {lead.claimedBy === 'human' ? (
                                                            <>
                                                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-emerald-600 font-medium">Human</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bot className="h-4 w-4 text-violet-600" />
                                                                <span className="text-violet-600 font-medium">AI</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className={`${statusConfig.bg} ${statusConfig.color} border font-medium`}
                                                >
                                                    {lead.status.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground tabular-nums">
                                                    {formatTimeAgo(lead.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {[
                            { icon: FileText, label: 'Create Landing Page', href: '/dashboard/landers', color: 'text-blue-600' },
                            { icon: Users, label: 'View All Leads', href: '/dashboard/leads', color: 'text-emerald-600' },
                            { icon: Bot, label: 'AI Call History', href: '/dashboard/calls', color: 'text-violet-600' },
                            { icon: TrendingUp, label: 'View Analytics', href: '/dashboard/analytics', color: 'text-amber-600' },
                            { icon: Clock, label: 'Settings', href: '/dashboard/settings', color: 'text-gray-600' },
                        ].map((action) => (
                            <Button
                                key={action.href}
                                className="w-full justify-start h-12 px-4 font-medium"
                                variant="ghost"
                                asChild
                            >
                                <Link href={action.href}>
                                    <action.icon className={`mr-3 h-5 w-5 ${action.color}`} />
                                    {action.label}
                                </Link>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* AI Status */}
            {(data?.stats.aiCalling || 0) > 0 && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white shadow-lg">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Bot className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="font-semibold text-lg">
                                AI is calling {data?.stats.aiCalling} lead{(data?.stats.aiCalling || 0) > 1 ? 's' : ''} right now
                            </div>
                            <div className="text-white/80 text-sm">
                                View call progress in the Calls dashboard
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
