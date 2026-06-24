import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Tulkintatila – Digitaalinen tuotepassi tuotteillesi',
  description: 'Luo, hallinnoi ja julkaise tuotteidesi digitaaliset passit. Rakenteinen tuotetieto pysyy ajan tasalla — myös sen jälkeen, kun tuote on jo myyty.',
};

const FAQ = [
  {
    q: 'Onko digitaalinen tuotepassi jo pakollinen?',
    a: 'Ei kaikkien tuotteiden osalta. EU:n ESPR-asetus tuo digitaalisen tuotepassin pakolliseksi vaiheittain: tekstiileille ja elektroniikalle 2027 alkaen. Koruille ja käsityötuotteille aikataulua ei ole vielä vahvistettu. Palvelu auttaa valmistautumaan jo nyt.',
  },
  {
    q: 'Onko tämä EU:n määräysten mukainen?',
    a: 'Palvelu auttaa kokoamaan tietoja EU-vaatimusten edellyttämässä muodossa. Se ei itsessään takaa viranomaisten hyväksyntää eikä korvaa juridista compliance-arviota. Vastuu säädöstenmukaisuudesta on aina toimijalla itsellään.',
  },
  {
    q: 'Voinko päivittää tuotetietoja jälkikäteen?',
    a: 'Kyllä. Se on palvelun ydinidea. Päivität tiedot hallintapaneelissa milloin tahansa — QR-koodi pysyy samana, tieto takana päivittyy.',
  },
  {
    q: 'Tarvitsenko NFC-tagin?',
    a: 'Ei. QR-koodi riittää. NFC-tunniste on vaihtoehto, mutta ei edellytys. Voit tulostaa QR-koodin suoraan palvelusta.',
  },
  {
    q: 'Toimiiko tämä pienille tuote-erille?',
    a: 'Kyllä. Palvelu on suunniteltu pienyrityksille, joilla ei ole erillisiä PLM-järjestelmiä tai IT-henkilöstöä. Starter-paketti kattaa enintään 5 tuotetta.',
  },
  {
    q: 'Kuka omistaa datan?',
    a: 'Sinä. Data tallennetaan Cloudflaren EU-infrastruktuuriin. Palvelusta lähteminen ei poista tietoja ennen kuin pyydät poistoa erikseen. Voit pyytää datavientiä milloin tahansa osoitteesta hello@tulkintatila.fi.',
  },
];

const WHY_NOT = [
  { label: 'PDF', issues: ['Vanhenee heti tulostuksen jälkeen', 'Ei päivity myyntiketjussa', 'Ei rakenteista dataa'] },
  { label: 'QR-generaattori', issues: ['Ei sisällä tietosisältöä', 'Ei päivitettävää hallintaa', 'Ei dokumentaatiota'] },
  { label: 'Tulkintatila', good: true, issues: ['Rakenteinen tieto hallintapaneelissa', 'QR pysyy — tieto päivittyy', 'Dokumentit, käännökset, EU-tarkistus'] },
];

