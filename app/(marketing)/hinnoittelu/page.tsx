import Link from 'next/link';

export const metadata = {
  title: 'Hinnoittelu – Tuotepassi',
  description: 'Yksinkertainen kuukausihinta ilman piilomaksuja. Beta-vaiheessa laskutus manuaalisesti.',
};

const PLANS = [
  {
    name: 'Starter',
    price: '29',
    unit: '€/kk',
    limit: '5 tuotetta',
    features: [
      'Enintään 5 tuotetta',
      'QR-koodit ja NFC-tuki',
      'EU-vaatimusten tarkistus',
      'Vaatimustenmukaisuusdokumentit',
      'Omistajan hallintanäkymä',
      'Julkinen tuotepassisivusto',
    ],
    cta: 'Aloita Starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '79',
    unit: '€/kk',
    limit: '50 tuotetta',
    features: [
      'Enintään 50 tuotetta',
      'Kaikki Starter-ominaisuudet',
      'Tiimikäyttö (Clerk-organisaatio)',
      'Useita käyttäjiä',
      'Prioriteettituki',
    ],
    cta: 'Aloita Pro',
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', padding: '4px 10px', borderRadius: '4px', marginBottom: '1rem' }}>Beta-hinnoittelu</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '0.75rem' }}>Selkeä hinta, ei piilomaksuja</h1>
        <p style={{ fontSize: '15px', color: 'var(--c-text-2)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Beta-vaiheessa laskutus tapahtuu manuaalisesti kuukausittain. Ei korttitietoja, ei automaattiveloituksia.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{ background: 'var(--c-surface)', border: `2px solid ${plan.highlight ? 'var(--c-accent)' : 'var(--c-border)'}`, borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {plan.highlight && (
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Suosituin</div>
            )}
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--c-text-1)' }}>{plan.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>{plan.limit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--c-text-1)' }}>{plan.price}</span>
              <span style={{ fontSize: '14px', color: 'var(--c-text-3)' }}>{plan.unit}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: '13px', color: 'var(--c-text-2)', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--c-ok)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up" style={{ display: 'block', textAlign: 'center', padding: '10px', background: plan.highlight ? 'var(--c-accent)' : 'var(--c-surface-2)', color: plan.highlight ? '#fff' : 'var(--c-text-1)', borderRadius: '7px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: `1px solid ${plan.highlight ? 'var(--c-accent)' : 'var(--c-border)'}` }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Onboarding */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--c-text-1)', marginBottom: '0.4rem' }}>Käyttöönotto</div>
            <p style={{ fontSize: '13px', color: 'var(--c-text-2)', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
              Tarvitsetko apua käyttöönotossa? Voimme auttaa ensimmäisten tuotteiden lisäämisessä ja järjestelmän räätälöinnissä.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--c-text-1)' }}>149 €</div>
            <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>kertamaksu</div>
          </div>
        </div>
      </div>

      {/* Billing notes */}
      <div style={{ background: 'var(--c-surface-2)', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '0.5rem' }}>Laskutus beta-vaiheessa</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            'Laskutus kuukausittain manuaalisesti Holvin kautta',
            'Ei automaattista korttivelotusta',
            'Lasku lähetetään sähköpostitse ennen erääntymistä',
            'Peruutus voimaan seuraavan laskutuskauden loppuun mennessä',
            'Hinnat sisältävät ALV 25,5 %',
          ].map(item => (
            <li key={item} style={{ fontSize: '13px', color: 'var(--c-text-2)', display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--c-text-3)' }}>·</span>{item}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--c-text-3)', textAlign: 'center' }}>
        Kysymyksiä? <a href="mailto:hello@tulkintatila.fi" style={{ color: 'var(--c-accent)' }}>Ota yhteyttä</a> · Lue myös{' '}
        <Link href="/legal/kayttoehdot" style={{ color: 'var(--c-accent)' }}>käyttöehdot</Link> ja{' '}
        <Link href="/legal/peruutusehdot" style={{ color: 'var(--c-accent)' }}>peruutusehdot</Link>
      </p>
    </div>
  );
}
