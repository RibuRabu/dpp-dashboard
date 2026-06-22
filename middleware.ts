import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher(['/dashboard(.*)', '/platform(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isProtected(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
