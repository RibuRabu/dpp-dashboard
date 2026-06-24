import Link from 'next/link';

export const metadata = {
  title: 'Tietosuojaseloste – Tulkintatila',
};

// BETA-VAIHE: Tämä on käytännön beta-vaiheen tietosuojaseloste.
// Tarkistuta juristilla ennen kaupallista laajentamista.
// Korvaa kaikki [HAKASULKEISSA] olevat kohdat ennen julkaisua.

export default function PrivacyPage() {
  const s = {
    page: { maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' } as React.CSSProperties,
    h1: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.5rem' } as React.CSSProperties,
    updated: { fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '2.5rem' } as React.CSSProperties,
    h2: { fontSize: '1.0625rem', fontWeight: 700, color: 'var(--c-text-1)', marginTop: '2rem', marginBottom: '0.5rem' } as React.CSSProperties,
    p: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, marginBottom: '0.75rem' } as React.CSSProperties,
    ul: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.75rem' } as React.CSSProperties,
    note: { fontSize: '12px', color: 'var(--c-text-3)', background: 'var(--c-surface-2)', borderRadius: '6px', padding: '10px 14px', marginBottom: '2rem' } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      <div style={s.note}>
        ⚠ Tämä on beta-vaiheen seloste. Tarkistuta juristilla ennen laajaa kaupallista käyttöä.
      </div>

      <h1 style={s.h1}>Tietosuojaseloste</h1>
      <p style={s.updated}>Viimeksi päivitetty: 23.6.2026</p>

      <h2 style={s.h2}>1. Rekisterinpitäjä</h2>
      <p style={s.p}>
        Tulkintatila / Fiksiribu<br />
        Y-tunnus 1976813-2<br />
        Kotipaikka Helsinki<br />
        <a href="mailto:hello@tulkintatila.fi" style={{ color: 'var(--c-accent)' }}>hello@tulkintatila.fi</a>
      </p>

      <h2 style={s.h2}>2. Mitä tietoja keräämme ja miksi</h2>
      <p style={s.p}>Keräämme henkilötietoja palvelun käyttämisen mahdollistamiseksi. Kerättävät tiedot:</p>
      <ul style={s.ul}>
        <li><strong>Tilin tiedot:</strong> sähköpostiosoite, nimi, Clerk-käyttäjätunnus. Käsittelyperuste: sopimuksen täytäntöönpano (GDPR art. 6(1)(b)).</li>
        <li><strong>Organisaatiotiedot:</strong> yrityksen nimi, organisaatiotunnus Clerkissä. Käsittelyperuste: sopimuksen täytäntöönpano.</li>
        <li><strong>Tuotetiedot:</strong> valmistajan nimi, osoite, sähköposti; vastuullisen toimijan tiedot. Käsittelyperuste: sopimuksen täytäntöönpano.</li>
        <li><strong>Laskutustiedot:</strong> nimi, sähköposti laskutusta varten. Käsittelyperuste: lakisääteinen velvoite ja oikeutettu etu.</li>
        <li><strong>Käyttöloki:</strong> kirjautumisajat, API-kutsut. Käsittelyperuste: oikeutettu etu (tietoturva).</li>
      </ul>

      <h2 style={s.h2}>3. Tietojen säilytysaika</h2>
      <p style={s.p}>Tilin tiedot säilytetään palvelusuhteen ajan ja poistetaan 30 päivää tilin sulkemisen jälkeen, ellei laki edellytä pidempää säilytystä. Laskuaineisto säilytetään kirjanpitolain mukaisesti 6 vuotta.</p>

      <h2 style={s.h2}>4. Tietojen luovuttaminen</h2>
      <p style={s.p}>Henkilötietojasi ei myydä eikä luovuteta kolmansille osapuolille markkinointitarkoituksiin. Käytämme seuraavia alihankkijoita:</p>
      <ul style={s.ul}>
        <li><strong>Clerk (clerk.com):</strong> käyttäjätunnistautuminen ja organisaatiohallinta (USA, SCC-sopimus)</li>
        <li><strong>Cloudflare (cloudflare.com):</strong> palvelininfrastruktuuri, tietokanta ja tiedostosäilytys (EU)</li>
        <li><strong>Holvi:</strong> laskutus (käytetään palvelun ulkopuolella, ei pääsyä tuotetietoihin)</li>
      </ul>

      <h2 style={s.h2}>5. Rekisteröidyn oikeudet</h2>
      <p style={s.p}>Sinulla on oikeus:</p>
      <ul style={s.ul}>
        <li>saada tietoa käsittelemistämme henkilötiedoistasi (art. 15)</li>
        <li>pyytää tietojen oikaisemista (art. 16)</li>
        <li>pyytää tietojen poistamista (art. 17)</li>
        <li>rajoittaa käsittelyä (art. 18)</li>
        <li>siirtää tietosi toiseen palveluun (art. 20)</li>
        <li>tehdä valitus tietosuojavaltuutetulle (tietosuoja.fi)</li>
      </ul>
      <p style={s.p}>Lähetä pyynnöt osoitteeseen: hello@tulkintatila.fi</p>

      <h2 style={s.h2}>6. Evästeet ja kolmannen osapuolen skriptit</h2>
      <p style={s.p}>Käytämme Clerkin istuntoevästeita kirjautumisen ylläpitämiseen. Käytämme Google Fonts -palvelua fonttilatauksia varten — tämä aiheuttaa yhteyden Googlen palvelimiin sivun latauksen yhteydessä. Emme käytä seurantaevästeitä tai analytiikkapalveluita tällä hetkellä.</p>

      <h2 style={s.h2}>7. Tietoturva</h2>
      <p style={s.p}>Tilit suojataan Clerkin tarjoamalla tunnistautumisella. Tiedot salataan siirron aikana TLS-protokollalla. Tuotetiedot tallennetaan Cloudflaren D1-tietokantaan, joka sijaitsee EU:ssa.</p>

      <div style={{ borderTop: '1px solid var(--c-border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
        <p style={{ ...s.p, fontSize: '12px', color: 'var(--c-text-3)' }}>
          Lisätietoja:{' '}
          <Link href="/legal/tietojenkasittely" style={{ color: 'var(--c-accent)' }}>Tietojenkäsittelysopimus</Link>
          {' '}·{' '}
          <Link href="/legal/kayttoehdot" style={{ color: 'var(--c-accent)' }}>Käyttöehdot</Link>
        </p>
      </div>
    </div>
  );
}
