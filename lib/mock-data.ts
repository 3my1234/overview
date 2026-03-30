import {
  User, Warehouse, Branch, Product, StockMovement, SalesTransaction,
  ReconciliationRecord, Account, JournalEntry, GeneralLedger, TrialBalance,
  DashboardMetrics, AuditLog, StockLedger, OperationalMetrics, Role
} from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'John Doe',
    email: 'john@palmcorp.com',
    role: 'ceo',
    status: 'active',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'user_2',
    name: 'Sarah Johnson',
    email: 'sarah@palmcorp.com',
    role: 'warehouse_manager',
    warehouse: 'warehouse_1',
    status: 'active',
    createdAt: new Date('2023-02-10'),
  },
  {
    id: 'user_3',
    name: 'Mike Chen',
    email: 'mike@palmcorp.com',
    role: 'sales_manager',
    branch: 'branch_1',
    status: 'active',
    createdAt: new Date('2023-03-05'),
  },
  {
    id: 'user_4',
    name: 'Emma Wilson',
    email: 'emma@palmcorp.com',
    role: 'accountant',
    status: 'active',
    createdAt: new Date('2023-01-20'),
  },
  {
    id: 'user_5',
    name: 'David Kumar',
    email: 'david@palmcorp.com',
    role: 'auditor',
    status: 'active',
    createdAt: new Date('2023-04-01'),
  },
];

// Mock Warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: 'warehouse_1',
    name: 'Main Distribution Center',
    location: 'Port Klang, Selangor',
    capacity: 500000,
    manager: 'Sarah Johnson',
    status: 'active',
  },
  {
    id: 'warehouse_2',
    name: 'Northern Hub',
    location: 'Ipoh, Perak',
    capacity: 300000,
    manager: 'Ahmad Hassan',
    status: 'active',
  },
  {
    id: 'warehouse_3',
    name: 'Eastern Storage',
    location: 'Kuantan, Pahang',
    capacity: 250000,
    manager: 'Lisa Chen',
    status: 'active',
  },
];

// Mock Branches
export const mockBranches: Branch[] = [
  {
    id: 'branch_1',
    name: 'Kuala Lumpur Sales',
    location: 'KL, Wilayah Persekutuan',
    warehouseId: 'warehouse_1',
    manager: 'Mike Chen',
    status: 'active',
  },
  {
    id: 'branch_2',
    name: 'Penang Trading',
    location: 'George Town, Penang',
    warehouseId: 'warehouse_2',
    manager: 'Ravi Menon',
    status: 'active',
  },
  {
    id: 'branch_3',
    name: 'Johor Export',
    location: 'Johor Bahru, Johor',
    warehouseId: 'warehouse_3',
    manager: 'Nina Ismail',
    status: 'active',
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Crude Palm Oil - Grade A',
    sku: 'CPO-GRA-001',
    unit: 'litres',
    unitPrice: 3.50,
    standardCost: 2.80,
    currentStock: 125000,
    reorderLevel: 50000,
    status: 'active',
  },
  {
    id: 'prod_2',
    name: 'Refined Palm Oil',
    sku: 'RPO-STD-001',
    unit: 'litres',
    unitPrice: 4.20,
    standardCost: 3.40,
    currentStock: 87500,
    reorderLevel: 35000,
    status: 'active',
  },
  {
    id: 'prod_3',
    name: 'Palm Kernel Oil',
    sku: 'PKO-NUT-001',
    unit: 'litres',
    unitPrice: 5.80,
    standardCost: 4.60,
    currentStock: 45000,
    reorderLevel: 20000,
    status: 'active',
  },
  {
    id: 'prod_4',
    name: 'Palm Methyl Ester',
    sku: 'PME-BIO-001',
    unit: 'drums',
    unitPrice: 420,
    standardCost: 350,
    currentStock: 2500,
    reorderLevel: 1000,
    status: 'active',
  },
  {
    id: 'prod_5',
    name: 'Palm Fatty Acids',
    sku: 'PFA-CHM-001',
    unit: 'tonnes',
    unitPrice: 2400,
    standardCost: 1920,
    currentStock: 180,
    reorderLevel: 50,
    status: 'active',
  },
];

