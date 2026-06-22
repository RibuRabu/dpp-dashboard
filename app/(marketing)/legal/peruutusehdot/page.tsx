import Link from 'next/link';

export const metadata = {
  title: 'Peruutusehdot – Tuotepassi',
};

export default function CancellationPage() {
  const s = {
    page: { maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' } as React.CSSProperties,
    h1: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.5rem' } as React.CSSProperties,
    updated: { fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '2.5rem' } as React.CSSProperties,
    h2: { fontSize: '1.0625rem', fontWeight: 700, color: 'var(--c-text-1)', marginTop: '2rem', marginBottom: '0.5rem' } as React.CSSProperties,
    p: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, marginBottom: '0.75rem' } as React.CSSProperties,
    ul: { fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.75rem' } as React.CSSProperties,
    box: { background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Peruutusehdot</h1>
      <p style={s.updated}>Viimeksi päivitetty: [PVM]</p>

      <div style={s.box}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--c-text-1)', marginBottom: '0.5rem' }}>Tiivistelmä</div>
        <ul style={{ ...s.ul, marginBottom: 0 }}>
          <li>Voit peruuttaa tilauksen koska tahansa kirjallisesti.</li>
          <li>Peruutus astuu voimaan kulumassa olevan laskutuskauden lopussa.</li>
          <li>Maksettuja maksuja ei palauteta.</li>
          <li>Tietosi säilyvät 30 päivää peruutuksen jälkeen.</li>
        </ul>
      </div>

      <h2 style={s.h2}>1. Peruutusoikeus</h2>
      <p style={s.p}>Voit peruuttaa tilauksen koska tahansa ilmoittamalla siitä kirjallisesti sähköpostitse osoitteeseen [SAHKOPOSTI]. Peruutus astuu voimaan kulumassa olevan laskutuskauden viimeisenä päivänä.</p>
      <p style={s.p}>Esimerkki: Jos tilaus on voimassa 1.–31.7. ja peruutat 15.7., palvelu jatkuu 31.7. saakka. Seuraavaa kuukautta ei laskuteta.</p>

      <h2 style={s.h2}>2. Hyvitykset</h2>
      <p style={s.p}>Koska palvelu on digitaalinen ja käytettävissä välittömästi, jo maksettuja maksuja ei palauteta. Poikkeuksena on tilanne, jossa palveluntarjoajan virhe on estänyt palvelun käytön merkittävässä osassa laskutuskautta – tällöin hyvityksestä sovitaan tapauskohtaisesti.</p>

      <h2 style={s.h2}>3. Tietojen säilytys peruutuksen jälkeen</h2>
      <p style={s.p}>Tuotetietosi ja dokumenttisi säilytetään 30 päivää sopimuksen päättymisestä. Tänä aikana voit pyytää tietojesi vientiä ottamalla yhteyttä [SAHKOPOSTI]. Tämän jälkeen tiedot poistetaan pysyvästi.</p>
      <p style={s.p}>Julkiset tuotepassisivut (QR-koodilla linkitetyt) poistetaan heti peruutuksen vahvistamisesta.</p>

      <h2 style={s.h2}>4. Palveluntarjoajan oikeus keskeyttää palvelu</h2>
      <p style={s.p}>Palveluntarjoajalla on oikeus keskeyttää tai lopettaa palvelu:</p>
      <ul style={s.ul}>
        <li>maksamattoman laskun vuoksi (ks. käyttöehdot kohta 4)</li>
        <li>ehtojen rikkomisen vuoksi ilman erillistä varoitusta</li>
        <li>palveluntarjoajan omasta päätöksestä 30 päivän ilmoitusajalla</li>
      </ul>
      <p style={s.p}>Jos palveluntarjoaja lopettaa palvelun omasta aloitteestaan, asiakkaalle palautetaan jo maksettu, käyttämätön osuus.</p>

      <h2 style={s.h2}>5. Peruutuksen tekeminen</h2>
      <p style={s.p}>Lähetä peruutuspyyntö osoitteeseen [SAHKOPOSTI] aiheella "Tilauksen peruutus". Vahvistamme peruutuksen 2 arkipäivän kuluessa.</p>

      <div style={{ borderTop: '1px solid var(--c-border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
          <Link href="/legal/kayttoehdot" style={{ color: 'var(--c-accent)' }}>Käyttöehdot</Link>
          {' '}·{' '}
          <Link href="/hinnoittelu" style={{ color: 'var(--c-accent)' }}>Hinnoittelu</Link>
        </p>
      </div>
    </div>
  );
}
