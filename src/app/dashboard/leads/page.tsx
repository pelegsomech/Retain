'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    CheckCircle,
    XCircle,
    Calendar,
    Search,
    Filter,
    RefreshCcw,
    MessageSquare
} from "lucide-react";

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
    createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    SMS_SENT: 'bg-yellow-100 text-yellow-800',
    CLAIMED: 'bg-green-100 text-green-800',
    AI_CALLING: 'bg-purple-100 text-purple-800',
    AI_QUALIFIED: 'bg-indigo-100 text-indigo-800',
    BOOKED: 'bg-emerald-100 text-emerald-800',
    CALLBACK_SCHEDULED: 'bg-orange-100 text-orange-800',
    DISQUALIFIED: 'bg-red-100 text-red-800',
    NO_ANSWER: 'bg-gray-100 text-gray-800',
    DEAD: 'bg-gray-200 text-gray-600',
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
        switch (status) {
            case 'CLAIMED': return <User className="h-4 w-4" />;
            case 'AI_CALLING': case 'AI_QUALIFIED': return <Bot className="h-4 w-4" />;
            case 'BOOKED': return <Calendar className="h-4 w-4" />;
            case 'DISQUALIFIED': return <XCircle className="h-4 w-4" />;
            case 'SMS_SENT': return <MessageSquare className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Leads</h1>
                    <p className="text-muted-foreground">Manage your lead pipeline</p>
                </div>
                <Button variant="outline" onClick={fetchLeads}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{newLeads}</div>
                                <div className="text-sm text-muted-foreground">New</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{claimedByHuman}</div>
                                <div className="text-sm text-muted-foreground">Human Claims</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{claimedByAI}</div>
                                <div className="text-sm text-muted-foreground">AI Claims</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{bookedCount}</div>
                                <div className="text-sm text-muted-foreground">Booked</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground">
                            {total} total leads
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leads List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Pipeline</CardTitle>
                    <CardDescription>All leads sorted by most recent</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No leads found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Leads will appear here when forms are submitted'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {lead.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {lead.firstName} {lead.lastName}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone}
                                                </span>
                                                {lead.city && lead.state && (
                                                    <span>{lead.city}, {lead.state}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Claimed By */}
                                        {lead.claimedBy && (
                                            <div className="flex items-center gap-2 text-sm">
                                                {lead.claimedBy === 'human' ? (
                                                    <User className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Bot className="h-4 w-4 text-purple-600" />
                                                )}
                                                <span className="text-muted-foreground">
                                                    {lead.claimedBy === 'human' ? 'Human' : 'AI'}
                                                </span>
                                            </div>
                                        )}

                                        {/* AI Call Duration */}
                                        {lead.aiCallDuration && (
                                            <div className="text-sm text-muted-foreground">
                                                {Math.floor(lead.aiCallDuration / 60)}:{String(lead.aiCallDuration % 60).padStart(2, '0')}
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <Badge className={`${STATUS_COLORS[lead.status]} flex items-center gap-1`}>
                                            {getStatusIcon(lead.status)}
                                            {STATUS_LABELS[lead.status] || lead.status}
                                        </Badge>

                                        {/* Time */}
                                        <div className="text-sm text-muted-foreground w-20 text-right">
                                            {formatTimeAgo(lead.createdAt)}
                                        </div>

                                        {/* Actions */}
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={`tel:${lead.phone}`}>
                                                <Phone className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
