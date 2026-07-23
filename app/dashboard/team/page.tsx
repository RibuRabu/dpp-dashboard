import { OrganizationProfile } from '@clerk/nextjs';

export default function TeamPage() {
  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Tiimi</h1>
      <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '24px', maxWidth: '560px' }}>
        Hallitse organisaatiosi jäseniä ja kutsuja. Voit kutsua uusia käyttäjiä ja hallita heidän
        oikeuksiaan. Saman organisaation jäsenet pääsevät käsittelemään samoja tuotepasseja.
      </p>
      <OrganizationProfile routing="hash" />
    </div>
  );
}
