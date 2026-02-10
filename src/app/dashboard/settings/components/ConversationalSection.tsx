'use client'

import { Switch } from "@/components/ui/switch"
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
        <div className="settings-card p-6">
            <div className="settings-section-header">
                <div className="settings-icon-circle">
                    <AudioLines className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="settings-title">Voice Behavior</h3>
                    <p className="settings-desc">Fine-tune how the AI sounds during calls</p>
                </div>
            </div>

            <div className="mt-5 space-y-6">
                {/* Speech Pacing */}
                <div className="space-y-3">
                    <label className="settings-label">Speech Pacing</label>
                    <div className="flex gap-2">
                        {SPEECH_PACING_OPTIONS.map(pacing => (
                            <button
                                key={pacing}
                                type="button"
                                onClick={() => updateField('speech_pacing', pacing)}
                                className={`settings-chip capitalize ${cp.speech_pacing === pacing ? 'active' : ''}`}
                            >
                                {pacing}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interruption Tolerance */}
                <div className="space-y-3">
                    <label className="settings-label">Interruption Tolerance</label>
                    <div className="flex gap-2">
                        {INTERRUPTION_TOLERANCE_OPTIONS.map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateField('interruption_tolerance', level)}
                                className={`settings-chip capitalize ${cp.interruption_tolerance === level ? 'active' : ''}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <p className="settings-hint">
                        How well the AI handles being interrupted mid-sentence
                    </p>
                </div>

                {/* Formality Level */}
                <div className="space-y-3">
                    <label className="settings-label">Formality Level</label>
                    <div className="flex gap-2">
                        {FORMALITY_LEVELS.map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateField('formality_level', level)}
                                className={`settings-chip ${cp.formality_level === level ? 'active' : ''}`}
                            >
                                {level === 'first_name_basis' ? 'First Name' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Latency Fillers */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="settings-label" htmlFor="latency_fillers">Latency Fillers</label>
                        <span className="settings-badge">comma-separated</span>
                    </div>
                    <input
                        id="latency_fillers"
                        value={cp.latency_fillers.join(', ')}
                        onChange={(e) => updateFillers(e.target.value)}
                        placeholder="Gotcha, Mm-hm, Sure thing, Let me see"
                        className="settings-input w-full"
                    />
                    <p className="settings-hint">
                        Natural phrases the AI uses while processing
                    </p>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="max_sentence">Max Sentence Length (words)</label>
                        <input
                            id="max_sentence"
                            type="number"
                            value={cp.sentence_length_max}
                            onChange={(e) => updateField('sentence_length_max', parseInt(e.target.value) || 15)}
                            className="settings-input w-24"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                        <div>
                            <label className="settings-label" htmlFor="disfluencies">Use Disfluencies</label>
                            <p className="settings-hint">
                                Add &quot;um&quot; and &quot;uh&quot; for natural speech
                            </p>
                        </div>
                        <Switch
                            id="disfluencies"
                            checked={cp.use_disfluencies}
                            onCheckedChange={(checked) => updateField('use_disfluencies', checked)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
