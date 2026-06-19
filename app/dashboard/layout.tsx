import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { ApiError, listTenants } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) redirect('/sign-in');

  // Check platform admin status for nav
  let isPlatformAdmin = false;
  try {
    const token = await getToken();
    if (token) {
      await listTenants(token, 0);
      isPlatformAdmin = true;
    }
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) {
      // 401 = not platform admin, anything else is unexpected
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      <Nav isPlatformAdmin={isPlatformAdmin} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
