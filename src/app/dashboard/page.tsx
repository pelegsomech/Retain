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
    Activity
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

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    SMS_SENT: 'bg-yellow-100 text-yellow-800',
    CLAIMED: 'bg-green-100 text-green-800',
    AI_CALLING: 'bg-purple-100 text-purple-800',
    BOOKED: 'bg-emerald-100 text-emerald-800',
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch tenant info
            const tenantRes = await fetch('/api/tenants');
            const tenantData = tenantRes.ok ? await tenantRes.json() : null;

            // Fetch recent leads
            const leadsRes = await fetch('/api/leads?limit=5');
            const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [], total: 0 };

            // Fetch analytics overview
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold">
                    Welcome back{data?.tenant?.companyName ? `, ${data.tenant.companyName}` : ''}! 👋
                </h1>
                <p className="text-muted-foreground">
                    Here's what's happening with your leads today
                </p>
            </div>

            {/* Live Activity Banner */}
            {(data?.stats.pendingClaims || 0) > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center animate-pulse">
                                    <Activity className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-yellow-800">
                                        {data?.stats.pendingClaims} lead{(data?.stats.pendingClaims || 0) > 1 ? 's' : ''} waiting to be claimed!
                                    </div>
                                    <div className="text-sm text-yellow-700">
                                        Claim now before AI takes over
                                    </div>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href="/dashboard/leads?status=SMS_SENT">
                                    View Leads
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{data?.stats.totalLeads || 0}</div>
                                <div className="text-sm text-muted-foreground">Total Leads</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">+{data?.stats.leadsToday || 0}</div>
                                <div className="text-sm text-muted-foreground">Today</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Zap className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">
                                    {data?.stats.avgSpeedToLead ? `${data.stats.avgSpeedToLead}s` : '--'}
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Speed</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{data?.stats.bookedToday || 0}</div>
                                <div className="text-sm text-muted-foreground">Booked</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Recent Leads */}
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Leads</CardTitle>
                            <CardDescription>Latest form submissions</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/leads">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!data?.recentLeads?.length ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No leads yet. Create a landing page to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.recentLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {lead.firstName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {lead.claimedBy && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    {lead.claimedBy === 'human' ? (
                                                        <UserCheck className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Bot className="h-4 w-4 text-purple-600" />
                                                    )}
                                                </div>
                                            )}
                                            <Badge className={STATUS_COLORS[lead.status] || 'bg-gray-100'}>
                                                {lead.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {formatTimeAgo(lead.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/landers">
                                <FileText className="mr-2 h-4 w-4" />
                                Create Landing Page
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/leads">
                                <Users className="mr-2 h-4 w-4" />
                                View All Leads
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/calls">
                                <Bot className="mr-2 h-4 w-4" />
                                AI Call History
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/analytics">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                View Analytics
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/settings">
                                <Clock className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* AI Status */}
            {(data?.stats.aiCalling || 0) > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-purple-600 animate-pulse" />
                            </div>
                            <div>
                                <div className="font-medium text-purple-800">
                                    AI is calling {data?.stats.aiCalling} lead{(data?.stats.aiCalling || 0) > 1 ? 's' : ''} right now
                                </div>
                                <div className="text-sm text-purple-700">
                                    View call progress in the Calls dashboard
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
