'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    TrendingUp,
    ArrowRight,
    Clock,
    Calendar,
    Phone,
    MessageSquare,
    CheckCircle,
    Bot,
    User,
    MoreVertical,
} from "lucide-react";

interface Lead {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    status: string;
    claimedBy: string | null;
    createdAt: string;
    address?: string;
    source?: string;
}

interface DashboardData {
    tenant: {
        companyName: string;
    };
    stats: {
        totalLeads: number;
        leadsToday: number;
        bookedCount: number;
    };
    recentLeads: Lead[];
}

const PIPELINE_COLUMNS = [
    { key: 'NEW', label: 'New Leads', icon: Users },
    { key: 'SMS_SENT', label: 'Contacted', icon: MessageSquare },
    { key: 'CLAIMED', label: 'Claimed', icon: CheckCircle },
    { key: 'BOOKED', label: 'Booked', icon: Calendar },
];

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [tenantRes, leadsRes, analyticsRes] = await Promise.all([
                fetch('/api/tenants'),
                fetch('/api/leads?limit=100'),
                fetch('/api/analytics'),
            ]);

            const tenantData = tenantRes.ok ? await tenantRes.json() : null;
            const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [] };
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

            setAllLeads(leadsData.leads || []);

            setData({
                tenant: tenantData?.tenant || { companyName: 'Your Company' },
                stats: {
                    totalLeads: analyticsData?.overview?.totalLeads || 0,
                    leadsToday: analyticsData?.overview?.leadsToday || 0,
                    bookedCount: analyticsData?.overview?.bookedLeads || 0,
                },
                recentLeads: leadsData.leads.slice(0, 10),
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    // Group leads by status for pipeline
    const leadsByStatus = PIPELINE_COLUMNS.reduce((acc, col) => {
        acc[col.key] = allLeads.filter(l => l.status === col.key);
        return acc;
    }, {} as Record<string, Lead[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-full">

            {/* Stats Row - Like BizLink with chart area */}
            <div className="stats-row">
                {/* Bar Chart Placeholder */}
                <div className="flex-1 pr-6 border-r border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">New Leads</h3>
                    <div className="flex items-end gap-2 h-20">
                        {[3, 7, 5, 9, 4, 8, 6].map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-foreground rounded-sm transition-all hover:bg-primary"
                                style={{ height: `${height * 10}%` }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                </div>

                {/* Donut Chart Placeholder */}
                <div className="flex items-center justify-center px-8 border-r border-border">
                    <div className="relative">
                        <svg className="w-24 h-24" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#0d9488"
                                strokeWidth="12"
                                strokeDasharray={`${(data?.stats.bookedCount || 0) / Math.max(data?.stats.totalLeads || 1, 1) * 251} 251`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold">
                                {data?.stats.totalLeads ? Math.round((data?.stats.bookedCount || 0) / data.stats.totalLeads * 100) : 0}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">Conversion</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stat-item">
                    <span className="stat-value">{data?.stats.totalLeads || 0}</span>
                    <span className="stat-label">Total leads</span>
                </div>

                <div className="stat-item">
                    <span className="stat-value">{data?.stats.bookedCount || 0}</span>
                    <span className="stat-label">Appointments</span>
                </div>

                <div className="stat-item border-r-0">
                    <span className="stat-value">+{data?.stats.leadsToday || 0}</span>
                    <span className="stat-label">Today</span>
                    <Link href="/dashboard/analytics" className="text-primary text-xs flex items-center gap-1 mt-1 hover:underline">
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            {/* Kanban Pipeline - Like BizLink */}
            <div className="grid grid-cols-4 gap-4">
                {PIPELINE_COLUMNS.map((column) => {
                    const leads = leadsByStatus[column.key] || [];
                    const Icon = column.icon;

                    return (
                        <div key={column.key} className="pipeline-column">
                            <div className="pipeline-header">
                                <span>{column.label}</span>
                                <span className="pipeline-count">
                                    {leads.length}
                                    <TrendingUp className="h-3 w-3" />
                                </span>
                            </div>

                            <div className="space-y-3">
                                {leads.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No leads
                                    </div>
                                ) : (
                                    leads.slice(0, 5).map((lead, idx) => (
                                        <div
                                            key={lead.id}
                                            className={`lead-card animate-slide-up ${idx === 0 && column.key === 'CLAIMED' ? 'lead-card-highlighted' : ''}`}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="lead-card-title">
                                                    {lead.firstName} {lead.lastName}
                                                </h4>
                                                <button className="text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <p className="lead-card-desc line-clamp-2">
                                                {lead.address || lead.source || 'Lead from landing page'}
                                            </p>

                                            <div className="lead-card-meta">
                                                <span className="lead-card-badge">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(lead.createdAt)}
                                                </span>

                                                {lead.claimedBy && (
                                                    <span className="flex items-center gap-1">
                                                        {lead.claimedBy === 'ai' ? (
                                                            <Bot className="h-3 w-3 text-primary" />
                                                        ) : (
                                                            <User className="h-3 w-3 text-amber-600" />
                                                        )}
                                                    </span>
                                                )}

                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="ml-auto text-primary hover:text-primary/80"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {leads.length > 5 && (
                                    <Link
                                        href={`/dashboard/leads?status=${column.key}`}
                                        className="block text-center text-sm text-primary py-2 hover:underline"
                                    >
                                        View {leads.length - 5} more →
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
