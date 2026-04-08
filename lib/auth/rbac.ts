import { Role } from '@/lib/types';

const roleAllowedPrefixes: Record<Role, string[]> = {
  super_admin: [
    '/dashboard/ceo',
    '/inventory',
    '/sales',
    '/accounting',
    '/reports',
    '/audit',
    '/settings',
    '/reconciliation',
  ],
  admin: [
    '/dashboard/admin',
    '/inventory',
    '/sales',
    '/reports/operational',
    '/settings/users',
    '/settings/workers',
    '/reconciliation',
  ],
  ceo: ['/dashboard/ceo', '/reports', '/inventory', '/sales', '/accounting', '/audit', '/reconciliation'],
  accountant: ['/accounting', '/reports/financial'],
  warehouse_manager: ['/inventory', '/reconciliation/daily'],
  sales_manager: ['/sales'],
  auditor: ['/audit', '/reports/financial'],
  worker: [
    '/dashboard/worker',
    '/sales/transactions',
    '/inventory/transfers',
    '/inventory/production',
    '/reconciliation/daily',
  ],
};

export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case 'super_admin':
    case 'ceo':
      return '/dashboard/ceo';
    case 'admin':
      return '/dashboard/admin';
    case 'warehouse_manager':
      return '/inventory/purchases';
    case 'sales_manager':
      return '/sales/transactions';
    case 'worker':
      return '/dashboard/worker';
    case 'accountant':
      return '/accounting/journals';
    case 'auditor':
      return '/audit/logs';
    default:
      return '/dashboard';
  }
}

export function canRoleAccessPath(role: Role, pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/auth')) return true;
  if (pathname === '/dashboard') return true;
  const allowedPrefixes = roleAllowedPrefixes[role] || [];
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
