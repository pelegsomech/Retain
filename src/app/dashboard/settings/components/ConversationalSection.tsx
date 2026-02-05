'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AudioLines } from "lucide-react"
import {
    type AtomicConfig,
    type SpeechPacing,
    type InterruptionTolerance,
    type FormalityLevel,
    SPEECH_PACING_OPTIONS,
    INTERRUPTION_TOLERANCE_OPTIONS,
    FORMALITY_LEVELS,
} from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
}

/**
 * Conversational Parameters Section
 * Configures: speech pacing, fillers, formality, disfluencies
 */
export function ConversationalSection({ config, onChange }: Props) {
    const cp = config.conversational_parameters

    const updateField = <K extends keyof typeof cp>(key: K, value: typeof cp[K]) => {
        onChange({
            conversational_parameters: {
                ...cp,
                [key]: value,
            },
        })
    }

    const updateFillers = (value: string) => {
        const fillers = value.split(',').map(s => s.trim()).filter(Boolean)
        updateField('latency_fillers', fillers)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AudioLines className="h-5 w-5" />
                    Voice Behavior
                </CardTitle>
                <CardDescription>
                    Fine-tune how the AI sounds during calls
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Speech Pacing */}
                <div className="space-y-3">
                    <Label>Speech Pacing</Label>
                    <div className="flex gap-2">
                        {SPEECH_PACING_OPTIONS.map(pacing => (
                            <button
                                key={pacing}
                                type="button"
                                onClick={() => updateField('speech_pacing', pacing)}
                                className={`px-4 py-2 rounded-md border transition-all capitalize ${cp.speech_pacing === pacing
                                        ? 'border-black bg-black text-white'
                                        : 'border-[#CCCCCC] hover:border-black'
                                    }`}
                            >
                                {pacing}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interruption Tolerance */}
                <div className="space-y-3">
                    <Label>Interruption Tolerance</Label>
                    <div className="flex gap-2">
                        {INTERRUPTION_TOLERANCE_OPTIONS.map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateField('interruption_tolerance', level)}
                                className={`px-4 py-2 rounded-md border transition-all capitalize ${cp.interruption_tolerance === level
                                        ? 'border-black bg-black text-white'
                                        : 'border-[#CCCCCC] hover:border-black'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        How well the AI handles being interrupted mid-sentence
                    </p>
                </div>

                {/* Formality Level */}
                <div className="space-y-3">
                    <Label>Formality Level</Label>
                    <div className="flex gap-2">
                        {FORMALITY_LEVELS.map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateField('formality_level', level)}
                                className={`px-4 py-2 rounded-md border transition-all ${cp.formality_level === level
                                        ? 'border-black bg-black text-white'
                                        : 'border-[#CCCCCC] hover:border-black'
                                    }`}
                            >
                                {level === 'first_name_basis' ? 'First Name' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Latency Fillers */}
                <div className="space-y-2">
                    <Label htmlFor="latency_fillers">
                        Latency Fillers
                        <Badge variant="outline" className="ml-2 text-xs">comma-separated</Badge>
                    </Label>
                    <Input
                        id="latency_fillers"
                        value={cp.latency_fillers.join(', ')}
                        onChange={(e) => updateFillers(e.target.value)}
                        placeholder="Gotcha, Mm-hm, Sure thing, Let me see"
                    />
                    <p className="text-xs text-muted-foreground">
                        Natural phrases the AI uses while processing
                    </p>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="max_sentence">Max Sentence Length (words)</Label>
                        <Input
                            id="max_sentence"
                            type="number"
                            value={cp.sentence_length_max}
                            onChange={(e) => updateField('sentence_length_max', parseInt(e.target.value) || 15)}
                            className="w-24"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                        <div>
                            <Label htmlFor="disfluencies">Use Disfluencies</Label>
                            <p className="text-xs text-muted-foreground">
                                Add "um" and "uh" for natural speech
                            </p>
                        </div>
                        <Switch
                            id="disfluencies"
                            checked={cp.use_disfluencies}
                            onCheckedChange={(checked) => updateField('use_disfluencies', checked)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
