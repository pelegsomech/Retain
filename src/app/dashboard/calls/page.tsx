'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Phone,
    Clock,
    Bot,
    XCircle,
    Calendar,
    RefreshCcw,
    FileText,
    TrendingUp,
    Timer,
    Download,
    Volume2,
    Mic,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneForwarded,
    MessageSquare,
    Siren,
    Shield,
    Info,
    Wrench,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface OutboundCall {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    status: string;
    aiCallId: string;
    aiCallStartedAt: string;
    aiCallEndedAt: string | null;
    aiCallDuration: number | null;
    aiCallOutcome: string | null;
    aiCallTranscript: string | null;
    aiCallRecordingUrl: string | null;
    aiCallSummary: string | null;
    createdAt: string;
}

interface InboundCall {
    id: string;
    tenantId: string;
    callerPhone: string;
    callerName?: string;
    twilioCallSid?: string;
    callStartedAt: string;
    callEndedAt?: string;
    durationSeconds?: number;
    routeDecision: string;
    transferredAt?: string;
    retellCallId?: string;
    transcript?: string;
    recordingUrl?: string;
    callSummary?: string;
    outcome?: string;
    appointmentTime?: string;
    appointmentType?: string;
    followUpRequired: boolean;
    followUpNotes?: string;
    ownerNotified: boolean;
    createdAt: string;
}

interface OutboundStats {
    totalCalls: number;
    avgDuration: number;
    bookedCount: number;
    bookingRate: number;
}

interface InboundStats {
    totalCalls: number;
    avgDuration: number;
    bookedCount: number;
    transferredCount: number;
    messagesCount: number;
    emergencyCount: number;
    aiHandledRate: number;
}

type TabType = 'outbound' | 'inbound';

// ============================================
// OUTCOME MAPS
// ============================================

const OUTBOUND_OUTCOME_MAP: Record<string, { label: string; className: string }> = {
    booked: { label: 'Booked', className: 'status-booked' },
    appointment_scheduled: { label: 'Booked', className: 'status-booked' },
    callback: { label: 'Callback', className: 'status-callback' },
    reschedule: { label: 'Reschedule', className: 'status-callback' },
    not_interested: { label: 'Not Interested', className: 'status-declined' },
    declined: { label: 'Declined', className: 'status-declined' },
    voicemail: { label: 'Voicemail', className: 'status-dead' },
    no_answer: { label: 'No Answer', className: 'status-dead' },
    qualified: { label: 'Qualified', className: 'status-new' },
};

const INBOUND_OUTCOME_MAP: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
    appointment_booked: { label: 'Booked', icon: Calendar, color: '#10b981' },
    service_call_scheduled: { label: 'Service Call', icon: Wrench, color: '#f59e0b' },
    message_taken: { label: 'Message', icon: MessageSquare, color: '#6366f1' },
    info_provided: { label: 'Info Given', icon: Info, color: '#64748b' },
    transferred: { label: 'Transferred', icon: PhoneForwarded, color: '#3b82f6' },
    emergency_escalated: { label: 'Emergency', icon: Siren, color: '#ef4444' },
    spam_blocked: { label: 'Blocked', icon: Shield, color: '#94a3b8' },
};