// Mock Stock Movements
export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov_1',
    date: new Date('2024-03-25'),
    type: 'purchase',
    productId: 'prod_1',
    quantity: 50000,
    unit: 'litres',
    warehouseId: 'warehouse_1',
    referenceDocument: 'PO-2024-001',
    cost: 140000,
    status: 'posted',
    createdBy: 'user_2',
    approvedBy: 'user_1',
    approvalDate: new Date('2024-03-25'),
  },
  {
    id: 'mov_2',
    date: new Date('2024-03-26'),
    type: 'sale',
    productId: 'prod_2',
    quantity: 12000,
    unit: 'litres',
    warehouseId: 'warehouse_1',
    branchId: 'branch_1',
    referenceDocument: 'SO-2024-015',
    cost: 40800,
    status: 'posted',
    createdBy: 'user_3',
    approvedBy: 'user_1',
    approvalDate: new Date('2024-03-26'),
  },
  {
    id: 'mov_3',
    date: new Date('2024-03-27'),
    type: 'transfer',
    productId: 'prod_1',
    quantity: 25000,
    unit: 'litres',
    warehouseId: 'warehouse_1',
    branchId: 'branch_2',
    referenceDocument: 'TR-2024-008',
    status: 'draft',
    createdBy: 'user_2',
  },
  {
    id: 'mov_4',
    date: new Date('2024-03-28'),
    type: 'adjustment',
    productId: 'prod_3',
    quantity: -500,
    unit: 'litres',
    warehouseId: 'warehouse_2',
    referenceDocument: 'ADJ-2024-012',
    status: 'submitted',
    createdBy: 'user_2',
  },
];

// Mock Sales Transactions
export const mockSalesTransactions: SalesTransaction[] = [
  {
    id: 'sales_1',
    date: new Date('2024-03-26'),
    transactionNumber: 'SO-2024-015',
    customerId: 'cust_1',
    customerName: 'Indo Biodiesel Corp',
    warehouseId: 'warehouse_1',
    branchId: 'branch_1',
    items: [
      {
        id: 'item_1',
        productId: 'prod_2',
        productName: 'Refined Palm Oil',
        quantity: 12000,
        unitPrice: 4.20,
        lineTotal: 50400,
        cost: 40800,
        margin: 9600,
      },
    ],
    totalQuantity: 12000,
    totalAmount: 50400,
    costOfGoods: 40800,
    grossMargin: 9600,
    marginPercentage: 19.05,
    status: 'posted',
    approvalStatus: 'approved',
    createdBy: 'user_3',
    approvedBy: 'user_1',
    approvalDate: new Date('2024-03-26'),
  },
  {
    id: 'sales_2',
    date: new Date('2024-03-27'),
    transactionNumber: 'SO-2024-016',
    customerId: 'cust_2',
    customerName: 'Soy & Palm Trading',
    warehouseId: 'warehouse_2',
    branchId: 'branch_2',
    items: [
      {
        id: 'item_2',
        productId: 'prod_1',
        productName: 'Crude Palm Oil - Grade A',
        quantity: 18000,
        unitPrice: 3.50,
        lineTotal: 63000,
        cost: 50400,
        margin: 12600,
      },
      {
        id: 'item_3',
        productId: 'prod_3',
        productName: 'Palm Kernel Oil',
        quantity: 2000,
        unitPrice: 5.80,
        lineTotal: 11600,
        cost: 9200,
        margin: 2400,
      },
    ],
    totalQuantity: 20000,
    totalAmount: 74600,
    costOfGoods: 59600,
    grossMargin: 15000,
    marginPercentage: 20.11,
    status: 'submitted',
    approvalStatus: 'pending',
    createdBy: 'user_3',
  },
];

