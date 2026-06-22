import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Authenticated users go straight to their dashboard.
// Unauthenticated visitors see the marketing landing page.

export const metadata = {
  title: 'Tuotepassi – Tuotetiedot, dokumentit ja EU-vaatimusten hallinta',
  description: 'Yksi paikka tuotetiedoille, dokumenteille ja EU-vaatimusten hallintaan. Sopii koruille, design-tuotteille, tekstiileille ja käsityötuotteille.',
};

const FEATURES = [
  { title: 'Luo tuote', body: 'Lisää tuotetiedot, materiaalit, valmistajatiedot ja EU-luokitus yhdessä paikassa. Vie alle 10 minuuttia ensimmäiselle tuotteelle.' },
  { title: 'Täytä tiedot ja dokumentit', body: 'Lataa vaatimustenmukaisuusdokumentit, huolto-ohjeet ja turvallisuustiedot. Järjestelmä näyttää mitä vielä puuttuu.' },
  { title: 'Julkaise QR- tai NFC-tuotepassi', body: 'Saat QR-koodin, jonka voi tulostaa tuotteeseen. Asiakkaat skannaavat ja näkevät ajantasaiset tuotetiedot.' },
];

const SUITABLE = ['Korut ja jalometallit', 'Design-tuotteet', 'Tekstiilit ja vaatteet', 'Käsityötuotteet'];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard/products');

  const card: React.CSSProperties = { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1.5rem' };
  const stepNum: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--c-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, marginBottom: '1rem', flexShrink: 0 };
  const note: React.CSSProperties = { fontSize: '12px', color: 'var(--c-text-3)', marginTop: '1rem', lineHeight: 1.5 };
  const section: React.CSSProperties = { maxWidth: '960px', margin: '0 auto', padding: '4rem 1.5rem' };
  const ctaP: React.CSSProperties = { display: 'inline-block', padding: '12px 28px', background: 'var(--c-accent)', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' };
  const ctaS: React.CSSProperties = { display: 'inline-block', padding: '12px 24px', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', borderRadius: '8px', fontWeight: 500, fontSize: '14px', textDecoration: 'none' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', color: 'var(--c-text-1)', textDecoration: 'none' }}>Tuotepassi.fi</Link>
          <nav aria-label="Päänavigaatio" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/hinnoittelu" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Hinnoittelu</Link>
            <Link href="/sign-in" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Kirjaudu</Link>
            <Link href="/sign-up" style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', background: 'var(--c-accent)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>Aloita ilmaiseksi</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ ...section, paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', padding: '4px 10px', borderRadius: '4px', marginBottom: '1.25rem' }}>Beta</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.2, color: 'var(--c-text-1)', marginBottom: '1rem' }}>
            Yksi paikka tuotetiedoille,<br />dokumenteille ja EU-vaatimuksille
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--c-text-2)', lineHeight: 1.65, maxWidth: '560px', marginBottom: '2rem' }}>
            Hallitse tuotteidesi tiedot, lataa vaatimustenmukaisuusdokumentit ja jaa ne QR-koodilla tai NFC-tunnisteella. Sopii pienyrityksille, jotka myyvät fyysisiä tuotteita EU-markkinoilla.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link href="/sign-up" style={ctaP}>Aloita tuotetietojen hallinta</Link>
            <Link href="/hinnoittelu" style={ctaS}>Katso hinnoittelu</Link>
          </div>
          <p style={note}>Ei korttitietoja beta-vaiheessa. Laskutus manuaalisesti kuukausittain.</p>
        </section>

        <div style={{ borderTop: '1px solid var(--c-border)' }} />

        {/* How it works */}
        <section style={section}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text-1)', textAlign: 'center', marginBottom: '2.5rem' }}>Miten se toimii?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={stepNum}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--c-text-1)', marginBottom: '0.4rem' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6 }}>{f.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--c-border)' }} />

        {/* Suitable for */}
        <section style={{ ...section, paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.75rem' }}>Sopii erityisesti</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUITABLE.map(item => (
                  <li key={item} style={{ fontSize: '14px', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--c-ok)', fontWeight: 700 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ ...card, maxWidth: '360px', flex: '1 1 280px' }}>
              <div style={{ fontSize: '13px', color: 'var(--c-text-3)', marginBottom: '0.75rem', fontWeight: 500 }}>Palvelu auttaa hallitsemaan</div>
              {['Tuotteiden perustiedot ja materiaalit', 'Valmistajan ja vastuullisen toimijan tiedot', 'EU-tarkistukset (GPSR, REACH, tekstiilit)', 'Vaatimustenmukaisuusdokumentit', 'QR-koodin tai NFC-tunnisteen linkki'].map(item => (
                <div key={item} style={{ fontSize: '13px', color: 'var(--c-text-2)', padding: '6px 0', borderBottom: '1px solid var(--c-border-dim)', lineHeight: 1.4 }}>{item}</div>
              ))}
              <p style={{ ...note, marginTop: '0.75rem' }}>Palvelu ei korvaa juridista neuvontaa eikä takaa viranomaisvaatimusten täyttymistä automaattisesti.</p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--c-border)' }} />

        {/* Bottom CTA */}
        <section style={{ ...section, paddingTop: '3.5rem', paddingBottom: '3.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.75rem' }}>Valmis aloittamaan?</h2>
          <p style={{ fontSize: '15px', color: 'var(--c-text-2)', margin: '0 auto 1.75rem', maxWidth: '440px', lineHeight: 1.6 }}>Beta-vaiheessa paikka on rajattu. Ota yhteyttä tai luo tili suoraan.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={ctaP}>Luo ilmainen tili</Link>
            <a href="mailto:[SAHKOPOSTI]" style={ctaS}>Varaa käyttöönotto</a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>© {new Date().getFullYear()} [YRITYKSEN NIMI]</span>
          <nav aria-label="Lakisivut" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {[['Tietosuoja', '/legal/tietosuoja'], ['Käyttöehdot', '/legal/kayttoehdot'], ['Peruutusehdot', '/legal/peruutusehdot'], ['Tietojenkäsittely', '/legal/tietojenkasittely'], ['Hinnoittelu', '/hinnoittelu']].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: '12px', color: 'var(--c-text-3)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
