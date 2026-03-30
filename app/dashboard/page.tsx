import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser } from '@/lib/server/in-memory-store';

function resolveDashboardRoute(role: string) {
  switch (role) {
    case 'super_admin':
    case 'admin':
    case 'ceo':
      return '/dashboard/ceo';
    case 'warehouse_manager':
      return '/inventory/purchases';
    case 'sales_manager':
    case 'worker':
      return '/sales/transactions';
    case 'accountant':
      return '/accounting/journals';
    case 'auditor':
      return '/audit/logs';
    default:
      return '/dashboard/ceo';
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const user = getSessionUser(sessionToken);

  if (!user) {
    redirect('/auth/login');
  }

  redirect(resolveDashboardRoute(user.role));
}
