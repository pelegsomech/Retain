'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Phone,
    Clock,
    User,
    Bot,
    XCircle,
    Calendar,
    Search,
    Filter,
    RefreshCcw,
    MessageSquare,
    UserPlus
} from "lucide-react";
import { CreateLeadModal } from "@/components/CreateLeadModal";

interface Lead {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    status: string;
    source: string;
    claimedBy: string | null;
    claimedAt: string | null;
    aiCallOutcome: string | null;
    aiCallDuration: number | null;
    appointmentTime: string | null;
    createdAt: string | { _seconds: number; _nanoseconds: number };
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

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchLeads();
    }, [statusFilter]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }
            params.set('limit', '100');

            const response = await fetch(`/api/leads?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setLeads(data.leads);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            lead.firstName.toLowerCase().includes(query) ||
            (lead.lastName?.toLowerCase().includes(query)) ||
            lead.phone.includes(query) ||
            (lead.email?.toLowerCase().includes(query))
        );
    });

    const getStatusIcon = (status: string) => {
        const iconStyle = { width: 14, height: 14, strokeWidth: 1.75 };
        switch (status) {
            case 'CLAIMED': return <User style={iconStyle} />;
            case 'AI_CALLING': case 'AI_QUALIFIED': return <Bot style={iconStyle} />;
            case 'BOOKED': return <Calendar style={iconStyle} />;
            case 'DISQUALIFIED': return <XCircle style={iconStyle} />;
            case 'SMS_SENT': return <MessageSquare style={iconStyle} />;
            default: return <Clock style={iconStyle} />;
        }
    };

    const formatTimeAgo = (dateValue: string | { _seconds: number; _nanoseconds: number }) => {
        let date: Date;

        if (typeof dateValue === 'object' && dateValue !== null && '_seconds' in dateValue) {
            date = new Date(dateValue._seconds * 1000);
        } else {
            date = new Date(dateValue as string);
        }

        if (isNaN(date.getTime())) {
            return 'Just now';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // Stats
    const newLeads = leads.filter(l => l.status === 'NEW').length;
    const claimedByHuman = leads.filter(l => l.claimedBy === 'human').length;
    const claimedByAI = leads.filter(l => l.claimedBy === 'ai').length;
    const bookedCount = leads.filter(l => l.status === 'BOOKED').length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1>Leads</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }} className="mt-1">Manage your lead pipeline</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn-secondary" onClick={fetchLeads}>
                        <RefreshCcw className="w-[14px] h-[14px]" style={{ strokeWidth: 1.75 }} />
                        Refresh
                    </button>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <UserPlus className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }} />
                        New Lead
                    </button>
                </div>
            </div>

            {/* Create Lead Modal */}
            <CreateLeadModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchLeads}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-blue">
                            <Clock />
                        </div>
                        <div>
                            <div className="metric-sm">{newLeads}</div>
                            <div className="metric-label">New</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-emerald">
                            <User />
                        </div>
                        <div>
                            <div className="metric-sm">{claimedByHuman}</div>
                            <div className="metric-label">Human Claims</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-purple">
                            <Bot />
                        </div>
                        <div>
                            <div className="metric-sm">{claimedByAI}</div>
                            <div className="metric-label">AI Claims</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-emerald">
                            <Calendar />
                        </div>
                        <div>
                            <div className="metric-sm">{bookedCount}</div>
                            <div className="metric-label">Booked</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card-static">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: 'var(--muted-foreground)', strokeWidth: 1.75 }} />
                        <Input
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            style={{ height: 34, fontSize: '0.8125rem', borderRadius: 8 }}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48" style={{ height: 34, fontSize: '0.8125rem', borderRadius: 8 }}>
                            <Filter style={{ width: 14, height: 14, strokeWidth: 1.75, marginRight: 6 }} />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {total} total leads
                    </span>
                </div>
            </div>

            {/* Leads List */}
            <div className="card-static">
                <div className="mb-4">
                    <h3>Lead Pipeline</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                        All leads sorted by most recent
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        <h3 className="mb-1">No leads found</h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Leads will appear here when forms are submitted'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {filteredLeads.map((lead) => {
                            const badge = STATUS_MAP[lead.status] || { label: lead.status, className: 'status-dead' };
                            return (
                                <div key={lead.id} className="list-row">
                                    <div className="flex items-center gap-3">
                                        <div className="list-avatar">
                                            {lead.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                                                {lead.firstName} {lead.lastName}
                                            </div>
                                            <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                <span className="flex items-center gap-1">
                                                    <Phone style={{ width: 11, height: 11, strokeWidth: 1.75 }} />
                                                    {lead.phone}
                                                </span>
                                                {lead.city && lead.state && (
                                                    <span>{lead.city}, {lead.state}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Claimed By */}
                                        {lead.claimedBy && (
                                            <div className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                {lead.claimedBy === 'human' ? (
                                                    <User style={{ width: 13, height: 13, strokeWidth: 1.75, color: 'var(--foreground)' }} />
                                                ) : (
                                                    <Bot style={{ width: 13, height: 13, strokeWidth: 1.75, color: 'var(--muted-foreground)' }} />
                                                )}
                                                {lead.claimedBy === 'human' ? 'Human' : 'AI'}
                                            </div>
                                        )}

                                        {/* AI Call Duration */}
                                        {lead.aiCallDuration && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                {Math.floor(lead.aiCallDuration / 60)}:{String(lead.aiCallDuration % 60).padStart(2, '0')}
                                            </span>
                                        )}

                                        {/* Status Badge */}
                                        <span className={`status-badge ${badge.className}`}>
                                            <span className="status-dot" />
                                            {badge.label}
                                        </span>

                                        {/* Time */}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', width: 64, textAlign: 'right' as const }}>
                                            {formatTimeAgo(lead.createdAt)}
                                        </span>

                                        {/* Actions */}
                                        <a href={`tel:${lead.phone}`} className="btn-icon" style={{ width: 30, height: 30 }}>
                                            <Phone style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