const INBOUND_ROUTE_MAP: Record<string, { label: string; color: string }> = {
    ai_handled: { label: 'AI Handled', color: '#8b5cf6' },
    transferred_to_owner: { label: 'Transferred', color: '#3b82f6' },
    vip_transfer: { label: 'VIP', color: '#f59e0b' },
    blocked: { label: 'Blocked', color: '#94a3b8' },
    voicemail: { label: 'Voicemail', color: '#64748b' },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CallsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('outbound');

    // Outbound state
    const [outboundCalls, setOutboundCalls] = useState<OutboundCall[]>([]);
    const [outboundStats, setOutboundStats] = useState<OutboundStats | null>(null);
    const [outboundLoading, setOutboundLoading] = useState(true);
    const [selectedOutbound, setSelectedOutbound] = useState<OutboundCall | null>(null);

    // Inbound state
    const [inboundCalls, setInboundCalls] = useState<InboundCall[]>([]);
    const [inboundStats, setInboundStats] = useState<InboundStats | null>(null);
    const [inboundLoading, setInboundLoading] = useState(false);
    const [selectedInbound, setSelectedInbound] = useState<InboundCall | null>(null);

    useEffect(() => {
        fetchOutboundCalls();
    }, []);

    useEffect(() => {
        if (activeTab === 'inbound' && inboundCalls.length === 0 && !inboundLoading) {
            fetchInboundCalls();
        }
    }, [activeTab]);

    // ============================================
    // FETCHERS
    // ============================================

    const fetchOutboundCalls = async () => {
        setOutboundLoading(true);
        try {
            const response = await fetch('/api/calls?limit=100');
            if (response.ok) {
                const data = await response.json();
                setOutboundCalls(data.calls);
                setOutboundStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch outbound calls:', error);
        } finally {
            setOutboundLoading(false);
        }
    };

    const fetchInboundCalls = async () => {
        setInboundLoading(true);
        try {
            const response = await fetch('/api/inbound/calls?limit=100');
            if (response.ok) {
                const data = await response.json();
                setInboundCalls(data.calls);
                setInboundStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch inbound calls:', error);
        } finally {
            setInboundLoading(false);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'outbound') {
            fetchOutboundCalls();
        } else {
            fetchInboundCalls();
        }
    };

    // ============================================
    // FORMATTERS
    // ============================================

    const formatDuration = (seconds: number | null | undefined) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1>AI Calls</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }} className="mt-1">
                        Monitor AI voice agent performance
                    </p>
                </div>
                <button className="btn-secondary" onClick={handleRefresh}>
                    <RefreshCcw className="w-[14px] h-[14px]" style={{ strokeWidth: 1.75 }} />
                    Refresh
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
                <button
                    onClick={() => setActiveTab('outbound')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        fontWeight: activeTab === 'outbound' ? 600 : 400,
                        background: activeTab === 'outbound' ? 'var(--card)' : 'transparent',
                        boxShadow: activeTab === 'outbound' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                        color: activeTab === 'outbound' ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                >
                    <PhoneOutgoing style={{ width: 15, height: 15, strokeWidth: 1.75 }} />
                    Outbound
                    {outboundStats && (
                        <span style={{
                            fontSize: '0.6875rem',
                            background: activeTab === 'outbound' ? '#8b5cf625' : 'transparent',
                            color: activeTab === 'outbound' ? '#8b5cf6' : 'var(--muted-foreground)',
                            padding: '1px 8px',
                            borderRadius: 999,
                            fontWeight: 600,
                        }}>
                            {outboundStats.totalCalls}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('inbound')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        fontWeight: activeTab === 'inbound' ? 600 : 400,
                        background: activeTab === 'inbound' ? 'var(--card)' : 'transparent',
                        boxShadow: activeTab === 'inbound' ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                        color: activeTab === 'inbound' ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                >
                    <PhoneIncoming style={{ width: 15, height: 15, strokeWidth: 1.75 }} />
                    Inbound
                    {inboundStats && (
                        <span style={{
                            fontSize: '0.6875rem',
                            background: activeTab === 'inbound' ? '#10b98125' : 'transparent',
                            color: activeTab === 'inbound' ? '#10b981' : 'var(--muted-foreground)',
                            padding: '1px 8px',
                            borderRadius: 999,
                            fontWeight: 600,
                        }}>
                            {inboundStats.totalCalls}
                        </span>
                    )}
                </button>
            </div>

            {/* ============================================ */}
            {/* OUTBOUND TAB */}
            {/* ============================================ */}
            {activeTab === 'outbound' && (
                <>
                    {/* Outbound Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-purple">
                                    <Bot />
                                </div>
                                <div>
                                    <div className="metric-sm">{outboundStats?.totalCalls || 0}</div>
                                    <div className="metric-label">Total Calls</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-blue">
                                    <Timer />
                                </div>
                                <div>
                                    <div className="metric-sm">{formatDuration(outboundStats?.avgDuration || 0)}</div>
                                    <div className="metric-label">Avg Duration</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-emerald">
                                    <Calendar />
                                </div>
                                <div>
                                    <div className="metric-sm">{outboundStats?.bookedCount || 0}</div>
                                    <div className="metric-label">Booked</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-emerald">
                                    <TrendingUp />
                                </div>
                                <div>
                                    <div className="metric-sm">{outboundStats?.bookingRate || 0}%</div>
                                    <div className="metric-label">Booking Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Outbound Calls List */}
                    <div className="card-static">
                        <div className="mb-4">
                            <h3>Outbound Call History</h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                                Outgoing AI calls to leads with outcomes and transcripts
                            </p>
                        </div>

                        {outboundLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                            </div>
                        ) : outboundCalls.length === 0 ? (
                            <div className="text-center py-12">
                                <Bot className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                                <h3 className="mb-1">No outbound calls yet</h3>
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                                    AI calls will appear here when leads are escalated
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {outboundCalls.map((call) => {
                                    const outcome = call.aiCallOutcome
                                        ? (OUTBOUND_OUTCOME_MAP[call.aiCallOutcome.toLowerCase()] || { label: call.aiCallOutcome, className: 'status-dead' })
                                        : null;

                                    return (
                                        <div
                                            key={call.id}
                                            className="list-row cursor-pointer"
                                            onClick={() => setSelectedOutbound(call)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="icon-box icon-box-sm icon-box-purple">
                                                    <Bot />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                                                        {call.firstName} {call.lastName}
                                                    </div>
                                                    <div className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                        <Phone style={{ width: 11, height: 11, strokeWidth: 1.75 }} />
                                                        {call.phone}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                        {formatDuration(call.aiCallDuration)}
                                                    </div>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Duration</div>
                                                </div>

                                                {outcome && (
                                                    <span className={`status-badge ${outcome.className}`}>
                                                        <span className="status-dot" />
                                                        {outcome.label}
                                                    </span>
                                                )}

                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', width: 100, textAlign: 'right' as const }}>
                                                    {call.aiCallStartedAt && formatDateTime(call.aiCallStartedAt)}
                                                </span>

                                                {(call.aiCallTranscript || call.aiCallRecordingUrl) && (
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedOutbound(call); }}
                                                    >
                                                        {call.aiCallRecordingUrl && <Volume2 style={{ width: 13, height: 13, strokeWidth: 1.75 }} />}
                                                        {call.aiCallTranscript && <FileText style={{ width: 13, height: 13, strokeWidth: 1.75 }} />}
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============================================ */}
            {/* INBOUND TAB */}
            {/* ============================================ */}
            {activeTab === 'inbound' && (
                <>
                    {/* Inbound Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box" style={{ background: '#10b98115', color: '#10b981' }}>
                                    <PhoneIncoming />
                                </div>
                                <div>
                                    <div className="metric-sm">{inboundStats?.totalCalls || 0}</div>
                                    <div className="metric-label">Inbound Calls</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-blue">
                                    <Bot />
                                </div>
                                <div>
                                    <div className="metric-sm">{inboundStats?.aiHandledRate || 0}%</div>
                                    <div className="metric-label">AI Handled</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-emerald">
                                    <Calendar />
                                </div>
                                <div>
                                    <div className="metric-sm">{inboundStats?.bookedCount || 0}</div>
                                    <div className="metric-label">Booked</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3">
                                <div className="icon-box" style={{ background: '#6366f115', color: '#6366f1' }}>
                                    <MessageSquare />
                                </div>
                                <div>
                                    <div className="metric-sm">{inboundStats?.messagesCount || 0}</div>
                                    <div className="metric-label">Messages</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inbound Calls List */}
                    <div className="card-static">
                        <div className="mb-4">
                            <h3>Inbound Call History</h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                                Incoming calls handled by your AI phone assistant
                            </p>
                        </div>

                        {inboundLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                            </div>
                        ) : inboundCalls.length === 0 ? (
                            <div className="text-center py-12">
                                <PhoneIncoming className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                                <h3 className="mb-1">No inbound calls yet</h3>
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                                    Enable the AI Phone Assistant in Settings to start receiving inbound calls
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {inboundCalls.map((call) => {
                                    const outcomeInfo = call.outcome
                                        ? INBOUND_OUTCOME_MAP[call.outcome]
                                        : null;
                                    const routeInfo = INBOUND_ROUTE_MAP[call.routeDecision] || INBOUND_ROUTE_MAP.ai_handled;
                                    const OutcomeIcon = outcomeInfo?.icon || Info;

                                    return (
                                        <div
                                            key={call.id}
                                            className="list-row cursor-pointer"
                                            onClick={() => setSelectedInbound(call)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="icon-box icon-box-sm"
                                                    style={{
                                                        background: `${routeInfo.color}15`,
                                                        color: routeInfo.color,
                                                    }}
                                                >
                                                    <PhoneIncoming />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                                                        {call.callerName || 'Unknown Caller'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                        <Phone style={{ width: 11, height: 11, strokeWidth: 1.75 }} />
                                                        {call.callerPhone}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Duration */}
                                                <div className="text-center">
                                                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                        {formatDuration(call.durationSeconds)}
                                                    </div>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Duration</div>
                                                </div>

                                                {/* Route badge */}
                                                <span
                                                    style={{
                                                        fontSize: '0.6875rem',
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        fontWeight: 500,
                                                        background: `${routeInfo.color}12`,
                                                        color: routeInfo.color,
                                                        border: `1px solid ${routeInfo.color}25`,
                                                    }}
                                                >
                                                    {routeInfo.label}
                                                </span>

                                                {/* Outcome badge */}
                                                {outcomeInfo && (
                                                    <span
                                                        className="flex items-center gap-1"
                                                        style={{
                                                            fontSize: '0.6875rem',
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            fontWeight: 500,
                                                            background: `${outcomeInfo.color}12`,
                                                            color: outcomeInfo.color,
                                                            border: `1px solid ${outcomeInfo.color}25`,
                                                        }}
                                                    >
                                                        <OutcomeIcon style={{ width: 11, height: 11 }} />
                                                        {outcomeInfo.label}
                                                    </span>
                                                )}

                                                {/* Follow-up indicator */}
                                                {call.followUpRequired && (
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: '#f59e0b',
                                                            flexShrink: 0,
                                                        }}
                                                        title="Follow-up required"
                                                    />
                                                )}

                                                {/* Time */}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', width: 100, textAlign: 'right' as const }}>
                                                    {call.callStartedAt && formatDateTime(call.callStartedAt)}
                                                </span>

                                                {/* Content indicators */}
                                                {(call.transcript || call.recordingUrl) && (
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedInbound(call); }}
                                                    >
                                                        {call.recordingUrl && <Volume2 style={{ width: 13, height: 13, strokeWidth: 1.75 }} />}
                                                        {call.transcript && <FileText style={{ width: 13, height: 13, strokeWidth: 1.75 }} />}
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============================================ */}
            {/* OUTBOUND DETAIL DIALOG */}
            {/* ============================================ */}
            <Dialog open={!!selectedOutbound} onOpenChange={(open) => !open && setSelectedOutbound(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ borderRadius: 16, padding: 24 }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                            <div className="icon-box icon-box-sm icon-box-purple">
                                <Bot />
                            </div>
                            Call with {selectedOutbound?.firstName} {selectedOutbound?.lastName}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-1" style={{ fontSize: '0.8125rem' }}>
                            {selectedOutbound?.aiCallStartedAt && formatDateTime(selectedOutbound.aiCallStartedAt)}
                            <span style={{ opacity: 0.3 }}>•</span>
                            {formatDuration(selectedOutbound?.aiCallDuration || 0)}
                            {selectedOutbound?.aiCallOutcome && (
                                <>
                                    <span style={{ opacity: 0.3 }}>•</span>
                                    <span className={`status-badge ${(OUTBOUND_OUTCOME_MAP[selectedOutbound.aiCallOutcome.toLowerCase()] || { className: 'status-dead' }).className}`}>
                                        <span className="status-dot" />
                                        {(OUTBOUND_OUTCOME_MAP[selectedOutbound.aiCallOutcome.toLowerCase()] || { label: selectedOutbound.aiCallOutcome }).label}
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <h4 style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>Contact Info</h4>
                            <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                <Phone style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                {selectedOutbound?.phone}
                            </div>
                        </div>

                        {selectedOutbound?.aiCallRecordingUrl && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Volume2 style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Call Recording
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16 }}>
                                    <audio controls className="w-full" src={selectedOutbound.aiCallRecordingUrl}>
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={selectedOutbound.aiCallRecordingUrl}
                                            download={`call-${selectedOutbound.id}.wav`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-secondary"
                                            style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
                                        >
                                            <Download style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedOutbound?.aiCallSummary && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <FileText style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Call Summary
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16, fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                                    {selectedOutbound.aiCallSummary}
                                </div>
                            </div>
                        )}

                        {selectedOutbound?.aiCallTranscript && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Mic style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Transcript
                                </h4>
                                <div style={{
                                    background: 'var(--muted)', borderRadius: 10, padding: 16,
                                    fontSize: '0.8125rem', whiteSpace: 'pre-wrap' as const,
                                    maxHeight: 384, overflowY: 'auto' as const,
                                    fontFamily: 'monospace', lineHeight: 1.7, color: 'var(--foreground)',
                                }}>
                                    {selectedOutbound.aiCallTranscript}
                                </div>
                            </div>
                        )}

                        {!selectedOutbound?.aiCallTranscript && !selectedOutbound?.aiCallRecordingUrl && (
                            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                                <Mic className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                                <p style={{ fontSize: '0.8125rem' }}>No recording or transcript available for this call</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ============================================ */}
            {/* INBOUND DETAIL DIALOG */}
            {/* ============================================ */}
            <Dialog open={!!selectedInbound} onOpenChange={(open) => !open && setSelectedInbound(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ borderRadius: 16, padding: 24 }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                            <div
                                className="icon-box icon-box-sm"
                                style={{
                                    background: '#10b98115',
                                    color: '#10b981',
                                }}
                            >
                                <PhoneIncoming />
                            </div>
                            {selectedInbound?.callerName || 'Unknown Caller'}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap" style={{ fontSize: '0.8125rem' }}>
                            {selectedInbound?.callStartedAt && formatDateTime(selectedInbound.callStartedAt)}
                            <span style={{ opacity: 0.3 }}>•</span>
                            {formatDuration(selectedInbound?.durationSeconds)}
                            {selectedInbound?.outcome && INBOUND_OUTCOME_MAP[selectedInbound.outcome] && (
                                <>
                                    <span style={{ opacity: 0.3 }}>•</span>
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        fontWeight: 500,
                                        background: `${INBOUND_OUTCOME_MAP[selectedInbound.outcome].color}12`,
                                        color: INBOUND_OUTCOME_MAP[selectedInbound.outcome].color,
                                    }}>
                                        {INBOUND_OUTCOME_MAP[selectedInbound.outcome].label}
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Caller Info */}
                        <div className="flex items-center gap-4">
                            <div>
                                <h4 style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 4 }}>Caller</h4>
                                <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                    <Phone style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                    {selectedInbound?.callerPhone}
                                </div>
                            </div>
                            {selectedInbound?.routeDecision && (
                                <div>
                                    <h4 style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 4 }}>Route</h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: INBOUND_ROUTE_MAP[selectedInbound.routeDecision]?.color || '#64748b',
                                    }}>
                                        {INBOUND_ROUTE_MAP[selectedInbound.routeDecision]?.label || selectedInbound.routeDecision}
                                    </span>
                                </div>
                            )}
                            {selectedInbound?.followUpRequired && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 12px',
                                    borderRadius: 8,
                                    background: '#f59e0b10',
                                    color: '#f59e0b',
                                    fontWeight: 500,
                                    border: '1px solid #f59e0b25',
                                }}>
                                    ⚡ Follow-up needed
                                </div>
                            )}
                        </div>

                        {/* Follow-up notes */}
                        {selectedInbound?.followUpNotes && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <MessageSquare style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Notes
                                </h4>
                                <div style={{ background: '#f59e0b08', borderRadius: 10, padding: 16, fontSize: '0.8125rem', lineHeight: 1.6, border: '1px solid #f59e0b15' }}>
                                    {selectedInbound.followUpNotes}
                                </div>
                            </div>
                        )}

                        {/* Recording Player */}
                        {selectedInbound?.recordingUrl && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Volume2 style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Call Recording
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16 }}>
                                    <audio controls className="w-full" src={selectedInbound.recordingUrl}>
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={selectedInbound.recordingUrl}
                                            download={`inbound-${selectedInbound.id}.wav`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-secondary"
                                            style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
                                        >
                                            <Download style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Call Summary */}
                        {selectedInbound?.callSummary && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <FileText style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    AI Summary
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16, fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                                    {selectedInbound.callSummary}
                                </div>
                            </div>
                        )}

                        {/* Transcript */}
                        {selectedInbound?.transcript && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Mic style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Transcript
                                </h4>
                                <div style={{
                                    background: 'var(--muted)', borderRadius: 10, padding: 16,
                                    fontSize: '0.8125rem', whiteSpace: 'pre-wrap' as const,
                                    maxHeight: 384, overflowY: 'auto' as const,
                                    fontFamily: 'monospace', lineHeight: 1.7, color: 'var(--foreground)',
                                }}>
                                    {selectedInbound.transcript}
                                </div>
                            </div>
                        )}

                        {/* No data state */}
                        {!selectedInbound?.transcript && !selectedInbound?.recordingUrl && !selectedInbound?.callSummary && (
                            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                                <Mic className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                                <p style={{ fontSize: '0.8125rem' }}>No recording or transcript available for this call</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