const SUITABLE = [
  'Korut ja jalometallit',
  'Design-tuotteet ja keramiikka',
  'Tekstiilit ja vaatteet',
  'Käsityötuotteet',
  'Piensarjat ja rajoitetut erät',
  'Pienet maahantuojat',
];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard/products');

  const sec: React.CSSProperties = { maxWidth: '960px', margin: '0 auto', padding: '5rem 1.5rem' };
  const secNarrow: React.CSSProperties = { maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem' };
  const divider: React.CSSProperties = { borderTop: '1px solid var(--c-border)' };
  const ctaPrimary: React.CSSProperties = { display: 'inline-block', padding: '12px 28px', background: 'var(--c-accent)', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' };
  const ctaSecondary: React.CSSProperties = { display: 'inline-block', padding: '12px 24px', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', borderRadius: '8px', fontWeight: 500, fontSize: '14px', textDecoration: 'none' };
  const card: React.CSSProperties = { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1.75rem' };
  const badge: React.CSSProperties = { display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', padding: '4px 10px', borderRadius: '4px', marginBottom: '1.5rem' };
  const h2style: React.CSSProperties = { fontSize: '1.375rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '1rem' };
  const bodyText: React.CSSProperties = { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7 };
  const disclaimer: React.CSSProperties = { fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6, marginTop: '1.5rem', padding: '10px 14px', background: 'var(--c-surface-2)', borderRadius: '6px', border: '1px solid var(--c-border-dim)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', color: 'var(--c-text-1)', textDecoration: 'none' }}>
            Tulkintatila
          </Link>
          <nav aria-label="Päänavigaatio" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="/hinnoittelu" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Hinnoittelu</Link>
            <Link href="/sign-in" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none' }}>Kirjaudu</Link>
            <Link href="/sign-up" style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', background: 'var(--c-accent)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
              Aloita ilmaiseksi
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section style={{ ...sec, paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div style={badge}>Beta</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, color: 'var(--c-text-1)', marginBottom: '1.25rem', maxWidth: '700px' }}>
            Digitaalinen tuotepassi tuotteillesi —<br />ilman raskasta järjestelmähanketta
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--c-text-2)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '2.25rem' }}>
            Luo, hallinnoi ja julkaise tuotteidesi digitaaliset passit.
            Rakenteinen tuotetieto pysyy ajan tasalla — myös sen jälkeen, kun tuote on jo myyty.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/sign-up" style={ctaPrimary}>Aloita tuotetietojen hallinta</Link>
            <Link href="/hinnoittelu" style={ctaSecondary}>Katso hinnoittelu</Link>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '1rem' }}>
            Beta-vaiheessa laskutus manuaalisesti. Ei korttitietoja.
          </p>
        </section>

        <div style={divider} />

        {/* Problem */}
        <section style={sec}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <h2 style={h2style}>Tuotetieto ei kuulu PDF:ään</h2>
              <p style={bodyText}>
                PDF vanhenee heti sen jälkeen, kun se on painettu tai jaettu. Tieto ei seuraa tuotetta arvoketjussa.
                Erillinen QR-generaattori tuottaa linkin muttei ratkaise tietosisältöä.
              </p>
              <p style={{ ...bodyText, marginTop: '0.75rem' }}>
                EU:n digitaalinen tuotepassi edellyttää rakenteista, päivitettävää tietoa — ei staattisia tiedostoja.
                Sama vaatimus koskee useimpia tuoteryhmiä viimeistään 2027 alkaen.
              </p>
            </div>
            <div>
              <h2 style={h2style}>QR-koodi yksin ei riitä</h2>
              <p style={bodyText}>
                QR-koodi on vain reitti tietoon. Ilman hallittua tietosisältöä se ohjaa tyhjään tai vanhentuneeseen sivuun.
              </p>
              <p style={{ ...bodyText, marginTop: '0.75rem' }}>
                Tulkintatilassa QR kiinnittyy tuotteeseen pysyvästi.
                Hallintapaneelissa päivitetty tieto näkyy heti julkisella passisivulla — linkkiä ei tarvitse vaihtaa.
              </p>
            </div>
          </div>
        </section>

        <div style={divider} />

        {/* How it works */}
        <section style={sec}>
          <h2 style={{ ...h2style, fontSize: '1.5rem', textAlign: 'center', marginBottom: '2.5rem' }}>Miten se toimii?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { n: '1', title: 'Luo tuotepassi', body: 'Anna tuotteen perustiedot: nimi, valmistaja, vastuullinen toimija, tuoteluokka. Alle 10 minuuttia ensimmäiselle tuotteelle.' },
              { n: '2', title: 'Täydennä tiedot ja dokumentit', body: 'Lisää materiaalit, hoito-ohjeet, aineet ja sertifikaatit. Palvelu näyttää, mitä tietoja EU-vaatimukset edellyttävät juuri tälle tuoteluokalle.' },
              { n: '3', title: 'Julkaise', body: 'Saat QR-koodin, jonka voit tulostaa tai kiinnittää NFC-tunnisteeseen. Asiakkaat, jälleenmyyjät ja viranomaiset näkevät ajantasaiset tiedot.' },
            ].map(step => (
              <div key={step.n} style={card}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--c-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, marginBottom: '1rem' }}>{step.n}</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--c-text-1)', marginBottom: '0.5rem' }}>{step.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={divider} />

        {/* Who */}
        <section style={sec}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 280px' }}>
              <h2 style={h2style}>Kenelle?</h2>
              <p style={{ ...bodyText, marginBottom: '1.25rem' }}>
                Palvelu on suunniteltu pienille valmistajille ja tuotebrändeillle, joilla ei ole erillistä IT-henkilöstöä tai PLM-järjestelmää.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUITABLE.map(item => (
                  <li key={item} style={{ fontSize: '14px', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--c-ok)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: '1 1 280px' }}>
              <h2 style={h2style}>Ei sovi</h2>
              <p style={{ ...bodyText, marginBottom: '1.25rem' }}>
                Palvelu ei ole suunniteltu seuraaville käyttötapauksille:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Suurten valmistustehtaiden ERP-integraatiot', 'Lääkinnälliset laitteet', 'Kosmetiikka (vaatii erillisen portaalin)', 'Elintarvikkeet', 'Yritykset, joilla on olemassa toimiva PLM-järjestelmä'].map(item => (
                  <li key={item} style={{ fontSize: '14px', color: 'var(--c-text-3)', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ flexShrink: 0, marginTop: '1px' }}>–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div style={divider} />

        {/* Why not PDF / QR */}
        <section style={sec}>
          <h2 style={{ ...h2style, fontSize: '1.375rem', marginBottom: '2rem' }}>Miksi ei pelkkä PDF tai QR-generaattori?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {WHY_NOT.map(col => (
              <div key={col.label} style={{ ...card, borderColor: col.good ? 'var(--c-accent)' : 'var(--c-border)', opacity: col.good ? 1 : 0.85 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: col.good ? 'var(--c-accent)' : 'var(--c-text-1)', marginBottom: '1rem' }}>{col.label}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {col.issues.map(issue => (
                    <li key={issue} style={{ fontSize: '13px', color: col.good ? 'var(--c-text-2)' : 'var(--c-text-3)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, color: col.good ? 'var(--c-ok)' : 'var(--c-text-3)', fontWeight: 700 }}>{col.good ? '✓' : '–'}</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div style={divider} />

        {/* FAQ */}
        <section style={secNarrow}>
          <h2 style={{ ...h2style, fontSize: '1.375rem', marginBottom: '2rem' }}>Usein kysyttyä</h2>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <dt style={{ fontSize: '15px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '0.4rem' }}>{q}</dt>
                <dd style={{ ...bodyText, margin: 0 }}>{a}</dd>
              </div>
            ))}
          </dl>
          <p style={disclaimer}>
            Palvelu auttaa kokoamaan, ylläpitämään ja jakamaan tuotetietoja sekä seuraamaan tietotarpeita.
            Palvelu ei korvaa juridista neuvontaa tai viranomaisen arviota.
          </p>
        </section>

        <div style={divider} />

        {/* Bottom CTA */}
        <section style={{ ...sec, paddingTop: '4rem', paddingBottom: '5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.75rem' }}>Valmis aloittamaan?</h2>
          <p style={{ ...bodyText, maxWidth: '420px', margin: '0 auto 2rem', textAlign: 'center' }}>
            Beta-vaiheessa paikat ovat rajatut. Luo tili tai ota yhteyttä käyttöönottoa varten.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={ctaPrimary}>Luo ilmainen tili</Link>
            <a href="mailto:hello@tulkintatila.fi" style={ctaSecondary}>Varaa käyttöönotto</a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} Tulkintatila · Fiksiribu · Y-tunnus 1976813-2 · Kotipaikka Helsinki
            <br />
            <a href="mailto:hello@tulkintatila.fi" style={{ color: 'var(--c-text-3)' }}>hello@tulkintatila.fi</a>
          </span>
          <nav aria-label="Lakisivut" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
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
