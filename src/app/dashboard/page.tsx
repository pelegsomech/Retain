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

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    NEW: { label: 'New', className: 'status-new' },
    SMS_SENT: { label: 'SMS Sent', className: 'status-sms' },
    CLAIMED: { label: 'Claimed', className: 'status-claimed' },
    AI_CALLING: { label: 'AI Calling', className: 'status-ai' },
    BOOKED: { label: 'Booked', className: 'status-booked' },
};

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
        return STATUS_MAP[status] || { label: status, className: 'status-dead' };
    };

    if (isLoading) {
        return (
            <div className="space-y-5">
                <div className="skeleton h-7 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-[120px] rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-[100px] rounded-xl" />)}
                </div>
                <div className="skeleton h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1>Dashboard</h1>
                <p className="mt-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                    Monitor your lead performance and team activity
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Leads */}
                <div className="card animate-slide-up stagger-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Total Leads</p>
                            <p className="metric-value mt-2">{data?.stats.totalLeads || 0}</p>
                        </div>
                        <div className="icon-box icon-box-blue">
                            <Users />
                        </div>
                    </div>
                    <div className="trend-up mt-3">
                        <TrendingUp className="w-3 h-3" />
                        +{data?.stats.leadsToday || 0} today
                    </div>
                </div>

                {/* Human Claims */}
                <div className="card animate-slide-up stagger-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Human Claims</p>
                            <p className="metric-value mt-2">{data?.stats.humanClaims || 0}</p>
                        </div>
                        <div className="icon-box icon-box-amber">
                            <User />
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Claimed by your team
                    </p>
                </div>

                {/* AI Claims */}
                <div className="card animate-slide-up stagger-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>AI Claims</p>
                            <p className="metric-value mt-2">{data?.stats.aiClaims || 0}</p>
                        </div>
                        <div className="icon-box icon-box-purple">
                            <Bot />
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Handled by AI voice agent
                    </p>
                </div>

                {/* Booked */}
                <div className="card animate-slide-up stagger-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Booked</p>
                            <p className="metric-value mt-2">{data?.stats.bookedCount || 0}</p>
                        </div>
                        <div className="icon-box icon-box-emerald">
                            <Calendar />
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Appointments scheduled
                    </p>
                </div>
            </div>

            {/* Operational Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Speed to Lead */}
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-neutral">
                            <Clock />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Avg Speed to Lead</p>
                            <p className="metric-sm mt-0.5">
                                {data?.stats.avgSpeedToLead ? formatTime(data.stats.avgSpeedToLead) : '—'}
                            </p>
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Time from submission to first contact
                    </p>
                </div>

                {/* Conversion Rate */}
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-emerald">
                            <TrendingUp />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Conversion Rate</p>
                            <p className="metric-sm mt-0.5">
                                {data?.stats.totalLeads
                                    ? `${Math.round((data.stats.bookedCount / data.stats.totalLeads) * 100)}%`
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Leads converted to appointments
                    </p>
                </div>

                {/* AI Assist Rate */}
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-purple">
                            <Bot />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>AI Assist Rate</p>
                            <p className="metric-sm mt-0.5">
                                {(data?.stats.humanClaims || 0) + (data?.stats.aiClaims || 0) > 0
                                    ? `${Math.round((data!.stats.aiClaims / (data!.stats.humanClaims + data!.stats.aiClaims)) * 100)}%`
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Leads handled by AI when team unavailable
                    </p>
                </div>
            </div>

            {/* Recent Leads + Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Recent Leads */}
                <div className="sm:col-span-2 card-static">
                    <div className="flex items-center justify-between mb-4">
                        <h3>Recent Leads</h3>
                        <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-1"
                            style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}
                        >
                            View all <ArrowRight className="w-3.5 h-3.5" style={{ strokeWidth: 1.75 }} />
                        </Link>
                    </div>

                    {data?.recentLeads.length === 0 ? (
                        <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
                            <p style={{ fontWeight: 500 }}>No leads yet</p>
                            <p className="mt-1" style={{ fontSize: '0.8125rem' }}>Create a landing page to start capturing leads</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {data?.recentLeads.slice(0, 5).map((lead) => {
                                const badge = getStatusBadge(lead.status);
                                return (
                                    <div key={lead.id} className="list-row">
                                        <div className="flex items-center gap-3">
                                            <div className="list-avatar">
                                                {lead.firstName.charAt(0)}{lead.lastName?.charAt(0) || ''}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                                                    {lead.firstName} {lead.lastName}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{lead.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`status-badge ${badge.className}`}>
                                                <span className="status-dot" />
                                                {badge.label}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
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
                <div className="card-static">
                    <h3 className="mb-4">Quick Actions</h3>
                    <div className="space-y-1">
                        <Link href="/dashboard/landers" className="list-row">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-sm icon-box-blue">
                                    <FileText />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.8125rem' }}>Create Landing Page</p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Capture new leads</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard/leads" className="list-row">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-sm icon-box-emerald">
                                    <CheckCircle />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.8125rem' }}>View All Leads</p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Manage your pipeline</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard/calls" className="list-row">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-sm icon-box-purple">
                                    <Phone />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.8125rem' }}>AI Call History</p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Review transcripts</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard/analytics" className="list-row">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-sm icon-box-amber">
                                    <TrendingUp />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.8125rem' }}>View Analytics</p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Track performance</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
