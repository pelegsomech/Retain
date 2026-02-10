'use client'

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
        <div className="settings-card p-6">
            <div className="settings-section-header">
                <div className="settings-icon-circle">
                    <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="settings-title">Language & Terminology</h3>
                    <p className="settings-desc">Customize the vocabulary the AI uses in conversations</p>
                </div>
            </div>

            <div className="mt-5 space-y-6">
                {/* Preview */}
                <div className="settings-preview">
                    <p className="settings-hint mb-2">AI will say things like:</p>
                    <p className="italic text-sm">
                        &quot;I&apos;ll get a <span className="highlight">{lm.specialist_title || 'specialist'}</span> out
                        there to take a look at the <span className="highlight">{lm.noun_singular || 'project'}</span>.
                        We can schedule a <span className="highlight">{lm.visit_title || 'consultation'}</span> to
                        <span className="highlight"> {lm.primary_action_verb || 'help with'}</span> your
                        <span className="highlight"> {lm.noun_plural || 'projects'}</span>.&quot;
                    </p>
                </div>

                {/* Nouns */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="settings-label" htmlFor="noun_singular">Noun (Singular)</label>
                            <span className="settings-badge">the thing you work on</span>
                        </div>
                        <input
                            id="noun_singular"
                            value={lm.noun_singular}
                            onChange={(e) => updateField('noun_singular', e.target.value)}
                            placeholder="deck"
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="settings-label" htmlFor="noun_plural">Noun (Plural)</label>
                        <input
                            id="noun_plural"
                            value={lm.noun_plural}
                            onChange={(e) => updateField('noun_plural', e.target.value)}
                            placeholder="decks"
                            className="settings-input w-full"
                        />
                    </div>
                </div>

                {/* Titles */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="settings-label" htmlFor="visit_title">Visit Title</label>
                            <span className="settings-badge">what you call an appointment</span>
                        </div>
                        <input
                            id="visit_title"
                            value={lm.visit_title}
                            onChange={(e) => updateField('visit_title', e.target.value)}
                            placeholder="design consultation"
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="settings-label" htmlFor="specialist_title">Specialist Title</label>
                            <span className="settings-badge">who shows up</span>
                        </div>
                        <input
                            id="specialist_title"
                            value={lm.specialist_title}
                            onChange={(e) => updateField('specialist_title', e.target.value)}
                            placeholder="Project Designer"
                            className="settings-input w-full"
                        />
                    </div>
                </div>

                {/* Action Verb & Urgency Hook */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="settings-label" htmlFor="action_verb">Primary Action Verb</label>
                            <span className="settings-badge">what you do</span>
                        </div>
                        <input
                            id="action_verb"
                            value={lm.primary_action_verb}
                            onChange={(e) => updateField('primary_action_verb', e.target.value)}
                            placeholder="build"
                            className="settings-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="settings-label" htmlFor="urgency_hook">Urgency Hook</label>
                            <span className="settings-badge">why act now</span>
                        </div>
                        <input
                            id="urgency_hook"
                            value={lm.urgency_hook}
                            onChange={(e) => updateField('urgency_hook', e.target.value)}
                            placeholder="the spring rush"
                            className="settings-input w-full"
                        />
                        <p className="settings-hint">
                            AI will say: &quot;...before <span className="font-medium">{lm.urgency_hook || 'the busy season'}</span>&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
