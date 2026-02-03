import { NextRequest, NextResponse } from 'next/server'
import { processClaimClick } from '@/lib/escalation'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const result = await processClaimClick(token)

        if (!result.success) {
            // Redirect to error page or show message
            return NextResponse.redirect(
                new URL(`/claim-error?message=${encodeURIComponent(result.error || 'Unknown error')}`, req.url)
            )
        }

        // Success - redirect to claimed confirmation page
        return NextResponse.redirect(
            new URL('/claim-success', req.url)
        )
    } catch (error) {
        console.error('[Claim] Error processing claim:', error)
        return NextResponse.redirect(
            new URL('/claim-error?message=An+error+occurred', req.url)
        )
    }
}
