import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getDefaultRouteForRole } from '@/lib/auth/rbac';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';

export default async function DashboardPage() {
  await prepareAuthStore();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const user = await getSessionUser(sessionToken);

  if (!user) {
    redirect('/auth/login');
  }

  redirect(getDefaultRouteForRole(user.role));
}
