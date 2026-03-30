import { mockAccounts, mockBranches, mockProducts, mockWarehouses } from '@/lib/mock-data';
import {
  AccountingPolicyConfig,
  defaultAccountingPolicyConfig,
} from '@/lib/domain/policy-config';
import { defaultProjectProgress, ProjectProgress } from '@/lib/domain/project-tracker';

interface MasterDataState {
  warehouses: typeof mockWarehouses;
  branches: typeof mockBranches;
  products: typeof mockProducts;
  accounts: typeof mockAccounts;
}

interface InMemoryStore {
  initializedAt: string;
  policyConfig: AccountingPolicyConfig;
  projectProgress: ProjectProgress;
  masterData: MasterDataState;
}

function createStore(): InMemoryStore {
  return {
    initializedAt: new Date().toISOString(),
    policyConfig: defaultAccountingPolicyConfig,
    projectProgress: defaultProjectProgress,
    masterData: {
      warehouses: mockWarehouses,
      branches: mockBranches,
      products: mockProducts,
      accounts: mockAccounts,
    },
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __PALM_OIL_STORE__: InMemoryStore | undefined;
}

function getStore(): InMemoryStore {
  if (!globalThis.__PALM_OIL_STORE__) {
    globalThis.__PALM_OIL_STORE__ = createStore();
  }

  return globalThis.__PALM_OIL_STORE__;
}

export function getMasterData() {
  return getStore().masterData;
}

export function getPolicyConfig() {
  return getStore().policyConfig;
}

export function updatePolicyConfig(nextPolicy: AccountingPolicyConfig) {
  const store = getStore();
  store.policyConfig = {
    ...nextPolicy,
    version: store.policyConfig.version + 1,
    updatedAt: new Date().toISOString(),
  };

  return store.policyConfig;
}

export function getProjectProgress() {
  return getStore().projectProgress;
}
