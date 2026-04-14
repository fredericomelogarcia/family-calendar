import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
  "/api/webhooks/clerk",
  "/favicon.ico",
  "/icons/(.*)",
  "/manifest.json",
]);

export const proxy = clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!_next|[^s]*\\.(?:sitemap\\.xml|robots\\.txt|favicon\\.ico|svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};