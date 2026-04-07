import { ApiEnvelope } from '@/lib/api/envelope';
import { ApiEnvelope } from '@/lib/api/envelope';
import { AccountingPolicyConfig } from '@/lib/domain/policy-config';
import { ProjectProgress } from '@/lib/domain/project-tracker';
import {
  mockAccounts,
  mockBranches,
  mockDashboardMetrics,
  mockJournalEntries,
  mockProducts,
  mockSalesTransactions,
  mockStockMovements,
  mockUsers,
  mockWarehouses,
  mockWorkers,
} from '@/lib/mock-data';
import { JournalEntry, Product, Role, SalesTransaction, StockMovement, TrialBalance, User, Worker } from '@/lib/types';

const API_BASE = '/api/v1';

interface MasterDataBundle {
  users: typeof mockUsers;
  workers: Worker[];
  warehouses: typeof mockWarehouses;
  branches: typeof mockBranches;
  products: typeof mockProducts;
  accounts: typeof mockAccounts;
}

interface CEODashboardBundle {
  metrics: typeof mockDashboardMetrics;
  salesTransactions: SalesTransaction[];
  analytics: DashboardAnalytics;
}

export interface DashboardAnalytics {
  salesTrend: Array<{ period: string; sales: number; quantity: number }>;
  revenueVsCogs: Array<{ period: string; revenue: number; cogs: number; grossProfit: number }>;
  stockByLocation: Array<{ category: string; warehouse: number; branch: number; inTransit: number }>;
  transferVariance: Array<{ route: string; sent: number; received: number; variance: number }>;
  leakageTrend: Array<{ period: string; quantityLost: number; valueLost: number }>;
  packagingEfficiency: Array<{ period: string; expected: number; actual: number; variance: number }>;
  productProfitability: Array<{
    product: string;
    revenue: number;
    cogs: number;
    margin: number;
    marginPct: number;
  }>;
  pnlBridge: Array<{ step: string; value: number }>;
  expenseBreakdown: Array<{ category: string; amount: number }>;
  assetBankTrend: Array<{ period: string; assets: number; bank: number }>;
}

export interface AdminCostSummary {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
}

export interface AssetRecord {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  acquiredDate: Date;
  acquisitionCost: number;
  usefulLifeYears: number;
  status: 'active' | 'inactive';
}

export interface TransferLineRecord {
  id: string;
  productId: string;
  quantitySent: number;
  quantityReceived: number;
  varianceQuantity: number;
  unitCost: number;
}

export interface TransferRecord {
  id: string;
  transferNumber: string;
  date: Date;
  fromWarehouseId: string;
  toBranchId: string;
  status: 'in_transit' | 'received' | 'variance';
  createdBy: string;
  lines: TransferLineRecord[];
}

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status?: 'active' | 'inactive';
}

export interface SuperAdminProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
}

async function fetchWithFallback<T>(path: string, fallbackData: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackData;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!payload.success || !payload.data) {
      return fallbackData;
    }

    return payload.data;
  } catch {
    return fallbackData;
  }
}

async function postJson<T>(path: string, payload: unknown, errorCode: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(errorCode);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error || errorCode);
  }

  return envelope.data;
}

function defaultDashboardAnalytics(): DashboardAnalytics {
  return {
    salesTrend: [],
    revenueVsCogs: [],
    stockByLocation: [],
    transferVariance: [],
    leakageTrend: [],
    packagingEfficiency: [],
    productProfitability: [],
    pnlBridge: [],
    expenseBreakdown: [],
    assetBankTrend: [],
  };
}

export async function getMasterData(): Promise<MasterDataBundle> {
  return fetchWithFallback('/meta/master-data', {
    users: mockUsers,
    workers: mockWorkers,
    warehouses: mockWarehouses,
    branches: mockBranches,
    products: mockProducts,
    accounts: mockAccounts,
  });
}

