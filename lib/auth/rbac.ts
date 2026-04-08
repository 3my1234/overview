import { Role } from '@/lib/types';

const roleAllowedPrefixes: Record<Role, string[]> = {
  super_admin: [
    '/dashboard',
    '/inventory',
    '/sales',
    '/accounting',
    '/reports',
    '/audit',
    '/settings',
    '/reconciliation',
  ],
  admin: [
    '/dashboard',
    '/inventory',
    '/sales',
    '/accounting',
    '/reports',
    '/settings/users',
    '/settings/workers',
    '/reconciliation',
  ],
  ceo: ['/dashboard', '/reports', '/inventory', '/sales', '/accounting', '/audit', '/reconciliation'],
  accountant: ['/dashboard', '/accounting', '/reports/financial'],
  warehouse_manager: ['/dashboard', '/inventory', '/reconciliation/daily'],
  sales_manager: ['/dashboard', '/sales'],
  auditor: ['/dashboard', '/audit', '/reports/financial'],
  worker: [
    '/dashboard',
    '/sales/transactions',
    '/inventory/purchases',
    '/inventory/transfers',
    '/inventory/production',
    '/reconciliation/daily',
  ],
};

export function getDefaultRouteForRole(role: Role): string {
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
      return '/dashboard';
  }
}

export function canRoleAccessPath(role: Role, pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/auth')) return true;
  const allowedPrefixes = roleAllowedPrefixes[role] || [];
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

