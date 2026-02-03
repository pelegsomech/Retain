'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Phone,
    Calendar,
    TrendingUp,
    Clock,
    Bot,
    User,
    ArrowRight,
    FileText,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface Lead {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    status: string;
    claimedBy: string | null;
    createdAt: string;
    source?: string;
}

interface DashboardData {
    stats: {
        totalLeads: number;
        leadsToday: number;
        humanClaims: number;
        aiClaims: number;
        bookedCount: number;
        avgSpeedToLead: number;
    };
    recentLeads: Lead[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [leadsRes, analyticsRes] = await Promise.all([
                fetch('/api/leads?limit=10'),
                fetch('/api/analytics'),
            ]);

            const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [] };
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

            setData({
                stats: {
                    totalLeads: analyticsData?.overview?.totalLeads || 0,
                    leadsToday: analyticsData?.overview?.leadsToday || 0,
                    humanClaims: analyticsData?.overview?.humanClaims || 0,
                    aiClaims: analyticsData?.overview?.aiClaims || 0,
                    bookedCount: analyticsData?.overview?.bookedLeads || 0,
                    avgSpeedToLead: analyticsData?.overview?.avgSpeedToLead || 0,
                },
                recentLeads: leadsData.leads || [],
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        return `${Math.round(seconds / 60)}m`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            NEW: { label: 'New', color: 'bg-blue-100 text-blue-700' },
            SMS_SENT: { label: 'SMS Sent', color: 'bg-yellow-100 text-yellow-700' },
            CLAIMED: { label: 'Claimed', color: 'bg-green-100 text-green-700' },
            AI_CALLING: { label: 'AI Calling', color: 'bg-purple-100 text-purple-700' },
            BOOKED: { label: 'Booked', color: 'bg-emerald-100 text-emerald-700' },
        };
        return badges[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28" />)}
                </div>
                <div className="skeleton h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-[#666666] mt-1">Monitor your lead performance and team activity</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[#666666]">Total Leads</p>
                            <p className="metric-value mt-1">{data?.stats.totalLeads || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-[#4CAF50] mt-3 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{data?.stats.leadsToday || 0} today
                    </p>
                </div>

                <div className="card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[#666666]">Human Claims</p>
                            <p className="metric-value mt-1">{data?.stats.humanClaims || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-xs text-[#666666] mt-3">
                        Claimed by your team
                    </p>
                </div>

                <div className="card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[#666666]">AI Claims</p>
                            <p className="metric-value mt-1">{data?.stats.aiClaims || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-[#666666] mt-3">
                        Handled by AI voice agent
                    </p>
                </div>

                <div className="card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[#666666]">Booked</p>
                            <p className="metric-value mt-1">{data?.stats.bookedCount || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs text-[#666666] mt-3">
                        Appointments scheduled
                    </p>
                </div>
            </div>

            {/* Speed to Lead + Recent Activity */}
            <div className="grid grid-cols-3 gap-4">
                {/* Speed to Lead */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#EEEEEE] flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#666666]" />
                        </div>
                        <div>
                            <p className="text-sm text-[#666666]">Avg Speed to Lead</p>
                            <p className="text-xl font-bold">
                                {data?.stats.avgSpeedToLead ? formatTime(data.stats.avgSpeedToLead) : '—'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-[#666666]">
                        Time from lead submission to first contact
                    </p>
                </div>

                {/* Conversion Rate */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#EEEEEE] flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-[#666666]" />
                        </div>
                        <div>
                            <p className="text-sm text-[#666666]">Conversion Rate</p>
                            <p className="text-xl font-bold">
                                {data?.stats.totalLeads
                                    ? `${Math.round((data.stats.bookedCount / data.stats.totalLeads) * 100)}%`
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-[#666666]">
                        Leads converted to appointments
                    </p>
                </div>

                {/* AI Performance */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[#666666]">AI Assist Rate</p>
                            <p className="text-xl font-bold">
                                {(data?.stats.humanClaims || 0) + (data?.stats.aiClaims || 0) > 0
                                    ? `${Math.round((data!.stats.aiClaims / (data!.stats.humanClaims + data!.stats.aiClaims)) * 100)}%`
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-[#666666]">
                        Leads handled by AI when team unavailable
                    </p>
                </div>
            </div>

            {/* Recent Leads + Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                {/* Recent Leads */}
                <div className="col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Recent Leads</h3>
                        <Link href="/dashboard/leads" className="text-sm text-[#2196F3] hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {data?.recentLeads.length === 0 ? (
                        <div className="text-center py-12 text-[#666666]">
                            <Users className="w-12 h-12 mx-auto mb-3 text-[#CCCCCC]" />
                            <p>No leads yet</p>
                            <p className="text-sm mt-1">Create a landing page to start capturing leads</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data?.recentLeads.slice(0, 5).map((lead) => {
                                const badge = getStatusBadge(lead.status);
                                return (
                                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#EEEEEE] flex items-center justify-center text-sm font-medium">
                                                {lead.firstName.charAt(0)}{lead.lastName?.charAt(0) || ''}
                                            </div>
                                            <div>
                                                <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                                                <p className="text-xs text-[#9E9E9E]">{lead.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-[#9E9E9E]">
                                                {formatDate(lead.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Link href="/dashboard/landers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Create Landing Page</p>
                                <p className="text-xs text-[#9E9E9E]">Capture new leads</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/leads" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">View All Leads</p>
                                <p className="text-xs text-[#9E9E9E]">Manage your pipeline</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/calls" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Phone className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">AI Call History</p>
                                <p className="text-xs text-[#9E9E9E]">Review transcripts</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">View Analytics</p>
                                <p className="text-xs text-[#9E9E9E]">Track performance</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
