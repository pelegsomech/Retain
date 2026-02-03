import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Protected routes (dashboard)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/onboarding(.*)',
    '/api/leads(.*)',
    '/api/tenants(.*)',
    '/api/landers(.*)',
    '/api/calls(.*)',
    '/api/analytics(.*)',
    '/api/voice(.*)',
])

// Public routes (landing pages, webhooks, claim links)
const isPublicRoute = createRouteMatcher([
    '/',
    '/l/(.*)',           // Landing pages
    '/c/(.*)',           // Claim links
    '/api/webhooks(.*)', // Twilio/Retell webhooks
    '/api/cron(.*)',     // Cron jobs
    '/sign-in(.*)',
    '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
