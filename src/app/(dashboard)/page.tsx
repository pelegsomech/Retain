import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Calendar, Clock } from "lucide-react";

// Force dynamic rendering - Clerk requires runtime env vars
export const dynamic = 'force-dynamic';

// Placeholder metrics for dashboard
const metrics = [
    {
        title: "Total Leads",
        value: "0",
        description: "This month",
        icon: Users,
        trend: "+0%",
    },
    {
        title: "Claimed by Human",
        value: "0",
        description: "Within 60s",
        icon: Clock,
        trend: "0%",
    },
    {
        title: "AI Calls Made",
        value: "0",
        description: "Auto-escalated",
        icon: Phone,
        trend: "+0%",
    },
    {
        title: "Appointments Booked",
        value: "0",
        description: "Conversion rate: 0%",
        icon: Calendar,
        trend: "+0%",
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
                <p className="text-muted-foreground">
                    Real-time lead flow and escalation metrics
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {metric.title}
                            </CardTitle>
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {metric.trend}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                    {metric.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>
                            Live feed of incoming leads and their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No leads yet. Create a landing page to start capturing leads.
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Speed to Lead</CardTitle>
                        <CardDescription>
                            Average response times this week
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            Not enough data to display
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
