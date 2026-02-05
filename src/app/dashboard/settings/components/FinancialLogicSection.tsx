'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Fees
                </CardTitle>
                <CardDescription>
                    Configure how the AI discusses pricing during calls
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Fee Strategy */}
                <div className="space-y-3">
                    <Label>Fee Strategy</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {FEE_STRATEGIES.map(strategy => (
                            <button
                                key={strategy}
                                type="button"
                                onClick={() => updateField('fee_strategy', strategy)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${fl.fee_strategy === strategy
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-[#EEEEEE] hover:border-[#CCCCCC]'
                                    }`}
                            >
                                <div className="font-medium">{FEE_STRATEGY_LABELS[strategy]}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fee Amount (conditional) */}
                {showFeeAmount && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fee_amount">Fee Amount (cents)</Label>
                            <Input
                                id="fee_amount"
                                type="number"
                                value={fl.fee_amount}
                                onChange={(e) => updateField('fee_amount', parseInt(e.target.value) || 0)}
                                placeholder="4900"
                            />
                            <p className="text-xs text-muted-foreground">
                                Display: ${(fl.fee_amount / 100).toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee_currency">Currency</Label>
                            <Input
                                id="fee_currency"
                                value={fl.fee_currency}
                                onChange={(e) => updateField('fee_currency', e.target.value)}
                                placeholder="USD"
                            />
                        </div>
                    </div>
                )}

                {/* Credit Options */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="credit_to_project">Credit to Project</Label>
                            <p className="text-xs text-muted-foreground">
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
                        <div className="space-y-2 pl-4 border-l-2 border-green-200">
                            <Label htmlFor="credit_window">Credit Window (days)</Label>
                            <Input
                                id="credit_window"
                                type="number"
                                value={fl.credit_window_days}
                                onChange={(e) => updateField('credit_window_days', parseInt(e.target.value) || 30)}
                                className="w-32"
                            />
                        </div>
                    )}
                </div>

                {/* Payment Collection */}
                <div className="space-y-2">
                    <Label>Payment Collection Method</Label>
                    <div className="flex gap-2">
                        {(['none', 'on_site', 'phone_stripe'] as const).map(method => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => updateField('payment_collection_method', method)}
                                className={`px-4 py-2 rounded-md border transition-all ${fl.payment_collection_method === method
                                        ? 'border-black bg-black text-white'
                                        : 'border-[#CCCCCC] hover:border-black'
                                    }`}
                            >
                                {method === 'none' ? 'None' : method === 'on_site' ? 'On Site' : 'Phone/Stripe'}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
