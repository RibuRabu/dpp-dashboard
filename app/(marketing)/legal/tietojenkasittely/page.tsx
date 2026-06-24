import Link from 'next/link';

export const metadata = {
  title: 'Tietojenkäsittelysopimus – Tuotepassi',
};

// BETA-VAIHE: Tämä on yksinkertaistettu tietojenkäsittelysopimus (DPA).
// Tarkistuta juristilla ennen kaupallista laajentamista.

export default function DpaPage() {
  const s = {
    page: { maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' } as React.CSSProperties,
    h1: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.5rem' } as React.CSSProperties,
    updated: { fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '2.5rem' } as React.CSSProperties,
    h2: { fontSize: '1.0625rem', fontWeight: 700, color: 'var(--c-text-1)', marginTop: '2rem', marginBottom: '0.5rem' } as React.CSSProperties,
    p: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, marginBottom: '0.75rem' } as React.CSSProperties,
    ul: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.75rem' } as React.CSSProperties,
    note: { fontSize: '12px', color: 'var(--c-text-3)', background: 'var(--c-surface-2)', borderRadius: '6px', padding: '10px 14px', marginBottom: '2rem' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px', marginBottom: '1.5rem' },
    th: { textAlign: 'left' as const, padding: '8px 12px', background: 'var(--c-surface-2)', fontWeight: 600, color: 'var(--c-text-1)', borderBottom: '1px solid var(--c-border)' },
    td: { padding: '8px 12px', color: 'var(--c-text-2)', borderBottom: '1px solid var(--c-border-dim)', verticalAlign: 'top' as const },
  };

  return (
    <div style={s.page}>
      <div style={s.note}>
        ⚠ Tämä on beta-vaiheen tietojenkäsittelysopimus. Tarkistuta juristilla ennen laajaa kaupallista käyttöä.
      </div>

      <h1 style={s.h1}>Tietojenkäsittelysopimus</h1>
      <p style={s.updated}>Viimeksi päivitetty: 23.6.2026</p>

      <h2 style={s.h2}>Osapuolten roolit</h2>
      <p style={s.p}>Tämä sopimus selittää, miten henkilötietoja käsitellään palvelusuhteessa.</p>
      <ul style={s.ul}>
        <li><strong>Palveluntarjoaja (Tulkintatila / Fiksiribu):</strong> toimii rekisterinpitäjänä asiakkaan tilin ja laskutustietojen osalta.</li>
        <li><strong>Asiakas:</strong> toimii rekisterinpitäjänä omien tuotetietojensa (esim. valmistajan nimi ja yhteystiedot) osalta. Palveluntarjoaja on tällöin henkilötietojen käsittelijä.</li>
      </ul>
      <p style={s.p}>Käytännössä: kun syötät tuotteeseesi valmistajan nimen ja sähköpostin, olet itse tietojen rekisterinpitäjä. Tarjoamme ainoastaan teknisen tallennusalustan.</p>

      <h2 style={s.h2}>Käsiteltävät henkilötiedot</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Tieto</th>
            <th style={s.th}>Kuka käsittelee</th>
            <th style={s.th}>Tarkoitus</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Tilin sähköposti, nimi', 'Palveluntarjoaja (rekisterinpitäjä)', 'Kirjautuminen, laskutus'],
            ['Valmistajan nimi, osoite, sähköposti', 'Asiakas (rekisterinpitäjä), palveluntarjoaja (käsittelijä)', 'Tuotepassin tiedot'],
            ['Vastuullisen toimijan tiedot', 'Asiakas (rekisterinpitäjä), palveluntarjoaja (käsittelijä)', 'EU-vaatimukset'],
          ].map(([tieto, rooli, tarkoitus]) => (
            <tr key={tieto}>
              <td style={s.td}>{tieto}</td>
              <td style={s.td}>{rooli}</td>
              <td style={s.td}>{tarkoitus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={s.h2}>Alihankkijat (alakäsittelijät)</h2>
      <p style={s.p}>Käytämme seuraavia alihankkijoita, joille henkilötietoja siirretään:</p>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Alihankkija</th>
            <th style={s.th}>Käyttötarkoitus</th>
            <th style={s.th}>Sijainti</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Clerk (clerk.com)', 'Käyttäjätunnistautuminen', 'USA (SCC)'],
            ['Cloudflare (cloudflare.com)', 'Palvelin, tietokanta, tiedostot', 'EU'],
          ].map(([ali, kaytto, sijainti]) => (
            <tr key={ali}>
              <td style={s.td}>{ali}</td>
              <td style={s.td}>{kaytto}</td>
              <td style={s.td}>{sijainti}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={s.h2}>Asiakkaan velvollisuudet</h2>
      <ul style={s.ul}>
        <li>Syötä tuotetietoihin vain tietoja, joiden käsittelyyn sinulla on oikeus.</li>
        <li>Varmista, että valmistajan yhteystietojen julkaiseminen tuotepassisivulla on asianmukaista.</li>
        <li>Vastaa itse rekisteröityjen oikeuksien toteuttamisesta niiden tietojen osalta, joissa toimit rekisterinpitäjänä.</li>
      </ul>

      <h2 style={s.h2}>Tietoturvaloukkaukset</h2>
      <p style={s.p}>Jos havaitsemme tietoturvaloukkauksen, joka koskee sinun rekisterinpitäjäroolissasi olevia tietoja, ilmoitamme siitä sinulle 72 tunnin sisällä sähköpostitse. Toimit sitten GDPR:n mukaisen ilmoitusvelvollisuuden mukaisesti tarvittaessa valvontaviranomaiselle.</p>

      <h2 style={s.h2}>Yhteystiedot</h2>
      <p style={s.p}>Tietojenkäsittelyä koskevat kysymykset: hello@tulkintatila.fi</p>

      <div style={{ borderTop: '1px solid var(--c-border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
          <Link href="/legal/tietosuoja" style={{ color: 'var(--c-accent)' }}>Tietosuojaseloste</Link>
          {' '}·{' '}
          <Link href="/legal/kayttoehdot" style={{ color: 'var(--c-accent)' }}>Käyttöehdot</Link>
        </p>
      </div>
    </div>
  );
}