export async function getPolicyConfig(): Promise<AccountingPolicyConfig> {
  const fallback = {
    version: 1,
    pendingClientSignoff: true,
    updatedAt: new Date().toISOString(),
    valuationPolicies: [],
    returnDamagePolicy: {
      requiresApproval: true,
      approverRole: 'warehouse_manager' as const,
      defaultMethod: 'cost' as const,
      allowsManualOverride: false,
    },
    reconciliationPolicy: {
      isInstant: true,
      varianceTolerancePercent: 0.5,
      treatment: 'approval_then_adjust' as const,
      requiresAccountingJournalForAdjustments: true,
    },
    reportingPolicy: {
      statementFormat: 'ifrs_sme' as const,
      reportingCurrency: 'NGN' as const,
      accountingPeriod: 'monthly' as const,
      includeOCIInPnL: false,
    },
  };

  return fetchWithFallback('/meta/policy', fallback);
}

export async function getProjectProgress(): Promise<ProjectProgress> {
  const fallback: ProjectProgress = {
    lastUpdatedAt: new Date().toISOString(),
    phases: [],
  };

  return fetchWithFallback('/meta/progress', fallback);
}

export async function getCeoDashboardData(): Promise<CEODashboardBundle> {
  return fetchWithFallback('/dashboard/ceo', {
    metrics: mockDashboardMetrics,
    salesTransactions: mockSalesTransactions,
    analytics: defaultDashboardAnalytics(),
  });
}

export async function getPurchases(): Promise<StockMovement[]> {
  const fallback = mockStockMovements.filter((movement) => movement.type === 'purchase');
  return fetchWithFallback('/inventory/purchases', fallback);
}

export async function createPurchase(payload: {
  date?: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  referenceDocument?: string;
}): Promise<StockMovement> {
  return postJson('/inventory/purchases', payload, 'create_purchase_failed');
}

export async function getProducts(): Promise<Product[]> {
  return fetchWithFallback('/inventory/products', mockProducts);
}

export async function createProduct(payload: {
  name: string;
  sku: string;
  category: 'raw_oil' | 'packaging' | 'consumable' | 'finished_goods' | 'other';
  unit: 'litres' | 'drums' | 'tonnes' | 'bags';
  unitPrice: number;
  standardCost: number;
  reorderLevel: number;
  status?: 'active' | 'discontinued';
}): Promise<Product> {
  return postJson('/inventory/products', payload, 'create_product_failed');
}

export async function getProductionRecords(): Promise<StockMovement[]> {
  return fetchWithFallback('/inventory/production', []);
}

export async function createProduction(payload: {
  date?: string;
  warehouseId: string;
  outputProductId: string;
  outputQuantity: number;
  overheadCost?: number;
  referenceDocument?: string;
}): Promise<StockMovement> {
  return postJson('/inventory/production', payload, 'create_production_failed');
}

export async function getTransfers(): Promise<TransferRecord[]> {
  return fetchWithFallback('/inventory/transfers', []);
}

export async function createTransfer(payload: {
  date?: string;
  fromWarehouseId: string;
  toBranchId: string;
  notes?: string;
  lines: Array<{ productId: string; quantity: number; unitCost?: number }>;
}): Promise<TransferRecord> {
  return postJson('/inventory/transfers', payload, 'create_transfer_failed');
}

export async function receiveTransfer(payload: {
  transferId: string;
  lines: Array<{ lineId: string; quantityReceived: number }>;
}): Promise<TransferRecord> {
  return postJson('/inventory/transfers/receive', payload, 'receive_transfer_failed');
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return fetchWithFallback('/accounting/journals', mockJournalEntries);
}

export async function getTrialBalance(): Promise<TrialBalance[]> {
  return fetchWithFallback('/accounting/trial-balance', []);
}

export async function getSalesTransactions(): Promise<SalesTransaction[]> {
  return fetchWithFallback('/sales/transactions', mockSalesTransactions);
}

export async function createSalesTransaction(payload: {
  date?: string;
  customerName: string;
  warehouseId: string;
  branchId: string;
  status?: 'draft' | 'submitted' | 'approved' | 'posted';
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
}): Promise<SalesTransaction> {
  return postJson('/sales/transactions', payload, 'create_sales_failed');
}

