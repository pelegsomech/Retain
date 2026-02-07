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
    Mic
} from "lucide-react";

interface Call {
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

interface CallStats {
    totalCalls: number;
    avgDuration: number;
    bookedCount: number;
    bookingRate: number;
}

const OUTCOME_MAP: Record<string, { label: string; className: string }> = {
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

export default function CallsPage() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [stats, setStats] = useState<CallStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/calls?limit=100');
            if (response.ok) {
                const data = await response.json();
                setCalls(data.calls);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch calls:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number | null) => {
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
                <button className="btn-secondary" onClick={fetchCalls}>
                    <RefreshCcw className="w-[14px] h-[14px]" style={{ strokeWidth: 1.75 }} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-purple">
                            <Bot />
                        </div>
                        <div>
                            <div className="metric-sm">{stats?.totalCalls || 0}</div>
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
                            <div className="metric-sm">{formatDuration(stats?.avgDuration || 0)}</div>
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
                            <div className="metric-sm">{stats?.bookedCount || 0}</div>
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
                            <div className="metric-sm">{stats?.bookingRate || 0}%</div>
                            <div className="metric-label">Booking Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calls List */}
            <div className="card-static">
                <div className="mb-4">
                    <h3>Call History</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                        Recent AI calls with outcomes and transcripts
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                ) : calls.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        <h3 className="mb-1">No AI calls yet</h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                            AI calls will appear here when leads are escalated
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {calls.map((call) => {
                            const outcome = call.aiCallOutcome
                                ? (OUTCOME_MAP[call.aiCallOutcome.toLowerCase()] || { label: call.aiCallOutcome, className: 'status-dead' })
                                : null;

                            return (
                                <div
                                    key={call.id}
                                    className="list-row cursor-pointer"
                                    onClick={() => setSelectedCall(call)}
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
                                        {/* Duration */}
                                        <div className="text-center">
                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                {formatDuration(call.aiCallDuration)}
                                            </div>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Duration</div>
                                        </div>

                                        {/* Outcome */}
                                        {outcome && (
                                            <span className={`status-badge ${outcome.className}`}>
                                                <span className="status-dot" />
                                                {outcome.label}
                                            </span>
                                        )}

                                        {/* Time */}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', width: 100, textAlign: 'right' as const }}>
                                            {call.aiCallStartedAt && formatDateTime(call.aiCallStartedAt)}
                                        </span>

                                        {/* Content indicators */}
                                        {(call.aiCallTranscript || call.aiCallRecordingUrl) && (
                                            <button
                                                className="btn-secondary"
                                                style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedCall(call); }}
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

            {/* Transcript Dialog */}
            <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ borderRadius: 16, padding: 24 }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                            <div className="icon-box icon-box-sm icon-box-purple">
                                <Bot />
                            </div>
                            Call with {selectedCall?.firstName} {selectedCall?.lastName}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-1" style={{ fontSize: '0.8125rem' }}>
                            {selectedCall?.aiCallStartedAt && formatDateTime(selectedCall.aiCallStartedAt)}
                            <span style={{ opacity: 0.3 }}>•</span>
                            {formatDuration(selectedCall?.aiCallDuration || 0)}
                            {selectedCall?.aiCallOutcome && (
                                <>
                                    <span style={{ opacity: 0.3 }}>•</span>
                                    <span className={`status-badge ${(OUTCOME_MAP[selectedCall.aiCallOutcome.toLowerCase()] || { className: 'status-dead' }).className}`}>
                                        <span className="status-dot" />
                                        {(OUTCOME_MAP[selectedCall.aiCallOutcome.toLowerCase()] || { label: selectedCall.aiCallOutcome }).label}
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Contact Info */}
                        <div>
                            <h4 style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>Contact Info</h4>
                            <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                <Phone style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                {selectedCall?.phone}
                            </div>
                        </div>

                        {/* Recording Player */}
                        {selectedCall?.aiCallRecordingUrl && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Volume2 style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Call Recording
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16 }}>
                                    <audio
                                        controls
                                        className="w-full"
                                        src={selectedCall.aiCallRecordingUrl}
                                    >
                                        Your browser does not support the audio element.
                                    </audio>
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={selectedCall.aiCallRecordingUrl}
                                            download={`call-${selectedCall.id}.wav`}
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
                        {selectedCall?.aiCallSummary && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <FileText style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Call Summary
                                </h4>
                                <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 16, fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                                    {selectedCall.aiCallSummary}
                                </div>
                            </div>
                        )}

                        {/* Transcript */}
                        {selectedCall?.aiCallTranscript && (
                            <div>
                                <h4 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: 6 }}>
                                    <Mic style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                    Transcript
                                </h4>
                                <div style={{
                                    background: 'var(--muted)',
                                    borderRadius: 10,
                                    padding: 16,
                                    fontSize: '0.8125rem',
                                    whiteSpace: 'pre-wrap' as const,
                                    maxHeight: 384,
                                    overflowY: 'auto' as const,
                                    fontFamily: 'monospace',
                                    lineHeight: 1.7,
                                    color: 'var(--foreground)',
                                }}>
                                    {selectedCall.aiCallTranscript}
                                </div>
                            </div>
                        )}

                        {/* No data state */}
                        {!selectedCall?.aiCallTranscript && !selectedCall?.aiCallRecordingUrl && (
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
