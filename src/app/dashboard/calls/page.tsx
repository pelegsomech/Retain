'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Phone, Play, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

// Demo calls data
const demoCalls = [
    {
        id: '1',
        leadName: 'Sarah Johnson',
        phone: '(555) 987-6543',
        status: 'completed',
        outcome: 'booked',
        duration: '4:23',
        startedAt: '2026-02-02T20:32:00Z',
    },
    {
        id: '2',
        leadName: 'Mike Williams',
        phone: '(555) 456-7890',
        status: 'completed',
        outcome: 'booked',
        duration: '3:45',
        startedAt: '2026-02-02T19:48:00Z',
    },
    {
        id: '3',
        leadName: 'Lisa Anderson',
        phone: '(555) 111-2222',
        status: 'completed',
        outcome: 'not_interested',
        duration: '1:12',
        startedAt: '2026-02-02T18:30:00Z',
    },
    {
        id: '4',
        leadName: 'James Wilson',
        phone: '(555) 333-4444',
        status: 'no_answer',
        outcome: null,
        duration: '0:30',
        startedAt: '2026-02-02T17:15:00Z',
    },
];

const outcomeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
    booked: { label: 'Booked', variant: 'default', icon: Calendar },
    not_interested: { label: 'Not Interested', variant: 'secondary', icon: XCircle },
    callback: { label: 'Callback Scheduled', variant: 'outline', icon: Phone },
};

export default function CallsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">AI Calls</h1>
                <p className="text-muted-foreground">Monitor AI voice agent calls and outcomes</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Calls Today</CardDescription>
                        <CardTitle className="text-3xl">{demoCalls.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Appointments Booked</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {demoCalls.filter(c => c.outcome === 'booked').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Call Duration</CardDescription>
                        <CardTitle className="text-3xl">2:52</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Booking Rate</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">50%</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Calls Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Calls</CardTitle>
                    <CardDescription>AI voice agent call history</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lead</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {demoCalls.map((call) => {
                                const outcome = call.outcome ? outcomeConfig[call.outcome] : null;

                                return (
                                    <TableRow key={call.id}>
                                        <TableCell className="font-medium">{call.leadName}</TableCell>
                                        <TableCell className="text-muted-foreground">{call.phone}</TableCell>
                                        <TableCell>
                                            {call.status === 'completed' ? (
                                                <Badge variant="outline" className="text-green-600">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-yellow-600">
                                                    <Phone className="h-3 w-3 mr-1" />
                                                    No Answer
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {outcome ? (
                                                <Badge variant={outcome.variant}>
                                                    <outcome.icon className="h-3 w-3 mr-1" />
                                                    {outcome.label}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {call.duration}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <Play className="h-4 w-4 mr-1" />
                                                Play
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