// Mock Accounts
export const mockAccounts: Account[] = [
  { id: 'acc_1', code: '1010', name: 'Cash & Bank Accounts', type: 'asset', balance: 250000, isControlAccount: true, status: 'active' },
  { id: 'acc_2', code: '1020', name: 'Inventory - CPO', type: 'asset', balance: 437500, isControlAccount: false, status: 'active' },
  { id: 'acc_3', code: '1030', name: 'Inventory - RPO', type: 'asset', balance: 367500, isControlAccount: false, status: 'active' },
  { id: 'acc_4', code: '1040', name: 'Inventory - PKO', type: 'asset', balance: 261000, isControlAccount: false, status: 'active' },
  { id: 'acc_5', code: '2010', name: 'Accounts Payable', type: 'liability', balance: 180000, isControlAccount: true, status: 'active' },
  { id: 'acc_6', code: '3010', name: 'Retained Earnings', type: 'equity', balance: 1000000, isControlAccount: false, status: 'active' },
  { id: 'acc_7', code: '4010', name: 'Sales Revenue', type: 'revenue', balance: -324900, isControlAccount: false, status: 'active' },
  { id: 'acc_8', code: '5010', name: 'Cost of Goods Sold', type: 'expense', balance: 259600, isControlAccount: false, status: 'active' },
  { id: 'acc_9', code: '5020', name: 'Freight & Logistics', type: 'expense', balance: 45000, isControlAccount: false, status: 'active' },
  { id: 'acc_10', code: '5030', name: 'Salaries & Wages', type: 'expense', balance: 120000, isControlAccount: false, status: 'active' },
];

// Mock Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'je_1',
    date: new Date('2024-03-26'),
    journalNumber: 'JE-2024-001',
    description: 'Sales transaction SO-2024-015: Refined Palm Oil to Indo Biodiesel Corp',
    lines: [
      { id: 'jl_1', accountId: 'acc_1', accountCode: '1010', accountName: 'Cash & Bank Accounts', debit: 50400, credit: 0, description: 'Cash received' },
      { id: 'jl_2', accountId: 'acc_7', accountCode: '4010', accountName: 'Sales Revenue', debit: 0, credit: 50400, description: 'Sales revenue' },
      { id: 'jl_3', accountId: 'acc_8', accountCode: '5010', accountName: 'Cost of Goods Sold', debit: 40800, credit: 0, description: 'COGS' },
      { id: 'jl_4', accountId: 'acc_3', accountCode: '1030', accountName: 'Inventory - RPO', debit: 0, credit: 40800, description: 'Inventory reduction' },
    ],
    totalDebit: 91200,
    totalCredit: 91200,
    status: 'posted',
    approvalStatus: 'approved',
    sourceDocument: 'SO-2024-015',
    createdBy: 'user_4',
    approvedBy: 'user_1',
    postedBy: 'user_4',
    createdAt: new Date('2024-03-26'),
    approvalDate: new Date('2024-03-26'),
    postingDate: new Date('2024-03-26'),
  },
];

// Mock General Ledger
export const mockGeneralLedger: GeneralLedger[] = [
  {
    id: 'gl_1',
    accountId: 'acc_1',
    date: new Date('2024-03-26'),
    journalNumber: 'JE-2024-001',
    description: 'Cash received from SO-2024-015',
    debit: 50400,
    credit: 0,
    balance: 250000,
    reference: 'SO-2024-015',
  },
];

// Mock Trial Balance
export const mockTrialBalance: TrialBalance[] = [
  { accountId: 'acc_1', accountCode: '1010', accountName: 'Cash & Bank Accounts', accountType: 'asset', debit: 250000, credit: 0, balance: 250000 },
  { accountId: 'acc_2', accountCode: '1020', accountName: 'Inventory - CPO', accountType: 'asset', debit: 437500, credit: 0, balance: 437500 },
  { accountId: 'acc_3', accountCode: '1030', accountName: 'Inventory - RPO', accountType: 'asset', debit: 367500, credit: 0, balance: 367500 },
  { accountId: 'acc_4', accountCode: '1040', accountName: 'Inventory - PKO', accountType: 'asset', debit: 261000, credit: 0, balance: 261000 },
  { accountId: 'acc_5', accountCode: '2010', accountName: 'Accounts Payable', accountType: 'liability', debit: 0, credit: 180000, balance: -180000 },
  { accountId: 'acc_6', accountCode: '3010', accountName: 'Retained Earnings', accountType: 'equity', debit: 0, credit: 1000000, balance: -1000000 },
  { accountId: 'acc_7', accountCode: '4010', accountName: 'Sales Revenue', accountType: 'revenue', debit: 0, credit: 324900, balance: -324900 },
  { accountId: 'acc_8', accountCode: '5010', accountName: 'Cost of Goods Sold', accountType: 'expense', debit: 259600, credit: 0, balance: 259600 },
  { accountId: 'acc_9', accountCode: '5020', accountName: 'Freight & Logistics', accountType: 'expense', debit: 45000, credit: 0, balance: 45000 },
  { accountId: 'acc_10', accountCode: '5030', accountName: 'Salaries & Wages', accountType: 'expense', debit: 120000, credit: 0, balance: 120000 },
];

