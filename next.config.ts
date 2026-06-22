import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS: only effective over HTTPS; browsers ignore it on HTTP so safe to include
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // X-DNS-Prefetch-Control: prevent DNS prefetching to reduce information leakage
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // CSP intentionally omitted — Clerk requires a complex allowlist.
  // Recommended Clerk-compatible CSP (add after confirming Clerk origin):
  // default-src 'self';
  // script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com;
  // connect-src 'self' https://*.clerk.accounts.dev https://clerk.com;
  // frame-src https://*.clerk.accounts.dev;
  // img-src 'self' data: https://img.clerk.com;
  // style-src 'self' 'unsafe-inline';
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
