'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { type AtomicConfig } from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
}

/**
 * Linguistic Map Section
 * Configures: nouns, verbs, titles used in AI conversations
 */
export function LinguisticMapSection({ config, onChange }: Props) {
    const lm = config.linguistic_map

    const updateField = <K extends keyof typeof lm>(key: K, value: typeof lm[K]) => {
        onChange({
            linguistic_map: {
                ...lm,
                [key]: value,
            },
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Language & Terminology
                </CardTitle>
                <CardDescription>
                    Customize the vocabulary the AI uses in conversations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preview */}
                <div className="p-4 bg-muted rounded-lg text-sm">
                    <p className="text-muted-foreground mb-2">AI will say things like:</p>
                    <p className="italic">
                        "I'll get a <span className="font-semibold text-blue-600">{lm.specialist_title || 'specialist'}</span> out
                        there to take a look at the <span className="font-semibold text-blue-600">{lm.noun_singular || 'project'}</span>.
                        We can schedule a <span className="font-semibold text-blue-600">{lm.visit_title || 'consultation'}</span> to
                        <span className="font-semibold text-blue-600"> {lm.primary_action_verb || 'help with'}</span> your
                        <span className="font-semibold text-blue-600"> {lm.noun_plural || 'projects'}</span>."
                    </p>
                </div>

                {/* Nouns */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="noun_singular">
                            Noun (Singular)
                            <Badge variant="outline" className="ml-2 text-xs">the thing you work on</Badge>
                        </Label>
                        <Input
                            id="noun_singular"
                            value={lm.noun_singular}
                            onChange={(e) => updateField('noun_singular', e.target.value)}
                            placeholder="deck"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="noun_plural">Noun (Plural)</Label>
                        <Input
                            id="noun_plural"
                            value={lm.noun_plural}
                            onChange={(e) => updateField('noun_plural', e.target.value)}
                            placeholder="decks"
                        />
                    </div>
                </div>

                {/* Titles */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="visit_title">
                            Visit Title
                            <Badge variant="outline" className="ml-2 text-xs">what you call an appointment</Badge>
                        </Label>
                        <Input
                            id="visit_title"
                            value={lm.visit_title}
                            onChange={(e) => updateField('visit_title', e.target.value)}
                            placeholder="design consultation"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialist_title">
                            Specialist Title
                            <Badge variant="outline" className="ml-2 text-xs">who shows up</Badge>
                        </Label>
                        <Input
                            id="specialist_title"
                            value={lm.specialist_title}
                            onChange={(e) => updateField('specialist_title', e.target.value)}
                            placeholder="Project Designer"
                        />
                    </div>
                </div>

                {/* Action Verb & Urgency Hook */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="action_verb">
                            Primary Action Verb
                            <Badge variant="outline" className="ml-2 text-xs">what you do</Badge>
                        </Label>
                        <Input
                            id="action_verb"
                            value={lm.primary_action_verb}
                            onChange={(e) => updateField('primary_action_verb', e.target.value)}
                            placeholder="build"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="urgency_hook">
                            Urgency Hook
                            <Badge variant="outline" className="ml-2 text-xs">why act now</Badge>
                        </Label>
                        <Input
                            id="urgency_hook"
                            value={lm.urgency_hook}
                            onChange={(e) => updateField('urgency_hook', e.target.value)}
                            placeholder="the spring rush"
                        />
                        <p className="text-xs text-muted-foreground">
                            AI will say: "...before <span className="font-medium">{lm.urgency_hook || 'the busy season'}</span>"
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
