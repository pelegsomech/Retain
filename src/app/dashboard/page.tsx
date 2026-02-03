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
    Link2,
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
        revenue: number;
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

            const booked = analyticsData?.overview?.bookedLeads || 0;

            setData({
                stats: {
                    totalLeads: analyticsData?.overview?.totalLeads || 0,
                    leadsToday: analyticsData?.overview?.leadsToday || 0,
                    bookedCount: booked,
                    inProgress: leadsData.leads?.filter((l: Lead) => ['SMS_SENT', 'CLAIMED'].includes(l.status)).length || 0,
                    revenue: booked * 299,
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
        : 68; // Default to show design

    // Weekly data for bar chart (grayscale)
    const weeklyData = [3, 7, 5, 9, 4];
    const maxVal = Math.max(...weeklyData, 1);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-32 w-full" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-64" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Stats Container */}
            <div className="stats-container">
                {/* Bar Chart Section */}
                <div className="flex-shrink-0 w-64 pr-6">
                    <h3 className="text-sm font-medium text-foreground mb-4">New customers</h3>
                    <div className="bar-chart">
                        {weeklyData.map((val, i) => (
                            <div
                                key={i}
                                className="bar"
                                style={{ height: `${(val / maxVal) * 100}%` }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                            <span key={day} className="bar-label flex-1">{day}</span>
                        ))}
                    </div>
                </div>

                <div className="stats-divider" />

                {/* Donut Chart Section */}
                <div className="flex items-center justify-center px-6">
                    <div className="gauge-container">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background */}
                            <circle cx="50" cy="50" r="38" fill="none" stroke="#EEEEEE" strokeWidth="10" />
                            {/* Success (green) */}
                            <circle
                                cx="50" cy="50" r="38" fill="none"
                                stroke="#4CAF50" strokeWidth="10"
                                strokeDasharray={`${conversionRate * 2.39} 239`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                            {/* Warning segment */}
                            <circle
                                cx="50" cy="50" r="38" fill="none"
                                stroke="#FFC107" strokeWidth="10"
                                strokeDasharray={`${20 * 2.39} 239`}
                                strokeLinecap="round"
                                transform={`rotate(${-90 + conversionRate * 3.6} 50 50)`}
                            />
                        </svg>
                        <div className="gauge-value">
                            <span className="gauge-percent">{conversionRate}%</span>
                            <span className="gauge-label">Successful deals</span>
                        </div>
                    </div>
                </div>

                <div className="stats-divider" />

                {/* Tasks in progress */}
                <div className="stat-block">
                    <span className="metric-value">{data?.stats.inProgress || 53}</span>
                    <span className="metric-label">Tasks</span>
                    <span className="metric-label">in progress</span>
                    <Link href="/dashboard/leads" className="flex items-center gap-1 text-xs text-[#2196F3] mt-2 hover:underline">
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="stats-divider" />

                {/* Revenue */}
                <div className="stat-block">
                    <span className="metric-value">$ {(data?.stats.revenue || 15890).toLocaleString()}</span>
                    <span className="metric-label">Prepayments</span>
                    <span className="metric-label">from customers</span>
                    <Link href="/dashboard/analytics" className="flex items-center gap-1 text-xs text-[#2196F3] mt-2 hover:underline">
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Kanban Pipeline */}
            <div className="pipeline">
                {PIPELINE_COLUMNS.map((column) => {
                    const leads = leadsByStatus[column.key] || [];
                    const count = leads.length || [12, 17, 13, 12][PIPELINE_COLUMNS.indexOf(column)];

                    return (
                        <div key={column.key}>
                            {/* Column Header */}
                            <div className="column-header">
                                <h2 className="column-title">{column.label}</h2>
                                <span className="column-count">
                                    {count}
                                    <ArrowUpDown className="w-3 h-3" />
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="space-y-3">
                                {leads.length === 0 ? (
                                    // Demo cards when no data
                                    Array.from({ length: 2 }).map((_, idx) => (
                                        <div key={idx} className={`card animate-slide-up ${column.key === 'CLAIMED' && idx === 0 ? 'card-highlight' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="card-header">
                                                <h4 className="card-title">
                                                    {['ByteBridge', 'SkillUp Hub', 'FitLife Nutrition', 'CloudSphere'][PIPELINE_COLUMNS.indexOf(column)]}
                                                </h4>
                                                <button className="text-[#9E9E9E] hover:text-foreground p-1">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="card-description">
                                                {column.key === 'CLAIMED' && idx === 0
                                                    ? 'Agency-developer of low-rise elite and commercial real estate'
                                                    : 'Platform for professional development of specialists'
                                                }
                                            </p>

                                            {/* Extra info for highlighted card */}
                                            {column.key === 'CLAIMED' && idx === 0 && (
                                                <div className="border-t border-[#EEEEEE] pt-3 mt-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                                                        <MapPin className="w-3 h-3" />
                                                        540 Realty Blvd, Miami, FL 33132
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                                                        <Link2 className="w-3 h-3" />
                                                        contact@primeestate.com
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
                                                        <div>
                                                            <div className="text-[10px] text-[#9E9E9E]">Manager</div>
                                                            <div className="text-xs font-medium">Antony Cardenas</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="card-meta">
                                                <span className={`date-badge ${idx === 1 && column.key === 'SMS_SENT' ? 'date-badge-warning' : ''}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    {idx === 1 && column.key === 'SMS_SENT' ? 'No due date' : `${10 + idx * 8} Apr`}
                                                </span>
                                                <span className="count-badge">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {2 + idx}
                                                </span>
                                                <span className="count-badge">
                                                    <Link2 className="w-3 h-3" />
                                                    {1 + idx}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    leads.slice(0, 3).map((lead, idx) => (
                                        <div
                                            key={lead.id}
                                            className={`card animate-slide-up ${column.key === 'CLAIMED' && idx === 0 ? 'card-highlight' : ''}`}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="card-header">
                                                <h4 className="card-title">{lead.firstName} {lead.lastName}</h4>
                                                <button className="text-[#9E9E9E] hover:text-foreground p-1">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="card-description">
                                                {lead.source || lead.address || 'Lead from landing page submission'}
                                            </p>

                                            {column.key === 'CLAIMED' && idx === 0 && lead.address && (
                                                <div className="border-t border-[#EEEEEE] pt-3 mt-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                                                        <MapPin className="w-3 h-3" />
                                                        {lead.address}{lead.city && `, ${lead.city}`}
                                                    </div>
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-xs text-[#666666]">
                                                            <Mail className="w-3 h-3" />
                                                            {lead.email}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="card-meta">
                                                <span className="date-badge">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(lead.createdAt)}
                                                </span>
                                                <span className="count-badge">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {Math.floor(Math.random() * 5) + 1}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {leads.length > 3 && (
                                    <Link
                                        href={`/dashboard/leads?status=${column.key}`}
                                        className="block text-center text-sm text-[#2196F3] py-2 hover:underline"
                                    >
                                        View {leads.length - 3} more →
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
