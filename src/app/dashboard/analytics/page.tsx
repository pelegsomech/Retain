'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    Users,
    Clock,
    Bot,
    UserCheck,
    Calendar,
    TrendingUp,
    RefreshCcw,
    Zap,
    BarChart3
} from "lucide-react";

interface Analytics {
    overview: {
        totalLeads: number;
        leadsToday: number;
        leadsThisWeek: number;
        humanClaims: number;
        aiClaims: number;
        bookedLeads: number;
        avgSpeedToLead: number;
        conversionRate: number;
    };
    aiStats: {
        totalCalls: number;
        avgDuration: number;
    };
    leadsByStatus: Array<{ status: string; count: number }>;
    leadsBySource: Array<{ source: string; count: number }>;
    dailyLeads: Array<{ date: string; count: number }>;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    NEW: { label: 'New', className: 'status-new' },
    SMS_SENT: { label: 'SMS Sent', className: 'status-sms' },
    CLAIMED: { label: 'Claimed', className: 'status-claimed' },
    AI_CALLING: { label: 'AI Calling', className: 'status-ai' },
    AI_QUALIFIED: { label: 'AI Qualified', className: 'status-ai' },
    BOOKED: { label: 'Booked', className: 'status-booked' },
    CALLBACK_SCHEDULED: { label: 'Callback', className: 'status-callback' },
    DISQUALIFIED: { label: 'Disqualified', className: 'status-declined' },
    NO_ANSWER: { label: 'No Answer', className: 'status-dead' },
    DEAD: { label: 'Dead', className: 'status-dead' },
};

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>Failed to load analytics</p>
                <button className="btn-secondary mt-4" onClick={fetchAnalytics}>
                    Retry
                </button>
            </div>
        );
    }

    const maxDaily = Math.max(...analytics.dailyLeads.map(d => d.count), 1);
    const totalClaims = analytics.overview.humanClaims + analytics.overview.aiClaims;
    const humanPct = totalClaims > 0 ? Math.round((analytics.overview.humanClaims / totalClaims) * 100) : 0;
    const aiPct = totalClaims > 0 ? 100 - humanPct : 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1>Analytics</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }} className="mt-1">
                        Track your lead performance
                    </p>
                </div>
                <button className="btn-secondary" onClick={fetchAnalytics}>
                    <RefreshCcw className="w-[14px] h-[14px]" style={{ strokeWidth: 1.75 }} />
                    Refresh
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card animate-slide-up stagger-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Total Leads</p>
                            <p className="metric-value mt-2">{analytics.overview.totalLeads}</p>
                        </div>
                        <div className="icon-box icon-box-blue">
                            <Users />
                        </div>
                    </div>
                    <div className="trend-up mt-3">
                        <TrendingUp className="w-3 h-3" />
                        +{analytics.overview.leadsToday} today
                    </div>
                </div>

                <div className="card animate-slide-up stagger-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Speed to Lead</p>
                            <p className="metric-value mt-2">{formatDuration(analytics.overview.avgSpeedToLead)}</p>
                        </div>
                        <div className="icon-box icon-box-amber">
                            <Zap />
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Time to human claim
                    </p>
                </div>

                <div className="card animate-slide-up stagger-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>Booked</p>
                            <p className="metric-value mt-2">{analytics.overview.bookedLeads}</p>
                        </div>
                        <div className="icon-box icon-box-emerald">
                            <Calendar />
                        </div>
                    </div>
                    <div className="trend-up mt-3">
                        <TrendingUp className="w-3 h-3" />
                        {analytics.overview.conversionRate}% conversion
                    </div>
                </div>

                <div className="card animate-slide-up stagger-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 450 }}>AI Calls</p>
                            <p className="metric-value mt-2">{analytics.aiStats.totalCalls}</p>
                        </div>
                        <div className="icon-box icon-box-purple">
                            <Bot />
                        </div>
                    </div>
                    <p className="mt-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {formatDuration(analytics.aiStats.avgDuration)} avg duration
                    </p>
                </div>
            </div>

            {/* Claim Distribution + Top Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-static">
                    <h3 className="mb-1">Claim Distribution</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 16 }}>
                        Human vs AI lead handling
                    </p>

                    <div className="flex items-center gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-emerald">
                                    <UserCheck />
                                </div>
                                <div>
                                    <div className="metric-sm">{analytics.overview.humanClaims}</div>
                                    <div className="metric-label">Human Claims</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-purple">
                                    <Bot />
                                </div>
                                <div>
                                    <div className="metric-sm">{analytics.overview.aiClaims}</div>
                                    <div className="metric-label">AI Claims</div>
                                </div>
                            </div>
                        </div>

                        {/* Visual ratio bar */}
                        <div className="flex-1">
                            <div style={{ height: 8, background: 'var(--muted)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                                <div
                                    style={{
                                        width: `${humanPct}%`,
                                        height: '100%',
                                        background: 'var(--foreground)',
                                        borderRadius: '4px 0 0 4px',
                                    }}
                                />
                                <div
                                    style={{
                                        width: `${aiPct}%`,
                                        height: '100%',
                                        background: 'var(--muted-foreground)',
                                        borderRadius: '0 4px 4px 0',
                                        opacity: 0.5,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-2" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                <span>Human {humanPct}%</span>
                                <span>AI {aiPct}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-static">
                    <h3 className="mb-1">Top Sources</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 16 }}>
                        Where your leads come from
                    </p>

                    {analytics.leadsBySource.length === 0 ? (
                        <div className="text-center py-4" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                            No source data yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analytics.leadsBySource.map((source, i) => (
                                <div key={source.source} className="flex items-center gap-3">
                                    <span style={{ width: 20, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{i + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{source.source}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{source.count}</span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--muted)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${(source.count / (analytics.leadsBySource[0]?.count || 1)) * 100}%`,
                                                    height: '100%',
                                                    background: 'var(--primary)',
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Trend */}
            <div className="card-static">
                <h3 className="mb-1">Daily Leads</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 16 }}>
                    Last 7 days performance
                </p>
                <div className="flex items-end gap-2" style={{ height: 180 }}>
                    {analytics.dailyLeads.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--foreground)' }}>{day.count}</span>
                            <div
                                style={{
                                    width: '100%',
                                    background: 'var(--foreground)',
                                    borderRadius: '6px 6px 0 0',
                                    height: `${(day.count / maxDaily) * 140}px`,
                                    minHeight: day.count > 0 ? 8 : 2,
                                    transition: 'height 0.4s var(--ease-premium)',
                                    opacity: day.count > 0 ? 0.75 : 0.15,
                                }}
                            />
                            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{formatDay(day.date)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="card-static">
                <h3 className="mb-1">Lead Status Breakdown</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 16 }}>
                    Current distribution of leads by status
                </p>
                <div className="flex flex-wrap gap-2">
                    {analytics.leadsByStatus.map((status) => {
                        const badge = STATUS_MAP[status.status] || { label: status.status, className: 'status-dead' };
                        return (
                            <div
                                key={status.status}
                                className="flex items-center gap-2"
                                style={{
                                    padding: '6px 12px',
                                    background: 'var(--muted)',
                                    borderRadius: 8,
                                    fontSize: '0.8125rem',
                                }}
                            >
                                <span className={`status-badge ${badge.className}`}>
                                    <span className="status-dot" />
                                    {badge.label}
                                </span>
                                <span style={{ fontWeight: 600, marginLeft: 4 }}>{status.count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
