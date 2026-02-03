'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MoreHorizontal, CheckCircle, Clock, Bot, Calendar } from "lucide-react";

// Demo leads data
const demoLeads = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        phone: '(555) 123-4567',
        email: 'john@example.com',
        status: 'CLAIMED',
        source: 'free-quote',
        createdAt: '2026-02-02T21:15:00Z',
        claimedAt: '2026-02-02T21:15:45Z',
        claimedBy: 'human',
    },
    {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '(555) 987-6543',
        email: 'sarah.j@email.com',
        status: 'AI_QUALIFIED',
        source: 'spring-special',
        createdAt: '2026-02-02T20:30:00Z',
        claimedBy: 'ai',
    },
    {
        id: '3',
        firstName: 'Mike',
        lastName: 'Williams',
        phone: '(555) 456-7890',
        email: null,
        status: 'BOOKED',
        source: 'free-quote',
        createdAt: '2026-02-02T19:45:00Z',
        claimedBy: 'ai',
        appointmentDate: '2026-02-05T14:00:00Z',
    },
    {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        phone: '(555) 321-0987',
        email: 'emily.d@gmail.com',
        status: 'SMS_SENT',
        source: 'free-quote',
        createdAt: '2026-02-02T22:00:00Z',
    },
    {
        id: '5',
        firstName: 'Robert',
        lastName: 'Brown',
        phone: '(555) 654-3210',
        email: null,
        status: 'NEW',
        source: 'spring-special',
        createdAt: '2026-02-02T22:05:00Z',
    },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof CheckCircle }> = {
    NEW: { label: 'New', variant: 'outline', icon: Clock },
    SMS_SENT: { label: 'SMS Sent', variant: 'secondary', icon: Phone },
    CLAIMED: { label: 'Claimed', variant: 'default', icon: CheckCircle },
    AI_QUALIFIED: { label: 'AI Qualified', variant: 'default', icon: Bot },
    BOOKED: { label: 'Booked', variant: 'default', icon: Calendar },
};

function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Leads</h1>
                <p className="text-muted-foreground">View and manage all incoming leads</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Today</CardDescription>
                        <CardTitle className="text-3xl">{demoLeads.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Claimed by Human</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {demoLeads.filter(l => l.claimedBy === 'human').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>AI Handled</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                            {demoLeads.filter(l => l.claimedBy === 'ai').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Appointments</CardDescription>
                        <CardTitle className="text-3xl text-purple-600">
                            {demoLeads.filter(l => l.status === 'BOOKED').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Leads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Leads</CardTitle>
                    <CardDescription>Real-time lead pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Handled By</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {demoLeads.map((lead) => {
                                const status = statusConfig[lead.status] || statusConfig.NEW;
                                const StatusIcon = status.icon;

                                return (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {lead.firstName} {lead.lastName}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {lead.phone}
                                                    </span>
                                                    {lead.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {lead.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant} className="gap-1">
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {lead.source}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {lead.claimedBy === 'human' && (
                                                <Badge variant="outline" className="text-green-600">
                                                    Human (45s)
                                                </Badge>
                                            )}
                                            {lead.claimedBy === 'ai' && (
                                                <Badge variant="outline" className="text-blue-600">
                                                    <Bot className="h-3 w-3 mr-1" />
                                                    AI Agent
                                                </Badge>
                                            )}
                                            {!lead.claimedBy && (
                                                <span className="text-muted-foreground text-sm">Pending...</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatTimeAgo(lead.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
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
