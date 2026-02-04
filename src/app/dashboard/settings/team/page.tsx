'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Plus,
    Loader2,
    Phone,
    Mail,
    Trash2,
    MessageSquare,
    CheckCircle,
    XCircle,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface TeamMember {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: string;
    receiveSMS: boolean;
    isActive: boolean;
    createdAt: string;
}

export default function TeamPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({
        name: '',
        phone: '',
        email: '',
        role: 'sales',
    });

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('/api/team');
            if (response.ok) {
                const data = await response.json();
                setTeamMembers(data.teamMembers || []);
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMember.name || !newMember.phone) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember),
            });

            if (response.ok) {
                const data = await response.json();
                setTeamMembers(prev => [data.teamMember, ...prev]);
                setNewMember({ name: '', phone: '', email: '', role: 'sales' });
                setShowAddForm(false);
            }
        } catch (error) {
            console.error('Failed to add team member:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleSMS = async (member: TeamMember) => {
        try {
            const response = await fetch('/api/team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: member.id,
                    receiveSMS: !member.receiveSMS,
                }),
            });

            if (response.ok) {
                setTeamMembers(prev =>
                    prev.map(m =>
                        m.id === member.id ? { ...m, receiveSMS: !m.receiveSMS } : m
                    )
                );
            }
        } catch (error) {
            console.error('Failed to update team member:', error);
        }
    };

    const handleDelete = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        try {
            const response = await fetch(`/api/team?id=${memberId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTeamMembers(prev => prev.filter(m => m.id !== memberId));
            }
        } catch (error) {
            console.error('Failed to delete team member:', error);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-700';
            case 'manager': return 'bg-blue-100 text-blue-700';
            case 'sales': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#9E9E9E]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/settings"
                    className="w-10 h-10 rounded-lg border border-[#EEEEEE] flex items-center justify-center hover:bg-[#FAFAFA] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Team Members</h1>
                    <p className="text-[#666666]">Manage who receives lead claim notifications</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                    disabled={showAddForm}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team Member
                </Button>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
                <Card className="border-2 border-black">
                    <CardHeader>
                        <CardTitle className="text-lg">Add Team Member</CardTitle>
                        <CardDescription>
                            This person will receive SMS notifications when new leads come in
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="John Smith"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    placeholder="+1 555 123 4567"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@company.com"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="sales">Sales Rep</option>
                                    <option value="manager">Manager</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewMember({ name: '', phone: '', email: '', role: 'sales' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddMember}
                                disabled={!newMember.name || !newMember.phone || isSaving}
                                className="btn-primary"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Member'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Team Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                        <Badge variant="outline" className="ml-2">
                            {teamMembers.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Team members with SMS enabled will receive claim links when leads come in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-12 text-[#666666]">
                            <Users className="w-12 h-12 mx-auto mb-3 text-[#CCCCCC]" />
                            <p className="font-medium">No team members yet</p>
                            <p className="text-sm mt-1">Add your first team member to start receiving lead notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-[#EEEEEE] hover:border-[#CCCCCC] transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-[#EEEEEE] flex items-center justify-center text-lg font-semibold">
                                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{member.name}</span>
                                            <Badge className={getRoleBadgeColor(member.role)}>
                                                {member.role}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-[#666666]">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {member.phone}
                                            </span>
                                            {member.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {member.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* SMS Toggle */}
                                    <button
                                        onClick={() => handleToggleSMS(member)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${member.receiveSMS
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        title={member.receiveSMS ? 'Click to disable SMS' : 'Click to enable SMS'}
                                    >
                                        {member.receiveSMS ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <MessageSquare className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                <MessageSquare className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                        title="Remove team member"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Box */}
            <div className="p-4 bg-[#FAFAFA] rounded-lg border border-[#EEEEEE]">
                <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    How SMS Claims Work
                </h4>
                <ul className="mt-2 text-sm text-[#666666] space-y-1">
                    <li>• When a new lead comes in, all SMS-enabled team members receive a claim link</li>
                    <li>• First person to click the link claims the lead</li>
                    <li>• If no one claims within the timeout, AI agent takes over</li>
                    <li>• Configure timeout in Settings → Business Configuration</li>
                </ul>
            </div>
        </div>
    );
}
