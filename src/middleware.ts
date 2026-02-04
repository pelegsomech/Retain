// middleware.ts - Clerk authentication middleware (App Router)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that completely bypass Clerk (no JWT inspection at all)
const isExternalRoute = createRouteMatcher([
    '/api/webhooks/(.*)', // External webhooks
    '/api/cron/(.*)',     // Cron jobs
]);

// Public routes that don't require authentication but still go through Clerk
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/l/(.*)',           // Public landing pages
    '/c/(.*)',           // Claim links
]);

// Create the Clerk middleware handler
const clerkHandler = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export default async function middleware(req: NextRequest) {
    // Completely bypass Clerk for external API routes
    // These use their own auth (API keys, cron secrets, etc.)
    if (isExternalRoute(req)) {
        return NextResponse.next();
    }

    // For all other routes, use Clerk middleware
    return clerkHandler(req, {} as any);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
