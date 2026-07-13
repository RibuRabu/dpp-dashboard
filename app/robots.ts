import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/platform', '/sign-up', '/sign-in'],
    },
    sitemap: 'https://digitaalinentuotepassi.tulkintatila.fi/sitemap.xml',
  };
}