// Mock Reconciliation Records
export const mockReconciliationRecords: ReconciliationRecord[] = [
  {
    id: 'rec_1',
    date: new Date('2024-03-28'),
    warehouseId: 'warehouse_1',
    productId: 'prod_1',
    expectedQuantity: 125000,
    actualQuantity: 124850,
    variance: -150,
    variancePercentage: -0.12,
    varianceValue: -525,
    status: 'investigation',
    notes: 'Minor shortage detected during physical count - under investigation',
  },
  {
    id: 'rec_2',
    date: new Date('2024-03-28'),
    warehouseId: 'warehouse_2',
    productId: 'prod_3',
    expectedQuantity: 45000,
    actualQuantity: 45000,
    variance: 0,
    variancePercentage: 0,
    varianceValue: 0,
    status: 'reconciled',
    reconciledBy: 'user_2',
    reconciliationDate: new Date('2024-03-28'),
  },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    timestamp: new Date('2024-03-26T10:30:00'),
    userId: 'user_3',
    userEmail: 'mike@palmcorp.com',
    action: 'CREATE',
    entityType: 'SalesTransaction',
    entityId: 'sales_1',
    changes: [
      { field: 'status', oldValue: null, newValue: 'draft' },
      { field: 'totalAmount', oldValue: null, newValue: 50400 },
    ],
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit_2',
    timestamp: new Date('2024-03-26T11:15:00'),
    userId: 'user_1',
    userEmail: 'john@palmcorp.com',
    action: 'APPROVE',
    entityType: 'SalesTransaction',
    entityId: 'sales_1',
    changes: [{ field: 'status', oldValue: 'submitted', newValue: 'approved' }],
    ipAddress: '192.168.1.101',
  },
];

// Mock Stock Ledger
export const mockStockLedger: StockLedger[] = [
  {
    id: 'sl_1',
    productId: 'prod_1',
    warehouseId: 'warehouse_1',
    date: new Date('2024-03-25'),
    movementType: 'purchase',
    quantity: 50000,
    unitCost: 2.80,
    totalCost: 140000,
    balance: 125000,
    reference: 'PO-2024-001',
  },
];

// Mock Operational Metrics
export const mockOperationalMetrics: OperationalMetrics = {
  date: new Date('2024-03-28'),
  totalStockQuantity: 257500,
  totalStockValue: 1325000,
  totalSalesQuantity: 32000,
  totalSalesAmount: 125000,
  costOfGoods: 100400,
  grossMargin: 24600,
  marginPercentage: 19.68,
  stockTuroverRate: 0.15,
};

// Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  totalStock: {
    quantity: 257500,
    value: 1325000,
    trend: 5.2,
  },
  totalSales: {
    amount: 125000,
    quantity: 32000,
    transactions: 2,
    trend: 12.8,
  },
  pendingApprovals: 3,
  reconciliationVariance: {
    amount: -525,
    percentage: -0.12,
  },
  topProducts: mockProducts.slice(0, 3),
  recentTransactions: mockStockMovements.slice(0, 3),
};

// Utility function to get mock data
export function getMockDataByType<T>(type: string): T[] {
  const dataMap: Record<string, any> = {
    users: mockUsers,
    warehouses: mockWarehouses,
    branches: mockBranches,
    products: mockProducts,
    stockMovements: mockStockMovements,
    salesTransactions: mockSalesTransactions,
    accounts: mockAccounts,
    journalEntries: mockJournalEntries,
    generalLedger: mockGeneralLedger,
    trialBalance: mockTrialBalance,
    reconciliationRecords: mockReconciliationRecords,
    auditLogs: mockAuditLogs,
    stockLedger: mockStockLedger,
  };
  return dataMap[type] || [];
}

// Utility function to search mock data
export function searchMockData<T extends { [key: string]: any }>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  const term = searchTerm.toLowerCase();
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    })
  );
}
