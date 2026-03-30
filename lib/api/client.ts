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
  mockWarehouses,
} from '@/lib/mock-data';
import { JournalEntry, SalesTransaction, StockMovement } from '@/lib/types';

const API_BASE = '/api/v1';

interface MasterDataBundle {
  warehouses: typeof mockWarehouses;
  branches: typeof mockBranches;
  products: typeof mockProducts;
  accounts: typeof mockAccounts;
}

interface CEODashboardBundle {
  metrics: typeof mockDashboardMetrics;
  salesTransactions: SalesTransaction[];
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
