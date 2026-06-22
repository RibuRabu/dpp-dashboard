import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { listTenants, ApiError } from '@/lib/api';

const navLinks = [
  { href: '/platform', label: 'Yleiskatsaus', exact: true },
  { href: '/platform/tenants', label: 'Tenantit' },
  { href: '/platform/products/unclaimed', label: 'Lunastamatta' },
  { href: '/platform/billing', label: 'Laskutus' },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) redirect('/sign-in');

  const token = await getToken();
  try {
    if (token) await listTenants(token, 0);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/dashboard/products');
    redirect('/dashboard/products');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      <nav style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }} className="sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c-warn)' }}>Platform Admin</span>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-text-2)' }}>{l.label}</Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/dashboard/products" style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>← Dashboard</Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
