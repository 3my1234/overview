import {
  mockAccounts,
  mockBranches,
  mockProducts,
  mockUsers,
  mockWarehouses,
  mockWorkers,
} from '@/lib/mock-data';
import {
  AccountingPolicyConfig,
  defaultAccountingPolicyConfig,
} from '@/lib/domain/policy-config';
import { defaultProjectProgress, ProjectProgress } from '@/lib/domain/project-tracker';
import { Role, User, Worker } from '@/lib/types';

interface MasterDataState {
  users: typeof mockUsers;
  workers: Worker[];
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
  credentials: Record<string, UserCredential>;
  sessions: Record<string, SessionRecord>;
}

interface UserCredential {
  userId: string;
  password: string;
  mustChangePassword: boolean;
  updatedAt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function seedCredentials(users: User[]): Record<string, UserCredential> {
  const byUsername: Record<string, string> = {
    'martin.obaze': 'Palm@123',
    'ops.admin': 'Admin@123',
    'sarah.johnson': 'Warehouse@123',
    'mike.chen': 'Sales@123',
    'emma.wilson': 'Finance@123',
    'david.kumar': 'Audit@123',
  };

  return users.reduce<Record<string, UserCredential>>((acc, user) => {
    acc[user.id] = {
      userId: user.id,
      password: byUsername[user.username] || 'ChangeMe@123',
      mustChangePassword: user.role !== 'super_admin',
      updatedAt: new Date().toISOString(),
    };
    return acc;
  }, {});
}

function createStore(): InMemoryStore {
  return {
    initializedAt: new Date().toISOString(),
    policyConfig: defaultAccountingPolicyConfig,
    projectProgress: defaultProjectProgress,
    masterData: {
      users: mockUsers,
      workers: mockWorkers,
      warehouses: mockWarehouses,
      branches: mockBranches,
      products: mockProducts,
      accounts: mockAccounts,
    },
    credentials: seedCredentials(mockUsers),
    sessions: {},
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

export function getUsers() {
  return getStore().masterData.users;
}

export function addUser(
  payload: Omit<User, 'id' | 'createdAt'>,
  password: string,
  options?: { mustChangePassword?: boolean }
) {
  const store = getStore();
  const user: User = {
    id: `user_${Date.now()}`,
    ...payload,
    createdAt: new Date(),
  };

  store.masterData.users = [user, ...store.masterData.users];
  store.credentials[user.id] = {
    userId: user.id,
    password,
    mustChangePassword: options?.mustChangePassword ?? true,
    updatedAt: new Date().toISOString(),
  };

  return user;
}

export function findUserByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  const users = getStore().masterData.users;
  return users.find(
    (user) =>
      user.username.toLowerCase() === normalized || user.email.toLowerCase() === normalized
  );
}

export function validateUserPassword(userId: string, password: string) {
  const credential = getStore().credentials[userId];
  return Boolean(credential && credential.password === password);
}

export function createSession(userId: string) {
  const store = getStore();
  const token = crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

  store.sessions[token] = {
    token,
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  return {
    token,
    expiresAt,
  };
}

export function getSessionUser(token?: string) {
  if (!token) return null;

  const store = getStore();
  const session = store.sessions[token];
  if (!session) return null;

  const hasExpired = new Date(session.expiresAt).getTime() < Date.now();
  if (hasExpired) {
    delete store.sessions[token];
    return null;
  }

  return store.masterData.users.find((user) => user.id === session.userId) || null;
}

export function deleteSession(token?: string) {
  if (!token) return;
  const store = getStore();
  delete store.sessions[token];
}

export function getBootstrapSuperAdmin() {
  return getStore().masterData.users.find((user) => user.role === 'super_admin') || null;
}

export function usernameExists(username: string) {
  const normalized = username.trim().toLowerCase();
  return getStore().masterData.users.some(
    (user) => user.username.toLowerCase() === normalized
  );
}

export function allowedCreatorToCreateRole(creatorRole: Role, targetRole: Role) {
  if (creatorRole === 'super_admin') {
    return targetRole === 'admin' || targetRole === 'worker';
  }

  if (creatorRole === 'admin') {
    return targetRole === 'worker';
  }

  return false;
}

export function getWorkers() {
  return getStore().masterData.workers;
}

export function addWorker(worker: Worker) {
  const store = getStore();
  store.masterData.workers = [worker, ...store.masterData.workers];
  return worker;
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