export async function getAdminCostSummaries(): Promise<AdminCostSummary[]> {
  const fallback: AdminCostSummary[] = [
    { id: 'adm_salary', code: 'ADM-001', name: 'Salaries and Wages', totalAmount: 0 },
    { id: 'adm_paye', code: 'ADM-002', name: 'PAYE and Deductions', totalAmount: 0 },
    { id: 'adm_transport', code: 'ADM-003', name: 'Transportation', totalAmount: 0 },
    { id: 'adm_courier', code: 'ADM-004', name: 'Courier Services', totalAmount: 0 },
    { id: 'adm_loading', code: 'ADM-005', name: 'Loading/Offloading Costs', totalAmount: 0 },
    { id: 'adm_levies', code: 'ADM-006', name: 'Levies', totalAmount: 0 },
    { id: 'adm_registration', code: 'ADM-007', name: 'Registration', totalAmount: 0 },
    { id: 'adm_rent', code: 'ADM-008', name: 'Rent/Occupancy', totalAmount: 0 },
    { id: 'adm_consultancy', code: 'ADM-009', name: 'Consultancy Costs', totalAmount: 0 },
    { id: 'adm_legal', code: 'ADM-010', name: 'Legal Costs', totalAmount: 0 },
  ];

  return fetchWithFallback('/accounting/admin-costs', fallback);
}

export async function createAdminCost(payload: {
  date?: string;
  code: string;
  description: string;
  amount: number;
}): Promise<AdminCostSummary> {
  return postJson('/accounting/admin-costs', payload, 'create_admin_cost_failed');
}

export async function getAssets(): Promise<AssetRecord[]> {
  return fetchWithFallback('/accounting/assets', []);
}

export async function createAsset(payload: {
  assetCode: string;
  name: string;
  category: string;
  acquiredDate?: string;
  acquisitionCost: number;
  usefulLifeYears: number;
}): Promise<AssetRecord> {
  return postJson('/accounting/assets', payload, 'create_asset_failed');
}

export async function getWorkers(): Promise<Worker[]> {
  return fetchWithFallback('/settings/workers', mockWorkers);
}

type WorkerCreatePayload = Omit<Worker, 'id' | 'createdAt'>;

export async function createWorker(payload: WorkerCreatePayload): Promise<Worker> {
  try {
    const response = await fetch(`${API_BASE}/settings/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('request_failed');
    }

    const envelope = (await response.json()) as ApiEnvelope<Worker>;
    if (!envelope.success || !envelope.data) {
      throw new Error(envelope.error || 'create_worker_failed');
    }

    return envelope.data;
  } catch {
    const fallback: Worker = {
      ...payload,
      id: `worker_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    };
    return fallback;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const envelope = (await response.json()) as ApiEnvelope<CurrentUser>;
    if (!envelope.success || !envelope.data) {
      return null;
    }

    return envelope.data;
  } catch {
    return null;
  }
}

export async function login(identifier: string, password: string): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    throw new Error('invalid_credentials');
  }

  const envelope = (await response.json()) as ApiEnvelope<CurrentUser>;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error || 'invalid_credentials');
  }

  return envelope.data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
  });
}

export async function getUsers(): Promise<User[]> {
  return fetchWithFallback('/settings/users', mockUsers);
}

interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'worker';
  password: string;
  status?: 'active' | 'inactive';
  workerId?: string;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch(`${API_BASE}/settings/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('create_user_failed');
  }

  const envelope = (await response.json()) as ApiEnvelope<User>;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error || 'create_user_failed');
  }

  return envelope.data;
}

export async function getSuperAdminProfile(): Promise<SuperAdminProfile> {
  const response = await fetch(`${API_BASE}/settings/super-admin`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('fetch_super_admin_failed');
  }

  const envelope = (await response.json()) as ApiEnvelope<SuperAdminProfile>;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error || 'fetch_super_admin_failed');
  }

  return envelope.data;
}

export async function updateSuperAdminProfile(payload: {
  name: string;
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<SuperAdminProfile> {
  const response = await fetch(`${API_BASE}/settings/super-admin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('update_super_admin_failed');
  }

  const envelope = (await response.json()) as ApiEnvelope<SuperAdminProfile>;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error || 'update_super_admin_failed');
  }

  return envelope.data;
}
