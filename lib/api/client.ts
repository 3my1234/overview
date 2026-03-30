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
import { JournalEntry, Role, SalesTransaction, StockMovement, User, Worker } from '@/lib/types';

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
}

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status?: 'active' | 'inactive';
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
  });
}

export async function getPurchases(): Promise<StockMovement[]> {
  const fallback = mockStockMovements.filter((movement) => movement.type === 'purchase');
  return fetchWithFallback('/inventory/purchases', fallback);
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return fetchWithFallback('/accounting/journals', mockJournalEntries);
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
