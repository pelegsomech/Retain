'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calendar,
    MessageSquare,
    MoreVertical,
    MapPin,
    Mail,
    ArrowUpDown,
} from "lucide-react";

interface Lead {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    status: string;
    claimedBy: string | null;
    createdAt: string;
    source?: string;
}

interface DashboardData {
    stats: {
        totalLeads: number;
        leadsToday: number;
        bookedCount: number;
        inProgress: number;
    };
    leads: Lead[];
}

const PIPELINE_COLUMNS = [
    { key: 'NEW', label: 'Contacted' },
    { key: 'SMS_SENT', label: 'Negotiation' },
    { key: 'CLAIMED', label: 'Offer Sent' },
    { key: 'BOOKED', label: 'Deal Closed' },
];

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [leadsRes, analyticsRes] = await Promise.all([
                fetch('/api/leads?limit=100'),
                fetch('/api/analytics'),
            ]);

            const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [] };
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

            setData({
                stats: {
                    totalLeads: analyticsData?.overview?.totalLeads || 0,
                    leadsToday: analyticsData?.overview?.leadsToday || 0,
                    bookedCount: analyticsData?.overview?.bookedLeads || 0,
                    inProgress: leadsData.leads?.filter((l: Lead) => ['SMS_SENT', 'CLAIMED'].includes(l.status)).length || 0,
                },
                leads: leadsData.leads || [],
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

    // Group leads by status
    const leadsByStatus = PIPELINE_COLUMNS.reduce((acc, col) => {
        acc[col.key] = (data?.leads || []).filter(l => l.status === col.key);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Calculate conversion percentage
    const conversionRate = data?.stats.totalLeads
        ? Math.round((data.stats.bookedCount / data.stats.totalLeads) * 100)
        : 0;

    // Weekly data for bar chart (simulated pattern)
    const weeklyData = [4, 7, 5, 9, 6];
    const maxVal = Math.max(...weeklyData);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-full">

            {/* Stats Container - BizLink exact */}
            <div className="stats-container">
                {/* Bar Chart */}
                <div className="chart-section">
                    <div className="chart-title">New customers</div>
                    <div className="bar-chart">
                        {weeklyData.map((val, i) => (
                            <div
                                key={i}
                                className="bar"
                                style={{ height: `${(val / maxVal) * 100}%` }}
                            />
                        ))}
                    </div>
                    <div className="bar-labels">
                        <span className="bar-label">Mon</span>
                        <span className="bar-label">Tue</span>
                        <span className="bar-label">Wed</span>
                        <span className="bar-label">Thu</span>
                        <span className="bar-label">Fri</span>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="donut-section">
                    <div className="donut-chart">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="10"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke="#115e59"
                                strokeWidth="10"
                                strokeDasharray={`${conversionRate * 2.39} 239`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                            {/* Secondary segment */}
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke="#fcd34d"
                                strokeWidth="10"
                                strokeDasharray={`${Math.min(30, 100 - conversionRate) * 2.39} 239`}
                                strokeLinecap="round"
                                transform={`rotate(${-90 + conversionRate * 3.6} 50 50)`}
                            />
                        </svg>
                        <div className="donut-value">
                            <span className="donut-percent">{conversionRate}%</span>
                            <span className="donut-label">Successful deals</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stat-item">
                    <span className="stat-value">{data?.stats.inProgress || 0}</span>
                    <span className="stat-label">Tasks</span>
                    <span className="stat-label">in progress</span>
                    <span className="stat-link">
                        <ArrowRight className="w-3 h-3" />
                    </span>
                </div>

                <div className="stat-item border-r-0">
                    <span className="stat-value">$ {((data?.stats.bookedCount || 0) * 299).toLocaleString()}</span>
                    <span className="stat-label">Prepayments</span>
                    <span className="stat-label">from customers</span>
                    <span className="stat-link">
                        <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            </div>

            {/* Kanban Pipeline - BizLink exact */}
            <div className="pipeline">
                {PIPELINE_COLUMNS.map((column) => {
                    const leads = leadsByStatus[column.key] || [];

                    return (
                        <div key={column.key}>
                            {/* Column Header */}
                            <div className="column-header">
                                <span className="column-title">{column.label}</span>
                                <span className="column-count">
                                    {leads.length}
                                    <ArrowUpDown />
                                </span>
                            </div>

                            {/* Cards */}
                            <div>
                                {leads.length === 0 ? (
                                    <div className="lead-card opacity-50">
                                        <div className="lead-card-desc text-center py-4">No leads yet</div>
                                    </div>
                                ) : (
                                    leads.slice(0, 4).map((lead, idx) => {
                                        // Highlight third column first card (like Prime Estate)
                                        const isHighlight = column.key === 'CLAIMED' && idx === 0;

                                        return (
                                            <div
                                                key={lead.id}
                                                className={`lead-card animate-slide-up ${isHighlight ? 'lead-card-highlight' : ''}`}
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="lead-card-header">
                                                    <h4 className="lead-card-title">
                                                        {lead.firstName} {lead.lastName}
                                                    </h4>
                                                    <button className="lead-card-menu">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <p className="lead-card-desc">
                                                    {lead.source || lead.address || 'Lead from landing page submission'}
                                                </p>

                                                {/* Extra info for highlighted card */}
                                                {isHighlight && (
                                                    <div className="lead-card-extra">
                                                        {lead.address && (
                                                            <div className="lead-card-location">
                                                                <MapPin />
                                                                {lead.address}{lead.city && `, ${lead.city}`}
                                                            </div>
                                                        )}
                                                        {lead.email && (
                                                            <div className="lead-card-contact">
                                                                <Mail />
                                                                {lead.email}
                                                            </div>
                                                        )}
                                                        <div className="lead-card-manager">
                                                            <div className="manager-avatar" />
                                                            <div>
                                                                <div className="manager-label">Manager</div>
                                                                <div className="manager-name">Antony Cardenas</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="lead-card-meta">
                                                    <span className={`date-badge ${!lead.createdAt ? 'date-badge-warning' : ''}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {lead.createdAt ? formatDate(lead.createdAt) : 'No due date'}
                                                    </span>
                                                    <span className="count-badge">
                                                        <MessageSquare />
                                                        {Math.floor(Math.random() * 5) + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {leads.length > 4 && (
                                    <Link
                                        href={`/dashboard/leads?status=${column.key}`}
                                        className="block text-center text-sm text-primary py-3 hover:underline"
                                    >
                                        View {leads.length - 4} more →
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
