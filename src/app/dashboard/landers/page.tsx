'use client';

import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

    // Shared form content for create and edit dialogs
    const renderForm = (isEdit: boolean) => (
        <div className="space-y-4 py-4">
            <div className="space-y-1.5">
                <Label htmlFor={isEdit ? 'edit-name' : 'name'} style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Page Name
                </Label>
                <Input
                    id={isEdit ? 'edit-name' : 'name'}
                    placeholder="Spring Roofing Campaign"
                    value={formData.name}
                    onChange={(e) => {
                        if (isEdit) {
                            setFormData(prev => ({ ...prev, name: e.target.value }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                name: e.target.value,
                                slug: generateSlug(e.target.value),
                            }));
                        }
                    }}
                    style={{ height: 36, fontSize: '0.8125rem', borderRadius: 8 }}
                />
            </div>
            {!isEdit && (
                <div className="space-y-1.5">
                    <Label htmlFor="slug" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>URL Slug</Label>
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>/l/{tenantSlug}/</span>
                        <Input
                            id="slug"
                            placeholder="spring-roofing"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            className="flex-1"
                            style={{ height: 36, fontSize: '0.8125rem', borderRadius: 8 }}
                        />
                    </div>
                </div>
            )}
            <div className="space-y-1.5">
                <Label htmlFor={isEdit ? 'edit-headline' : 'headline'} style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Headline
                </Label>
                <Input
                    id={isEdit ? 'edit-headline' : 'headline'}
                    placeholder="Get a Free Roof Inspection Today!"
                    value={formData.headline}
                    onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                    style={{ height: 36, fontSize: '0.8125rem', borderRadius: 8 }}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={isEdit ? 'edit-subheadline' : 'subheadline'} style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Subheadline (optional)
                </Label>
                <Input
                    id={isEdit ? 'edit-subheadline' : 'subheadline'}
                    placeholder="Licensed & insured. 20+ years experience."
                    value={formData.subheadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
                    style={{ height: 36, fontSize: '0.8125rem', borderRadius: 8 }}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={isEdit ? 'edit-cta' : 'cta'} style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    CTA Button Text
                </Label>
                <Input
                    id={isEdit ? 'edit-cta' : 'cta'}
                    placeholder="Get Your Free Quote"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    style={{ height: 36, fontSize: '0.8125rem', borderRadius: 8 }}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1>Landing Pages</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }} className="mt-1">
                        Create and manage your lead capture pages
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <button className="btn-primary">
                            <Plus className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }} />
                            Create Page
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg" style={{ borderRadius: 16, padding: 24 }}>
                        <DialogHeader>
                            <DialogTitle style={{ fontSize: '1rem', fontWeight: 600 }}>Create Landing Page</DialogTitle>
                            <DialogDescription style={{ fontSize: '0.8125rem' }}>
                                Set up a new lead capture page for your campaigns
                            </DialogDescription>
                        </DialogHeader>
                        {renderForm(false)}
                        <DialogFooter>
                            <button className="btn-secondary" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleCreateLander}
                                disabled={isCreating || !formData.name || !formData.headline}
                            >
                                {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Create Page
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-blue">
                            <FileText />
                        </div>
                        <div>
                            <div className="metric-sm">{landers.length}</div>
                            <div className="metric-label">Total Pages</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-emerald">
                            <Eye />
                        </div>
                        <div>
                            <div className="metric-sm">{activePages}</div>
                            <div className="metric-label">Active</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="icon-box icon-box-purple">
                            <Users />
                        </div>
                        <div>
                            <div className="metric-sm">{totalLeads}</div>
                            <div className="metric-label">Total Leads</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Landing Pages List */}
            <div className="card-static">
                <div className="mb-4">
                    <h3>Your Pages</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                        Manage and monitor your landing pages
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                ) : landers.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        <h3 className="mb-1">No landing pages yet</h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', marginBottom: 16 }}>
                            Create your first page to start capturing leads
                        </p>
                        <button className="btn-primary" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }} />
                            Create Your First Page
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {landers.map((lander) => (
                            <div key={lander.id} className="list-row">
                                <div className="flex items-center gap-3">
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: lander.isActive ? 'var(--foreground)' : 'var(--border)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{lander.name}</span>
                                            <span className={`status-badge ${lander.isActive ? 'status-booked' : 'status-dead'}`}>
                                                <span className="status-dot" />
                                                {lander.isActive ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            /l/{tenantSlug}/{lander.slug}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{lander.leadCount}</div>
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Leads</div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button className="btn-icon" onClick={() => copyUrl(lander.slug)} title="Copy URL">
                                            <Copy style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                        </button>
                                        <a
                                            href={`/l/${tenantSlug}/${lander.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-icon"
                                        >
                                            <ExternalLink style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                        </a>
                                        <button className="btn-icon" onClick={() => openEditDialog(lander)}>
                                            <Edit style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                        </button>
                                        <Switch
                                            checked={lander.isActive}
                                            onCheckedChange={() => handleToggleActive(lander)}
                                        />
                                        <button
                                            className="btn-icon"
                                            style={{ color: 'var(--muted-foreground)' }}
                                            onClick={() => handleDeleteLander(lander.id)}
                                        >
                                            <Trash2 style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingLander} onOpenChange={(open) => !open && setEditingLander(null)}>
                <DialogContent className="max-w-lg" style={{ borderRadius: 16, padding: 24 }}>
                    <DialogHeader>
                        <DialogTitle style={{ fontSize: '1rem', fontWeight: 600 }}>Edit Landing Page</DialogTitle>
                        <DialogDescription style={{ fontSize: '0.8125rem' }}>
                            Update your landing page settings
                        </DialogDescription>
                    </DialogHeader>
                    {renderForm(true)}
                    <DialogFooter>
                        <button className="btn-secondary" onClick={() => setEditingLander(null)}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleUpdateLander} disabled={isCreating}>
                            {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Save Changes
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
