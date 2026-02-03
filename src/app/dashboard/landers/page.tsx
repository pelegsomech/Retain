'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ExternalLink, Copy, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";

// Demo landing pages data
const demoPages = [
    {
        id: '1',
        name: 'Free Quote - Main',
        slug: 'free-quote',
        status: 'active' as const,
        leads: 127,
        conversionRate: 12.4,
        createdAt: '2026-01-15',
    },
    {
        id: '2',
        name: 'Spring Special 2026',
        slug: 'spring-special',
        status: 'active' as const,
        leads: 45,
        conversionRate: 8.7,
        createdAt: '2026-02-01',
    },
    {
        id: '3',
        name: 'Winter Campaign',
        slug: 'winter-sale',
        status: 'paused' as const,
        leads: 89,
        conversionRate: 15.2,
        createdAt: '2025-12-01',
    },
];

export default function LandersPage() {
    const [pages] = useState(demoPages);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const copyLink = (slug: string) => {
        const url = `${baseUrl}/l/demo-roofing/${slug}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Landing Pages</h1>
                    <p className="text-muted-foreground">Create and manage high-converting lead capture pages</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Landing Page
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Pages</CardDescription>
                        <CardTitle className="text-3xl">{pages.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active Pages</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {pages.filter(p => p.status === 'active').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Leads</CardDescription>
                        <CardTitle className="text-3xl">
                            {pages.reduce((sum, p) => sum + p.leads, 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Pages Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Landing Pages</CardTitle>
                    <CardDescription>Click a page to edit or view analytics</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Page Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead className="text-right">Leads</TableHead>
                                <TableHead className="text-right">Conv. Rate</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pages.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell className="font-medium">{page.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={page.status === 'active' ? 'default' : 'secondary'}>
                                            {page.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                /l/demo-roofing/{page.slug}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => copyLink(page.slug)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{page.leads}</TableCell>
                                    <TableCell className="text-right">{page.conversionRate}%</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <a href={`/l/demo-roofing/${page.slug}`} target="_blank">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Demo Links Info */}
            <Card className="border-dashed border-2 bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg">🎯 Demo Landing Pages</CardTitle>
                    <CardDescription>
                        Try out these demo pages to see the lead capture flow in action
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                            <div className="font-medium">Roofing - Free Quote</div>
                            <code className="text-xs text-muted-foreground">/l/demo-roofing/free-quote</code>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/l/demo-roofing/free-quote" target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </a>
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                            <div className="font-medium">Decking - Free Quote</div>
                            <code className="text-xs text-muted-foreground">/l/demo-decking/free-quote</code>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/l/demo-decking/free-quote" target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
