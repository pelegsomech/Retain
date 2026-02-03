'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    CheckCircle,
    XCircle,
    Calendar,
    RefreshCcw,
    Play,
    FileText,
    TrendingUp,
    Timer
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
    createdAt: string;
}

interface CallStats {
    totalCalls: number;
    avgDuration: number;
    bookedCount: number;
    bookingRate: number;
}

const OUTCOME_COLORS: Record<string, string> = {
    booked: 'bg-emerald-100 text-emerald-800',
    appointment_scheduled: 'bg-emerald-100 text-emerald-800',
    callback: 'bg-orange-100 text-orange-800',
    reschedule: 'bg-orange-100 text-orange-800',
    not_interested: 'bg-red-100 text-red-800',
    declined: 'bg-red-100 text-red-800',
    voicemail: 'bg-gray-100 text-gray-800',
    no_answer: 'bg-gray-100 text-gray-800',
    qualified: 'bg-blue-100 text-blue-800',
};

const OUTCOME_LABELS: Record<string, string> = {
    booked: 'Booked',
    appointment_scheduled: 'Booked',
    callback: 'Callback',
    reschedule: 'Reschedule',
    not_interested: 'Not Interested',
    declined: 'Declined',
    voicemail: 'Voicemail',
    no_answer: 'No Answer',
    qualified: 'Qualified',
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

    const getOutcomeIcon = (outcome: string | null) => {
        switch (outcome?.toLowerCase()) {
            case 'booked':
            case 'appointment_scheduled':
                return <Calendar className="h-4 w-4" />;
            case 'callback':
            case 'reschedule':
                return <Clock className="h-4 w-4" />;
            case 'not_interested':
            case 'declined':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Phone className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI Calls</h1>
                    <p className="text-muted-foreground">Monitor AI voice agent performance</p>
                </div>
                <Button variant="outline" onClick={fetchCalls}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
                                <div className="text-sm text-muted-foreground">Total Calls</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Timer className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{formatDuration(stats?.avgDuration || 0)}</div>
                                <div className="text-sm text-muted-foreground">Avg Duration</div>
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
                                <div className="text-2xl font-bold">{stats?.bookedCount || 0}</div>
                                <div className="text-sm text-muted-foreground">Booked</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats?.bookingRate || 0}%</div>
                                <div className="text-sm text-muted-foreground">Booking Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calls List */}
            <Card>
                <CardHeader>
                    <CardTitle>Call History</CardTitle>
                    <CardDescription>Recent AI calls with outcomes and transcripts</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : calls.length === 0 ? (
                        <div className="text-center py-12">
                            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No AI calls yet</h3>
                            <p className="text-muted-foreground">
                                AI calls will appear here when leads are escalated
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {calls.map((call) => (
                                <div
                                    key={call.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedCall(call)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {call.firstName} {call.lastName}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                {call.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Duration */}
                                        <div className="text-center">
                                            <div className="font-semibold">{formatDuration(call.aiCallDuration)}</div>
                                            <div className="text-xs text-muted-foreground">Duration</div>
                                        </div>

                                        {/* Outcome */}
                                        {call.aiCallOutcome && (
                                            <Badge className={`${OUTCOME_COLORS[call.aiCallOutcome.toLowerCase()] || 'bg-gray-100'} flex items-center gap-1`}>
                                                {getOutcomeIcon(call.aiCallOutcome)}
                                                {OUTCOME_LABELS[call.aiCallOutcome.toLowerCase()] || call.aiCallOutcome}
                                            </Badge>
                                        )}

                                        {/* Time */}
                                        <div className="text-sm text-muted-foreground w-32 text-right">
                                            {call.aiCallStartedAt && formatDateTime(call.aiCallStartedAt)}
                                        </div>

                                        {/* Transcript indicator */}
                                        {call.aiCallTranscript && (
                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedCall(call); }}>
                                                <FileText className="h-4 w-4 mr-1" />
                                                Transcript
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transcript Dialog */}
            <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Call with {selectedCall?.firstName} {selectedCall?.lastName}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCall?.aiCallStartedAt && formatDateTime(selectedCall.aiCallStartedAt)}
                            {' • '}
                            {formatDuration(selectedCall?.aiCallDuration || 0)}
                            {selectedCall?.aiCallOutcome && (
                                <>
                                    {' • '}
                                    <Badge className={OUTCOME_COLORS[selectedCall.aiCallOutcome.toLowerCase()] || 'bg-gray-100'}>
                                        {OUTCOME_LABELS[selectedCall.aiCallOutcome.toLowerCase()] || selectedCall.aiCallOutcome}
                                    </Badge>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <h4 className="font-medium mb-2">Contact Info</h4>
                            <div className="text-sm text-muted-foreground">
                                <Phone className="inline h-3 w-3 mr-1" />
                                {selectedCall?.phone}
                            </div>
                        </div>

                        {selectedCall?.aiCallTranscript && (
                            <div>
                                <h4 className="font-medium mb-2">Transcript</h4>
                                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {selectedCall.aiCallTranscript}
                                </div>
                            </div>
                        )}

                        {!selectedCall?.aiCallTranscript && (
                            <div className="text-center py-8 text-muted-foreground">
                                No transcript available for this call
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
