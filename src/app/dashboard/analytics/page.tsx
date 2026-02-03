'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Users, Phone, Calendar, Target, Zap } from "lucide-react";

// Demo analytics data
const metrics = {
    speedToLead: { value: 23, unit: 's', change: -15, label: 'Avg. Speed to Lead' },
    humanClaimRate: { value: 68, unit: '%', change: 5, label: 'Human Claim Rate' },
    aiBookingRate: { value: 42, unit: '%', change: 12, label: 'AI Booking Rate' },
    totalLeadsToday: { value: 47, unit: '', change: 23, label: 'Leads Today' },
};

const weeklyData = [
    { day: 'Mon', leads: 32, claimed: 24, booked: 12 },
    { day: 'Tue', leads: 41, claimed: 28, booked: 15 },
    { day: 'Wed', leads: 38, claimed: 26, booked: 14 },
    { day: 'Thu', leads: 45, claimed: 31, booked: 18 },
    { day: 'Fri', leads: 52, claimed: 38, booked: 22 },
    { day: 'Sat', leads: 28, claimed: 19, booked: 9 },
    { day: 'Sun', leads: 21, claimed: 14, booked: 7 },
];

const topSources = [
    { name: 'free-quote', leads: 127, conversion: 14.2 },
    { name: 'spring-special', leads: 89, conversion: 18.7 },
    { name: 'google-ads-1', leads: 64, conversion: 11.3 },
    { name: 'facebook-retarget', leads: 45, conversion: 22.1 },
];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">Lead flow and conversion performance</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
                {Object.entries(metrics).map(([key, metric]) => (
                    <Card key={key}>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                {key === 'speedToLead' && <Clock className="h-4 w-4" />}
                                {key === 'humanClaimRate' && <Users className="h-4 w-4" />}
                                {key === 'aiBookingRate' && <Phone className="h-4 w-4" />}
                                {key === 'totalLeadsToday' && <Target className="h-4 w-4" />}
                                {metric.label}
                            </CardDescription>
                            <div className="flex items-baseline gap-2">
                                <CardTitle className="text-3xl">
                                    {metric.value}{metric.unit}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={metric.change > 0
                                        ? (key === 'speedToLead' ? 'text-red-500' : 'text-green-500')
                                        : (key === 'speedToLead' ? 'text-green-500' : 'text-red-500')
                                    }
                                >
                                    {metric.change > 0 && key !== 'speedToLead' && <TrendingUp className="h-3 w-3 mr-1" />}
                                    {metric.change < 0 && key === 'speedToLead' && <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(metric.change)}%
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* Weekly Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Performance</CardTitle>
                        <CardDescription>Lead volume and conversion over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {weeklyData.map((day) => (
                                <div key={day.day} className="flex items-center gap-4">
                                    <div className="w-10 text-sm font-medium text-muted-foreground">
                                        {day.day}
                                    </div>
                                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(day.leads / 60) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-16 text-sm text-right">
                                        <span className="font-medium">{day.leads}</span>
                                        <span className="text-muted-foreground"> leads</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Sources */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Landing Pages</CardTitle>
                        <CardDescription>Best performing lead sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topSources.map((source, i) => (
                                <div key={source.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{source.name}</div>
                                            <div className="text-sm text-muted-foreground">{source.leads} leads</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600">
                                        {source.conversion}% conv.
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Speed to Lead Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Speed to Lead Breakdown
                    </CardTitle>
                    <CardDescription>
                        How fast leads are being claimed or handed to AI
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="text-4xl font-bold text-green-600">68%</div>
                            <div className="text-sm text-muted-foreground mt-2">Claimed under 60s</div>
                            <div className="text-xs text-green-600 mt-1">Human response</div>
                        </div>
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                            <div className="text-4xl font-bold text-blue-600">32%</div>
                            <div className="text-sm text-muted-foreground mt-2">Escalated to AI</div>
                            <div className="text-xs text-blue-600 mt-1">After 60s timeout</div>
                        </div>
                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                            <div className="text-4xl font-bold text-purple-600">42%</div>
                            <div className="text-sm text-muted-foreground mt-2">AI → Booking</div>
                            <div className="text-xs text-purple-600 mt-1">Conversion rate</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
