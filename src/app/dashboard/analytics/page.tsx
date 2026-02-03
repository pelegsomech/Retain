'use client';

import { useEffect, useState } from 'react';
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

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    SMS_SENT: 'SMS Sent',
    CLAIMED: 'Claimed',
    AI_CALLING: 'AI Calling',
    AI_QUALIFIED: 'AI Qualified',
    BOOKED: 'Booked',
    CALLBACK_SCHEDULED: 'Callback',
    DISQUALIFIED: 'Disqualified',
    NO_ANSWER: 'No Answer',
    DEAD: 'Dead',
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load analytics</p>
                <Button variant="outline" onClick={fetchAnalytics} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    const maxDaily = Math.max(...analytics.dailyLeads.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground">Track your lead performance</p>
                </div>
                <Button variant="outline" onClick={fetchAnalytics}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{analytics.overview.totalLeads}</div>
                                <div className="text-sm text-muted-foreground">Total Leads</div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm">
                            <span className="text-green-600 font-medium">+{analytics.overview.leadsToday}</span>
                            <span className="text-muted-foreground"> today</span>
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
                                <div className="text-3xl font-bold">{formatDuration(analytics.overview.avgSpeedToLead)}</div>
                                <div className="text-sm text-muted-foreground">Avg Speed to Lead</div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                            Time to human claim
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
                                <div className="text-3xl font-bold">{analytics.overview.bookedLeads}</div>
                                <div className="text-sm text-muted-foreground">Booked</div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm">
                            <span className="text-emerald-600 font-medium">{analytics.overview.conversionRate}%</span>
                            <span className="text-muted-foreground"> conversion</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Bot className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{analytics.aiStats.totalCalls}</div>
                                <div className="text-sm text-muted-foreground">AI Calls</div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm">
                            <span className="text-purple-600 font-medium">{formatDuration(analytics.aiStats.avgDuration)}</span>
                            <span className="text-muted-foreground"> avg duration</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Human vs AI Claims */}
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Claim Distribution</CardTitle>
                        <CardDescription>Human vs AI lead handling</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <UserCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{analytics.overview.humanClaims}</div>
                                        <div className="text-sm text-muted-foreground">Human Claims</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{analytics.overview.aiClaims}</div>
                                        <div className="text-sm text-muted-foreground">AI Claims</div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual ratio bar */}
                            <div className="flex-1">
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-green-500 h-full"
                                        style={{
                                            width: `${(analytics.overview.humanClaims / (analytics.overview.humanClaims + analytics.overview.aiClaims + 0.01)) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-purple-500 h-full"
                                        style={{
                                            width: `${(analytics.overview.aiClaims / (analytics.overview.humanClaims + analytics.overview.aiClaims + 0.01)) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                                    <span>Human</span>
                                    <span>AI</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Sources</CardTitle>
                        <CardDescription>Where your leads come from (last 30 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.leadsBySource.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                No source data yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analytics.leadsBySource.map((source, i) => (
                                    <div key={source.source} className="flex items-center gap-3">
                                        <div className="w-6 text-muted-foreground text-sm">{i + 1}.</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{source.source}</span>
                                                <span className="text-sm text-muted-foreground">{source.count}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full"
                                                    style={{
                                                        width: `${(source.count / (analytics.leadsBySource[0]?.count || 1)) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Leads</CardTitle>
                    <CardDescription>Last 7 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48">
                        {analytics.dailyLeads.map((day) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                <div className="text-sm font-medium">{day.count}</div>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                                    style={{ height: `${(day.count / maxDaily) * 150}px`, minHeight: day.count > 0 ? '10px' : '2px' }}
                                />
                                <div className="text-xs text-muted-foreground">{formatDay(day.date)}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Status Breakdown</CardTitle>
                    <CardDescription>Current distribution of leads by status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {analytics.leadsByStatus.map((status) => (
                            <div
                                key={status.status}
                                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg"
                            >
                                <span className="font-medium">{STATUS_LABELS[status.status] || status.status}</span>
                                <Badge variant="secondary">{status.count}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
