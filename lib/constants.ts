// Status Enums
export const TRANSACTION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  POSTED: 'posted',
} as const;

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  CONSUMPTION: 'consumption',
} as const;

export const ACCOUNT_TYPES = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  SALES_MANAGER: 'sales_manager',
  ACCOUNTANT: 'accountant',
  CEO: 'ceo',
  AUDITOR: 'auditor',
} as const;

// Role Labels
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  warehouse_manager: 'Warehouse Manager',
  sales_manager: 'Sales Manager',
  accountant: 'Accountant',
  ceo: 'CEO',
  auditor: 'Auditor',
};

// Status Labels
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  posted: 'Posted',
  pending: 'Pending',
  rejected: 'Rejected',
  active: 'Active',
  inactive: 'Inactive',
  reconciled: 'Reconciled',
  investigation: 'Under Investigation',
};

// Status Colors (for badges)
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  posted: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  reconciled: 'bg-green-100 text-green-800',
  investigation: 'bg-orange-100 text-orange-800',
};

// Navigation Menu Items by Role
export const ROLE_BASED_MENU = {
  ceo: [
    { label: 'Dashboard', href: '/dashboard/ceo', icon: 'BarChart3' },
    { label: 'Inventory', href: '/inventory', icon: 'Package' },
    { label: 'Sales', href: '/sales', icon: 'ShoppingCart' },
    { label: 'Accounting', href: '/accounting', icon: 'Calculator' },
    { label: 'Reports', href: '/reports', icon: 'FileText' },
    { label: 'Reconciliation', href: '/reconciliation', icon: 'CheckCircle' },
    { label: 'Audit', href: '/audit', icon: 'Eye' },
    { label: 'Settings', href: '/settings', icon: 'Settings' },
  ],
  warehouse_manager: [
    { label: 'Dashboard', href: '/dashboard', icon: 'Package' },
    { label: 'Products', href: '/inventory/products', icon: 'Package' },
    { label: 'Stock Ledger', href: '/inventory/stock-ledger', icon: 'BookOpen' },
    { label: 'Purchases', href: '/inventory/purchases', icon: 'TrendingDown' },
    { label: 'Transfers', href: '/inventory/transfers', icon: 'ArrowRightLeft' },
    { label: 'Reconciliation', href: '/reconciliation/daily', icon: 'CheckCircle' },
  ],
  sales_manager: [
    { label: 'Dashboard', href: '/dashboard', icon: 'ShoppingCart' },
    { label: 'Transactions', href: '/sales/transactions', icon: 'FileText' },
    { label: 'Daily Summary', href: '/sales/daily-summary', icon: 'BarChart3' },
  ],
  accountant: [
    { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: 'List' },
    { label: 'Journals', href: '/accounting/journals', icon: 'BookOpen' },
    { label: 'Inventory Ledger', href: '/accounting/ledgers/inventory', icon: 'Database' },
    { label: 'Bank Ledger', href: '/accounting/ledgers/banks', icon: 'CreditCard' },
    { label: 'PPE Ledger', href: '/accounting/ledgers/ppe', icon: 'Home' },
    { label: 'Admin Costs', href: '/accounting/admin-costs', icon: 'Briefcase' },
    { label: 'Trial Balance', href: '/accounting/trial-balance', icon: 'Scale' },
  ],
  auditor: [
    { label: 'Audit Logs', href: '/audit/logs', icon: 'Eye' },
    { label: 'Reports', href: '/reports/financial', icon: 'FileText' },
  ],
};

// Units
export const UNITS = {
  LITRES: 'litres',
  DRUMS: 'drums',
  TONNES: 'tonnes',
  BAGS: 'bags',
} as const;

export const UNIT_LABELS: Record<string, string> = {
  litres: 'Litres (L)',
  drums: 'Drums',
  tonnes: 'Tonnes (MT)',
  bags: 'Bags',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  SIZES: [5, 10, 20, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_TIME: 'MMM d, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  TABLE: 'dd/MM/yyyy',
} as const;

// Thresholds
export const THRESHOLDS = {
  RECONCILIATION_VARIANCE: 0.5, // percentage
  LOW_STOCK_WARNING: 0.2, // 20% of reorder level
  APPROVAL_TIMEOUT_DAYS: 3,
} as const;

// Number Formatting
export const NUMBER_FORMATS = {
  CURRENCY: {
    symbol: 'MYR',
    decimals: 2,
  },
  QUANTITY: {
    decimals: 2,
  },
  PERCENTAGE: {
    decimals: 2,
  },
} as const;
