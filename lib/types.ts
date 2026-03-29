// Role and User Types
export type Role = 'admin' | 'warehouse_manager' | 'sales_manager' | 'accountant' | 'ceo' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  warehouse?: string;
  branch?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Locations
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number; // litres
  manager: string;
  status: 'active' | 'inactive';
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  warehouseId: string;
  manager: string;
  status: 'active' | 'inactive';
}

// Inventory
export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: 'litres' | 'drums' | 'tonnes' | 'bags';
  unitPrice: number;
  standardCost: number;
  currentStock: number;
  reorderLevel: number;
  status: 'active' | 'discontinued';
}

export interface StockMovement {
  id: string;
  date: Date;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'consumption';
  productId: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  branchId?: string;
  referenceDocument: string; // PO, SO, JE number
  cost?: number;
  status: 'draft' | 'posted';
  createdBy: string;
  approvedBy?: string;
  approvalDate?: Date;
}

export interface StockLedger {
  id: string;
  productId: string;
  warehouseId: string;
  date: Date;
  movementType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balance: number;
  reference: string;
}

// Sales
export interface SalesTransaction {
  id: string;
  date: Date;
  transactionNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  branchId: string;
  items: SalesLineItem[];
  totalQuantity: number;
  totalAmount: number;
  costOfGoods: number;
  grossMargin: number;
  marginPercentage: number;
  status: 'draft' | 'submitted' | 'approved' | 'posted';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  comments?: string;
}

export interface SalesLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  cost: number;
  margin: number;
}

// Reconciliation
export interface ReconciliationRecord {
  id: string;
  date: Date;
  warehouseId: string;
  productId: string;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  variancePercentage: number;
  varianceValue: number;
  status: 'pending' | 'reconciled' | 'investigation';
  notes?: string;
  reconcililedBy?: string;
  reconciliationDate?: Date;
}

// Accounting
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  balance: number;
  isControlAccount: boolean;
  status: 'active' | 'inactive';
}

export interface JournalEntry {
  id: string;
  date: Date;
  journalNumber: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'submitted' | 'approved' | 'posted';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  sourceDocument: string; // Reference to inventory or sales doc
  createdBy: string;
  approvedBy?: string;
  postedBy?: string;
  createdAt: Date;
  approvalDate?: Date;
  postingDate?: Date;
  comments?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface GeneralLedger {
  id: string;
  accountId: string;
  date: Date;
  journalNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

export interface TrialBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

// Reports
export interface FinancialStatement {
  id: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow';
  date: Date;
  sections: FinancialSection[];
  totals: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

export interface FinancialSection {
  name: string;
  items: {
    label: string;
    amount: number;
    subItems?: { label: string; amount: number }[];
  }[];
  subtotal: number;
}

export interface OperationalMetrics {
  date: Date;
  totalStockQuantity: number;
  totalStockValue: number;
  totalSalesQuantity: number;
  totalSalesAmount: number;
  costOfGoods: number;
  grossMargin: number;
  marginPercentage: number;
  stockTuroverRate: number;
}

// Audit
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
}

// Approval
export interface ApprovalRequest {
  id: string;
  type: 'journal_entry' | 'sales_transaction' | 'stock_movement';
  entityId: string;
  requestedBy: string;
  assignedTo: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  responseAt?: Date;
  comments?: string;
  rejectionReason?: string;
}

// Dashboard Summary
export interface DashboardMetrics {
  totalStock: {
    quantity: number;
    value: number;
    trend: number;
  };
  totalSales: {
    amount: number;
    quantity: number;
    transactions: number;
    trend: number;
  };
  pendingApprovals: number;
  reconciliationVariance: {
    amount: number;
    percentage: number;
  };
  topProducts: Product[];
  recentTransactions: StockMovement[];
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Query Filters
export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  warehouseId?: string;
  branchId?: string;
  productId?: string;
  status?: string;
  userId?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Constants for Statuses
export const STOCK_MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'transfer', 'consumption'] as const;
export const TRANSACTION_STATUSES = ['draft', 'submitted', 'approved', 'posted'] as const;
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
export const ROLES = ['admin', 'warehouse_manager', 'sales_manager', 'accountant', 'ceo', 'auditor'] as const;
