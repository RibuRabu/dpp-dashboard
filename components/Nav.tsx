'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

const links = [
  { href: '/dashboard/products', label: 'Tuotteet' },
  { href: '/dashboard/team',     label: 'Tiimi' },
  { href: '/dashboard/settings', label: 'Asetukset' },
];

export default function Nav({ isPlatformAdmin }: { isPlatformAdmin?: boolean }) {
  const path = usePathname();

  return (
    <nav
      style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
      className="sticky top-0 z-40"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <span
          style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}
          className="mr-2 shrink-0"
        >
          DPP
        </span>

        <OrganizationSwitcher
          hidePersonal
          createOrganizationMode="modal"
          afterSelectOrganizationUrl="/dashboard/products"
          afterCreateOrganizationUrl="/dashboard/products"
          appearance={{ elements: { rootBox: 'flex items-center' } }}
        />

        <div className="flex items-center gap-1 flex-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: path.startsWith(l.href) ? 'var(--c-accent)' : 'var(--c-text-2)',
                padding: '4px 10px',
                borderRadius: '6px',
                background: path.startsWith(l.href) ? 'var(--c-accent-dim)' : 'transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
          {isPlatformAdmin && (
            <Link
              href="/platform"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: path.startsWith('/platform') ? 'var(--c-accent)' : 'var(--c-text-3)',
                padding: '4px 10px',
                borderRadius: '6px',
                background: path.startsWith('/platform') ? 'var(--c-accent-dim)' : 'transparent',
              }}
            >
              Platform
            </Link>
          )}
        </div>

        <UserButton />
      </div>
    </nav>
  );
}
