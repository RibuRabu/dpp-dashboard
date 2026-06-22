import Link from 'next/link';

export const metadata = {
  title: 'Käyttöehdot – Tuotepassi',
};

// BETA-VAIHE: Tämä on käytännön beta-vaiheen sopimuspohja.
// Tarkistuta juristilla ennen kaupallista laajentamista.

export default function TermsPage() {
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
        ⚠ Tämä on beta-vaiheen sopimuspohja. Tarkistuta juristilla ennen laajaa kaupallista käyttöä.
      </div>

      <h1 style={s.h1}>Käyttöehdot</h1>
      <p style={s.updated}>Viimeksi päivitetty: [PVM]</p>

      <h2 style={s.h2}>1. Palveluntarjoaja</h2>
      <p style={s.p}>[YRITYKSEN NIMI], Y-tunnus [Y-TUNNUS], [OSOITE]. Jäljempänä "palveluntarjoaja" tai "me".</p>

      <h2 style={s.h2}>2. Palvelun kuvaus</h2>
      <p style={s.p}>Tarjoamme SaaS-pohjaisen tuotepassipalvelun, jolla voit hallita tuotetietoja, vaatimustenmukaisuusdokumentteja ja jakaa tuotetietoja QR-koodin tai NFC-tunnisteen avulla. Palvelu on tarkoitettu yrityskäyttöön.</p>
      <p style={s.p}>Palvelu ei korvaa juridista neuvontaa. Tuotetietojen oikeellisuudesta ja viranomaisvaatimusten täyttymisestä vastaa aina asiakas.</p>

      <h2 style={s.h2}>3. Sopimuksen syntyminen</h2>
      <p style={s.p}>Sopimus syntyy, kun olet luonut tilin palveluun ja hyväksynyt nämä käyttöehdot. Beta-vaiheessa palveluntarjoaja voi hyväksyä tai hylätä uusia asiakkaita harkintansa mukaan.</p>

      <h2 style={s.h2}>4. Maksuehdot</h2>
      <p style={s.p}>Beta-vaiheessa laskutus tapahtuu manuaalisesti kuukausittain. Lasku lähetetään sähköpostitse. Maksuehto 14 päivää. Myöhästyneestä maksusta perimme viivästyskorkoa korkolain mukaisesti.</p>
      <p style={s.p}>Jos lasku jää maksamatta 30 päivän kuluttua eräpäivästä, palveluntarjoajalla on oikeus keskeyttää palvelu. Keskeytyneestä palvelusta ei palauteta jo maksettuja maksuja.</p>

      <h2 style={s.h2}>5. Asiakkaan vastuut</h2>
      <ul style={s.ul}>
        <li>Olet vastuussa palveluun syöttämiesi tietojen oikeellisuudesta.</li>
        <li>Älä tallenna palveluun arkaluonteisia henkilötietoja, kuten henkilötunnuksia tai terveystietoja.</li>
        <li>Käytä palvelua vain laillisiin tarkoituksiin.</li>
        <li>Pidä kirjautumistietosi turvassa.</li>
      </ul>

      <h2 style={s.h2}>6. Palveluntarjoajan vastuunrajoitus</h2>
      <p style={s.p}>Palvelu tarjotaan "sellaisena kuin se on" (as is). Emme takaa palvelun yhtäjaksoista toimivuutta tai virheetöntä toimintaa.</p>
      <p style={s.p}>Palveluntarjoajan korvausvastuu on enintään asiakkaan viimeisen 3 kuukauden aikana maksamien maksujen suuruinen. Emme vastaa välillisistä vahingoista, kuten saamatta jääneestä liikevoitosta.</p>

      <h2 style={s.h2}>7. Immateriaalioikeudet</h2>
      <p style={s.p}>Palvelun ohjelmisto ja käyttöliittymä kuuluvat palveluntarjoajalle. Sinulla on oikeus käyttää palvelua sopimuksen mukaisesti, mutta ei kopioida, muokata tai jakaa sitä edelleen.</p>
      <p style={s.p}>Olet itse vastuussa palveluun lataamiesi dokumenttien ja tietojen immateriaalioikeuksista.</p>

      <h2 style={s.h2}>8. Sopimuksen irtisanominen</h2>
      <p style={s.p}>Lue <Link href="/legal/peruutusehdot" style={{ color: 'var(--c-accent)' }}>peruutusehdot</Link>.</p>

      <h2 style={s.h2}>9. Muutokset ehtoihin</h2>
      <p style={s.p}>Palveluntarjoajalla on oikeus muuttaa näitä ehtoja ilmoittamalla asiasta 30 päivää etukäteen sähköpostitse. Jatkamalla palvelun käyttöä muutosten jälkeen hyväksyt uudet ehdot.</p>

      <h2 style={s.h2}>10. Sovellettava laki ja riitojen ratkaisu</h2>
      <p style={s.p}>Näihin ehtoihin sovelletaan Suomen lakia. Riidat pyritään ratkaisemaan ensisijaisesti neuvottelemalla. Elleivät neuvottelut johda tulokseen, riita ratkaistaan [KAUPUNKI]n käräjäoikeudessa.</p>

      <div style={{ borderTop: '1px solid var(--c-border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
          <Link href="/legal/tietosuoja" style={{ color: 'var(--c-accent)' }}>Tietosuojaseloste</Link>
          {' '}·{' '}
          <Link href="/legal/peruutusehdot" style={{ color: 'var(--c-accent)' }}>Peruutusehdot</Link>
          {' '}·{' '}
          <Link href="/legal/tietojenkasittely" style={{ color: 'var(--c-accent)' }}>Tietojenkäsittelysopimus</Link>
        </p>
      </div>
    </div>
  );
}
