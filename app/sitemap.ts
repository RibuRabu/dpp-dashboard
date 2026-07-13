import type { MetadataRoute } from 'next';

const BASE = 'https://digitaalinentuotepassi.tulkintatila.fi';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,                        changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/hinnoittelu`,             changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/legal/tietosuoja`,        changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/kayttoehdot`,       changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/peruutusehdot`,     changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/tietojenkasittely`, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
