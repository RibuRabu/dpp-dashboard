import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>
      <header style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', color: 'var(--c-text-1)', textDecoration: 'none' }}>
            Tuotepassi.fi
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/hinnoittelu" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Hinnoittelu</Link>
            <Link href="/sign-in" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Kirjaudu</Link>
            <Link href="/sign-up" style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', background: 'var(--c-accent)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
              Aloita ilmaiseksi
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
            © {new Date().getFullYear()} [YRITYKSEN NIMI]
          </span>
          <nav style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {[
              ['Tietosuoja', '/legal/tietosuoja'],
              ['Käyttöehdot', '/legal/kayttoehdot'],
              ['Peruutusehdot', '/legal/peruutusehdot'],
              ['Tietojenkäsittely', '/legal/tietojenkasittely'],
              ['Hinnoittelu', '/hinnoittelu'],
            ].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: '12px', color: 'var(--c-text-3)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
