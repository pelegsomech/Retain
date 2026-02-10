'use client'

import { Switch } from "@/components/ui/switch"
import { DollarSign } from "lucide-react"
import {
    type AtomicConfig,
    type FeeStrategy,
    FEE_STRATEGIES,
    FEE_STRATEGY_LABELS,
} from '@/lib/atomic-config'

interface Props {
    config: AtomicConfig
    onChange: (updates: Partial<AtomicConfig>) => void
}

/**
 * Financial Logic Section
 * Configures: fee strategy, amounts, credits, payment collection
 */
export function FinancialLogicSection({ config, onChange }: Props) {
    const fl = config.financial_logic

    const updateField = <K extends keyof typeof fl>(key: K, value: typeof fl[K]) => {
        onChange({
            financial_logic: {
                ...fl,
                [key]: value,
            },
        })
    }

    const showFeeAmount = fl.fee_strategy !== 'free_estimate'

    return (
        <div className="settings-card p-6">
            <div className="settings-section-header">
                <div className="settings-icon-circle">
                    <DollarSign className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="settings-title">Pricing & Fees</h3>
                    <p className="settings-desc">Configure how the AI discusses pricing during calls</p>
                </div>
            </div>

            <div className="mt-5 space-y-6">
                {/* Fee Strategy */}
                <div className="space-y-3">
                    <label className="settings-label">Fee Strategy</label>
                    <div className="grid grid-cols-2 gap-3">
                        {FEE_STRATEGIES.map(strategy => (
                            <button
                                key={strategy}
                                type="button"
                                onClick={() => updateField('fee_strategy', strategy)}
                                className={`settings-card-chip ${fl.fee_strategy === strategy ? 'active' : ''}`}
                            >
                                <div className="font-medium text-sm">{FEE_STRATEGY_LABELS[strategy]}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fee Amount (conditional) */}
                {showFeeAmount && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="settings-label" htmlFor="fee_amount">Fee Amount (cents)</label>
                            <input
                                id="fee_amount"
                                type="number"
                                value={fl.fee_amount}
                                onChange={(e) => updateField('fee_amount', parseInt(e.target.value) || 0)}
                                placeholder="4900"
                                className="settings-input w-full"
                            />
                            <p className="settings-hint">
                                Display: ${(fl.fee_amount / 100).toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="settings-label" htmlFor="fee_currency">Currency</label>
                            <input
                                id="fee_currency"
                                value={fl.fee_currency}
                                onChange={(e) => updateField('fee_currency', e.target.value)}
                                placeholder="USD"
                                className="settings-input w-full"
                            />
                        </div>
                    </div>
                )}

                {/* Credit Options */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="settings-label" htmlFor="credit_to_project">Credit to Project</label>
                            <p className="settings-hint">
                                Fee applies as credit toward the project
                            </p>
                        </div>
                        <Switch
                            id="credit_to_project"
                            checked={fl.credit_to_project}
                            onCheckedChange={(checked) => updateField('credit_to_project', checked)}
                        />
                    </div>

                    {fl.credit_to_project && (
                        <div className="space-y-2 pl-4 border-l-2 border-[#C4A265]/30">
                            <label className="settings-label" htmlFor="credit_window">Credit Window (days)</label>
                            <input
                                id="credit_window"
                                type="number"
                                value={fl.credit_window_days}
                                onChange={(e) => updateField('credit_window_days', parseInt(e.target.value) || 30)}
                                className="settings-input w-32"
                            />
                        </div>
                    )}
                </div>

                {/* Payment Collection */}
                <div className="space-y-3">
                    <label className="settings-label">Payment Collection Method</label>
                    <div className="flex gap-2">
                        {(['none', 'on_site', 'phone_stripe'] as const).map(method => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => updateField('payment_collection_method', method)}
                                className={`settings-chip ${fl.payment_collection_method === method ? 'active' : ''}`}
                            >
                                {method === 'none' ? 'None' : method === 'on_site' ? 'On Site' : 'Phone/Stripe'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
