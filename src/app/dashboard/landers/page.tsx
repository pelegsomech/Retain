'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Plus,
    ExternalLink,
    Edit,
    Trash2,
    Loader2,
    Copy,
    Eye,
    FileText,
    Users,
    BarChart3
} from "lucide-react";

interface Lander {
    id: string;
    slug: string;
    name: string;
    headline: string;
    subheadline: string | null;
    ctaText: string;
    isActive: boolean;
    leadCount: number;
    createdAt: string;
}

interface LandersPageProps {
    tenantSlug?: string;
}

export default function LandersPage() {
    const [landers, setLanders] = useState<Lander[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingLander, setEditingLander] = useState<Lander | null>(null);
    const [tenantSlug, setTenantSlug] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        headline: '',
        subheadline: '',
        ctaText: 'Get Your Free Quote',
        isActive: true,
    });

    useEffect(() => {
        fetchLanders();
        fetchTenant();
    }, []);

    const fetchTenant = async () => {
        try {
            const response = await fetch('/api/tenants');
            if (response.ok) {
                const data = await response.json();
                setTenantSlug(data.tenant.slug);
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
        }
    };

    const fetchLanders = async () => {
        try {
            const response = await fetch('/api/landers');
            if (response.ok) {
                const data = await response.json();
                setLanders(data.landers);
            }
        } catch (error) {
            console.error('Failed to fetch landers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLander = async () => {
        setIsCreating(true);
        try {
            const response = await fetch('/api/landers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchLanders();
                setCreateDialogOpen(false);
                resetForm();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create landing page');
            }
        } catch (error) {
            console.error('Failed to create lander:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateLander = async () => {
        if (!editingLander) return;
        setIsCreating(true);
        try {
            const response = await fetch(`/api/landers/${editingLander.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchLanders();
                setEditingLander(null);
                resetForm();
            }
        } catch (error) {
            console.error('Failed to update lander:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteLander = async (id: string) => {
        if (!confirm('Are you sure you want to delete this landing page?')) return;

        try {
            const response = await fetch(`/api/landers/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchLanders();
            }
        } catch (error) {
            console.error('Failed to delete lander:', error);
        }
    };

    const handleToggleActive = async (lander: Lander) => {
        try {
            await fetch(`/api/landers/${lander.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !lander.isActive }),
            });
            await fetchLanders();
        } catch (error) {
            console.error('Failed to toggle lander:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            headline: '',
            subheadline: '',
            ctaText: 'Get Your Free Quote',
            isActive: true,
        });
    };

    const openEditDialog = (lander: Lander) => {
        setEditingLander(lander);
        setFormData({
            name: lander.name,
            slug: lander.slug,
            headline: lander.headline,
            subheadline: lander.subheadline || '',
            ctaText: lander.ctaText,
            isActive: lander.isActive,
        });
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    const copyUrl = (slug: string) => {
        const url = `${window.location.origin}/l/${tenantSlug}/${slug}`;
        navigator.clipboard.writeText(url);
    };

    const totalLeads = landers.reduce((sum, l) => sum + l.leadCount, 0);
    const activePages = landers.filter(l => l.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Landing Pages</h1>
                    <p className="text-muted-foreground">Create and manage your lead capture pages</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Page
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Landing Page</DialogTitle>
                            <DialogDescription>
                                Set up a new lead capture page for your campaigns
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Page Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Spring Roofing Campaign"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                            slug: generateSlug(e.target.value),
                                        }));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">/l/{tenantSlug}/</span>
                                    <Input
                                        id="slug"
                                        placeholder="spring-roofing"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="headline">Headline</Label>
                                <Input
                                    id="headline"
                                    placeholder="Get a Free Roof Inspection Today!"
                                    value={formData.headline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subheadline">Subheadline (optional)</Label>
                                <Input
                                    id="subheadline"
                                    placeholder="Licensed & insured. 20+ years experience."
                                    value={formData.subheadline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cta">CTA Button Text</Label>
                                <Input
                                    id="cta"
                                    placeholder="Get Your Free Quote"
                                    value={formData.ctaText}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateLander} disabled={isCreating || !formData.name || !formData.headline}>
                                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Page
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{landers.length}</div>
                                <div className="text-sm text-muted-foreground">Total Pages</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Eye className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{activePages}</div>
                                <div className="text-sm text-muted-foreground">Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalLeads}</div>
                                <div className="text-sm text-muted-foreground">Total Leads</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Landing Pages List */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Pages</CardTitle>
                    <CardDescription>Manage and monitor your landing pages</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : landers.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No landing pages yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first page to start capturing leads</p>
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Page
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {landers.map((lander) => (
                                <div
                                    key={lander.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${lander.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {lander.name}
                                                <Badge variant={lander.isActive ? 'default' : 'secondary'} className="text-xs">
                                                    {lander.isActive ? 'Active' : 'Draft'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                /l/{tenantSlug}/{lander.slug}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="font-semibold">{lander.leadCount}</div>
                                            <div className="text-xs text-muted-foreground">Leads</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => copyUrl(lander.slug)}
                                                title="Copy URL"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                asChild
                                            >
                                                <a href={`/l/${tenantSlug}/${lander.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openEditDialog(lander)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={lander.isActive}
                                                onCheckedChange={() => handleToggleActive(lander)}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteLander(lander.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingLander} onOpenChange={(open) => !open && setEditingLander(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Landing Page</DialogTitle>
                        <DialogDescription>Update your landing page settings</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Page Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-headline">Headline</Label>
                            <Input
                                id="edit-headline"
                                value={formData.headline}
                                onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-subheadline">Subheadline</Label>
                            <Input
                                id="edit-subheadline"
                                value={formData.subheadline}
                                onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cta">CTA Button Text</Label>
                            <Input
                                id="edit-cta"
                                value={formData.ctaText}
                                onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingLander(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateLander} disabled={isCreating}>
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
