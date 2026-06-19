import { OrganizationProfile } from '@clerk/nextjs';

export default function TeamPage() {
  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Tiimi</h1>
      <OrganizationProfile routing="hash" />
    </div>
  );
}
