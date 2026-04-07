
import { Pool } from 'pg';

import {
  Branch,
  DashboardMetrics,
  JournalEntry,
  JournalLine,
  Product,
  SalesLineItem,
  SalesTransaction,
  StockMovement,
  Warehouse,
} from '@/lib/types';
import {
  mockBranches,
  mockDashboardMetrics,
  mockJournalEntries,
  mockProducts,
  mockSalesTransactions,
  mockStockMovements,
  mockWarehouses,
} from '@/lib/mock-data';
import { TrialBalance } from '@/lib/types';

type ProductCategory = 'raw_oil' | 'packaging' | 'consumable' | 'finished_goods' | 'other';
type LocationType = 'warehouse' | 'branch' | 'in_transit';

interface CreateProductInput {
  name: string;
  sku: string;
  category: ProductCategory;
  unit: Product['unit'];
  unitPrice: number;
  standardCost: number;
  reorderLevel: number;
  status?: Product['status'];
}

interface CreatePurchaseInput {
  date?: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  referenceDocument?: string;
  actorUserId: string;
}

interface CreateProductionInput {
  date?: string;
  warehouseId: string;
  outputProductId: string;
  outputQuantity: number;
  overheadCost?: number;
  referenceDocument?: string;
  actorUserId: string;
}

interface CreateSalesInputItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

interface CreateSalesInput {
  date?: string;
  customerName: string;
  warehouseId: string;
  branchId: string;
  items: CreateSalesInputItem[];
  actorUserId: string;
  status?: SalesTransaction['status'];
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

interface CreateTransferInput {
  date?: string;
  fromWarehouseId: string;
  toBranchId: string;
  lines: Array<{ productId: string; quantity: number; unitCost?: number }>;
  notes?: string;
  actorUserId: string;
}

interface ReceiveTransferInput {
  transferId: string;
  lines: Array<{ lineId: string; quantityReceived: number }>;
  actorUserId: string;
}

export interface AdminCostSummary {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
}

interface CreateAdminCostInput {
  date?: string;
  code: string;
  description: string;
  amount: number;
  actorUserId: string;
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

interface CreateAssetInput {
  assetCode: string;
  name: string;
  category: string;
  acquiredDate?: string;
  acquisitionCost: number;
  usefulLifeYears: number;
  actorUserId: string;
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

interface MasterDataBundle {
  warehouses: Warehouse[];
  branches: Branch[];
  products: Product[];
}

interface BalanceRow {
  locationType: LocationType;
  locationId: string;
  productId: string;
  quantity: number;
  costValue: number;
}

type DbRow = Record<string, unknown>;

const SESSION_SAFE_DECIMALS = 6;

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function asString(value: unknown): string {
  return String(value ?? '');
}

function asNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return num;
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function round(value: number) {
  return Number(value.toFixed(SESSION_SAFE_DECIMALS));
}

const fallbackStore: {
  warehouses: Warehouse[];
  branches: Branch[];
  products: Array<Product & { category: ProductCategory }>;
  purchases: StockMovement[];
  sales: SalesTransaction[];
  production: StockMovement[];
  transfers: TransferRecord[];
  journals: JournalEntry[];
  balances: BalanceRow[];
  adminCostSummaries: AdminCostSummary[];
  assets: AssetRecord[];
} = {
  warehouses: [...mockWarehouses],
  branches: [...mockBranches],
  products: [
    ...mockProducts.map((item) => ({ ...item, category: 'raw_oil' as ProductCategory })),
    {
      id: 'prod_pkg_bottle_1l',
      name: 'Packaging Bottle 1L',
      sku: 'PKG-BTL-1L',
      category: 'packaging',
      unit: 'bags',
      unitPrice: 120,
      standardCost: 90,
      currentStock: 2000,
      reorderLevel: 400,
      status: 'active',
    },
    {
      id: 'prod_pkg_cap_1l',
      name: 'Packaging Cap 1L',
      sku: 'PKG-CAP-1L',
      category: 'packaging',
      unit: 'bags',
      unitPrice: 40,
      standardCost: 25,
      currentStock: 2200,
      reorderLevel: 500,
      status: 'active',
    },
    {
      id: 'prod_fg_1l',
      name: 'Bottled Palm Oil 1L',
      sku: 'FG-1L-001',
      category: 'finished_goods',
      unit: 'litres',
      unitPrice: 1800,
      standardCost: 950,
      currentStock: 3000,
      reorderLevel: 800,
      status: 'active',
    },
  ],
  purchases: mockStockMovements.filter((item) => item.type === 'purchase'),
  sales: [...mockSalesTransactions],
  production: [],
  transfers: [],
  journals: [...mockJournalEntries],
  balances: [],
  adminCostSummaries: [
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
  ],
  assets: [
    {
      id: 'asset_1',
      assetCode: 'PPE-001',
      name: 'Palm Oil Packaging Machine',
      category: 'machine',
      acquiredDate: new Date('2026-01-10'),
      acquisitionCost: 8500000,
      usefulLifeYears: 10,
      status: 'active',
    },
    {
      id: 'asset_2',
      assetCode: 'PPE-002',
      name: 'Factory Building Improvement',
      category: 'building',
      acquiredDate: new Date('2026-01-05'),
      acquisitionCost: 12000000,
      usefulLifeYears: 20,
      status: 'active',
    },
  ],
};

function getFallbackProduct(productId: string) {
  return fallbackStore.products.find((product) => product.id === productId) || null;
}

function getFallbackBalance(locationType: LocationType, locationId: string, productId: string) {
  let balance = fallbackStore.balances.find(
    (item) =>
      item.locationType === locationType && item.locationId === locationId && item.productId === productId
  );

  if (!balance) {
    balance = {
      locationType,
      locationId,
      productId,
      quantity: 0,
      costValue: 0,
    };
    fallbackStore.balances.push(balance);
  }

  return balance;
}

function seedFallbackBalancesOnce() {
  if (fallbackStore.balances.length > 0) return;

  for (const product of fallbackStore.products) {
    const mainWarehouse = getFallbackBalance('warehouse', 'warehouse_1', product.id);
    mainWarehouse.quantity = round(product.currentStock * 0.7);
    mainWarehouse.costValue = round(mainWarehouse.quantity * product.standardCost);

    const branchOne = getFallbackBalance('branch', 'branch_1', product.id);
    branchOne.quantity = round(product.currentStock * 0.3);
    branchOne.costValue = round(branchOne.quantity * product.standardCost);
  }
}

async function runMigrationsInternal() {
  const db = getPool();
  if (!db) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity NUMERIC(16,2) NOT NULL DEFAULT 0,
      manager TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      warehouse_id TEXT REFERENCES warehouses(id),
      manager TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'raw_oil',
      unit TEXT NOT NULL,
      unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
      standard_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
      reorder_level NUMERIC(14,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_balances (
      location_type TEXT NOT NULL,
      location_id TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity NUMERIC(16,4) NOT NULL DEFAULT 0,
      cost_value NUMERIC(18,4) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (location_type, location_id, product_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      txn_date TIMESTAMPTZ NOT NULL,
      txn_type TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity NUMERIC(16,4) NOT NULL,
      unit TEXT NOT NULL,
      warehouse_id TEXT REFERENCES warehouses(id),
      branch_id TEXT REFERENCES branches(id),
      reference_document TEXT NOT NULL,
      unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
      total_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'posted',
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sales_transactions (
      id TEXT PRIMARY KEY,
      sales_date TIMESTAMPTZ NOT NULL,
      transaction_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      warehouse_id TEXT REFERENCES warehouses(id),
      branch_id TEXT REFERENCES branches(id),
      total_quantity NUMERIC(16,4) NOT NULL,
      total_amount NUMERIC(18,4) NOT NULL,
      cost_of_goods NUMERIC(18,4) NOT NULL,
      gross_margin NUMERIC(18,4) NOT NULL,
      margin_percentage NUMERIC(10,4) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'posted',
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sales_line_items (
      id TEXT PRIMARY KEY,
      sales_transaction_id TEXT NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity NUMERIC(16,4) NOT NULL,
      unit_price NUMERIC(14,4) NOT NULL,
      line_total NUMERIC(18,4) NOT NULL,
      cost NUMERIC(18,4) NOT NULL,
      margin NUMERIC(18,4) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      entry_date TIMESTAMPTZ NOT NULL,
      journal_number TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      total_debit NUMERIC(18,4) NOT NULL,
      total_credit NUMERIC(18,4) NOT NULL,
      status TEXT NOT NULL DEFAULT 'posted',
      source_document TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL,
      debit NUMERIC(18,4) NOT NULL DEFAULT 0,
      credit NUMERIC(18,4) NOT NULL DEFAULT 0,
      description TEXT
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_expense_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_expenses (
      id TEXT PRIMARY KEY,
      expense_date TIMESTAMPTZ NOT NULL,
      code_id TEXT NOT NULL REFERENCES admin_expense_codes(id),
      description TEXT NOT NULL,
      amount NUMERIC(18,4) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'posted',
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      txn_date TIMESTAMPTZ NOT NULL,
      location_type TEXT NOT NULL,
      location_id TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity_delta NUMERIC(16,4) NOT NULL,
      cost_delta NUMERIC(18,4) NOT NULL,
      balance_quantity NUMERIC(16,4) NOT NULL,
      balance_cost NUMERIC(18,4) NOT NULL,
      reference_document TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      transfer_number TEXT NOT NULL UNIQUE,
      transfer_date TIMESTAMPTZ NOT NULL,
      from_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      to_branch_id TEXT NOT NULL REFERENCES branches(id),
      status TEXT NOT NULL DEFAULT 'in_transit',
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stock_transfer_lines (
      id TEXT PRIMARY KEY,
      transfer_id TEXT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity_sent NUMERIC(16,4) NOT NULL,
      quantity_received NUMERIC(16,4) NOT NULL DEFAULT 0,
      variance_quantity NUMERIC(16,4) NOT NULL DEFAULT 0,
      unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
      variance_value NUMERIC(18,4) NOT NULL DEFAULT 0
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bom_recipes (
      id TEXT PRIMARY KEY,
      output_product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      output_qty NUMERIC(16,4) NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bom_recipe_components (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES bom_recipes(id) ON DELETE CASCADE,
      component_product_id TEXT NOT NULL REFERENCES products(id),
      qty_per_output NUMERIC(16,6) NOT NULL,
      waste_factor_percent NUMERIC(8,4) NOT NULL DEFAULT 0
    );
  `);

  await db.query(
    `ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  );
  await db.query(
    `ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  );
  await db.query(
    `ALTER TABLE sales_line_items ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  );
  await db.query(
    `ALTER TABLE admin_expenses ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  );

  await db.query(`CREATE INDEX IF NOT EXISTS idx_inv_txn_product_date ON inventory_transactions (product_id, txn_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_inv_txn_warehouse_date ON inventory_transactions (warehouse_id, txn_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_inv_txn_branch_date ON inventory_transactions (branch_id, txn_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions (sales_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_balances_lookup ON inventory_balances (product_id, location_type, location_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_stock_ledger_lookup ON stock_ledger (product_id, location_type, location_id, txn_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_transfer_date ON stock_transfers (transfer_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_transfer_status ON stock_transfers (status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_transfer_line_product ON stock_transfer_lines (product_id)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      asset_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      acquired_date TIMESTAMPTZ NOT NULL,
      acquisition_cost NUMERIC(18,4) NOT NULL,
      useful_life_years NUMERIC(8,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const warehouseCount = await db.query(`SELECT COUNT(*)::int AS count FROM warehouses`);
  if (asNumber(warehouseCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO warehouses (id, name, location, capacity, manager, status) VALUES
      ('warehouse_1', 'Lagos Main Warehouse', 'Lagos', 500000, 'Warehouse Lead', 'active'),
      ('warehouse_2', 'Benin Warehouse', 'Benin City', 250000, 'Warehouse Lead', 'active'),
      ('warehouse_3', 'Asaba Warehouse', 'Asaba', 200000, 'Warehouse Lead', 'active');
    `);
  }

  const branchCount = await db.query(`SELECT COUNT(*)::int AS count FROM branches`);
  if (asNumber(branchCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO branches (id, name, location, warehouse_id, manager, status) VALUES
      ('branch_1', 'Ikeja Shop', 'Lagos', 'warehouse_1', 'Branch Manager', 'active'),
      ('branch_2', 'Benin Shop', 'Benin City', 'warehouse_2', 'Branch Manager', 'active'),
      ('branch_3', 'Asaba Shop', 'Asaba', 'warehouse_3', 'Branch Manager', 'active');
    `);
  }

  const productCount = await db.query(`SELECT COUNT(*)::int AS count FROM products`);
  if (asNumber(productCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO products (id, name, sku, category, unit, unit_price, standard_cost, reorder_level, status) VALUES
      ('prod_1', 'Crude Palm Oil - Grade A', 'CPO-GRA-001', 'raw_oil', 'litres', 1200, 800, 5000, 'active'),
      ('prod_2', 'Refined Palm Oil', 'RPO-STD-001', 'raw_oil', 'litres', 1400, 950, 3000, 'active'),
      ('prod_3', 'Palm Kernel Oil', 'PKO-NUT-001', 'raw_oil', 'litres', 1600, 1100, 2000, 'active'),
      ('prod_pkg_bottle_1l', 'Packaging Bottle 1L', 'PKG-BTL-1L', 'packaging', 'bags', 120, 90, 400, 'active'),
      ('prod_pkg_cap_1l', 'Packaging Cap 1L', 'PKG-CAP-1L', 'packaging', 'bags', 40, 25, 500, 'active'),
      ('prod_fg_1l', 'Bottled Palm Oil 1L', 'FG-1L-001', 'finished_goods', 'litres', 1800, 950, 800, 'active');
    `);
  }

  await db.query(`
    INSERT INTO products (id, name, sku, category, unit, unit_price, standard_cost, reorder_level, status)
    VALUES ('prod_fg_1l', 'Bottled Palm Oil 1L', 'FG-1L-001', 'finished_goods', 'litres', 1800, 950, 800, 'active')
    ON CONFLICT (id) DO NOTHING;
  `);

  const recipeCount = await db.query(`SELECT COUNT(*)::int AS count FROM bom_recipes WHERE output_product_id = 'prod_fg_1l'`);
  if (asNumber(recipeCount.rows[0]?.count) === 0) {
    const recipeId = 'bom_fg_1l';
    await db.query(
      `INSERT INTO bom_recipes (id, output_product_id, output_qty, is_active) VALUES ($1, 'prod_fg_1l', 1, TRUE)`,
      [recipeId]
    );
    await db.query(`
      INSERT INTO bom_recipe_components (id, recipe_id, component_product_id, qty_per_output, waste_factor_percent) VALUES
      ('bomc_fg_1l_oil', '${recipeId}', 'prod_1', 1, 0),
      ('bomc_fg_1l_bottle', '${recipeId}', 'prod_pkg_bottle_1l', 1, 0),
      ('bomc_fg_1l_cap', '${recipeId}', 'prod_pkg_cap_1l', 1, 0);
    `);
  }

  const codeCount = await db.query(`SELECT COUNT(*)::int AS count FROM admin_expense_codes`);
  if (asNumber(codeCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO admin_expense_codes (id, code, name, status) VALUES
      ('adm_salary', 'ADM-001', 'Salaries and Wages', 'active'),
      ('adm_paye', 'ADM-002', 'PAYE and Deductions', 'active'),
      ('adm_transport', 'ADM-003', 'Transportation', 'active'),
      ('adm_courier', 'ADM-004', 'Courier Services', 'active'),
      ('adm_loading', 'ADM-005', 'Loading and Offloading', 'active'),
      ('adm_levies', 'ADM-006', 'Levies', 'active'),
      ('adm_registration', 'ADM-007', 'Registration', 'active'),
      ('adm_rent', 'ADM-008', 'Rent/Occupancy', 'active'),
      ('adm_consultancy', 'ADM-009', 'Consultancy Costs', 'active'),
      ('adm_legal', 'ADM-010', 'Legal Costs', 'active');
    `);
  }

  const assetCount = await db.query(`SELECT COUNT(*)::int AS count FROM assets`);
  if (asNumber(assetCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO assets (id, asset_code, name, category, acquired_date, acquisition_cost, useful_life_years, status)
      VALUES
      ('asset_1', 'PPE-001', 'Palm Oil Packaging Machine', 'machine', '2026-01-10', 8500000, 10, 'active'),
      ('asset_2', 'PPE-002', 'Factory Building Improvement', 'building', '2026-01-05', 12000000, 20, 'active');
    `);
  }

  const balanceCount = await db.query(`SELECT COUNT(*)::int AS count FROM inventory_balances`);
  if (asNumber(balanceCount.rows[0]?.count) === 0) {
    await db.query(`
      INSERT INTO inventory_balances (location_type, location_id, product_id, quantity, cost_value) VALUES
      ('warehouse', 'warehouse_1', 'prod_1', 12000, 9600000),
      ('warehouse', 'warehouse_1', 'prod_2', 9000, 8550000),
      ('warehouse', 'warehouse_1', 'prod_3', 7000, 7700000),
      ('warehouse', 'warehouse_1', 'prod_pkg_bottle_1l', 2500, 225000),
      ('warehouse', 'warehouse_1', 'prod_pkg_cap_1l', 3000, 75000),
      ('warehouse', 'warehouse_1', 'prod_fg_1l', 3000, 2850000),
      ('branch', 'branch_1', 'prod_1', 2000, 1600000),
      ('branch', 'branch_1', 'prod_2', 1500, 1425000),
      ('branch', 'branch_1', 'prod_pkg_bottle_1l', 800, 72000),
      ('branch', 'branch_1', 'prod_pkg_cap_1l', 900, 22500),
      ('branch', 'branch_1', 'prod_fg_1l', 450, 427500);
    `);
  }
}

export async function ensureErpDatabaseReady() {
  if (!isDatabaseEnabled()) {
    seedFallbackBalancesOnce();
    return;
  }

  if (!initPromise) {
    initPromise = runMigrationsInternal();
  }

  await initPromise;
}

function mapWarehouse(row: DbRow): Warehouse {
  return {
    id: asString(row.id),
    name: asString(row.name),
    location: asString(row.location),
    capacity: asNumber(row.capacity),
    manager: asString(row.manager),
    status: (asString(row.status) as Warehouse['status']) || 'active',
  };
}

function mapBranch(row: DbRow): Branch {
  return {
    id: asString(row.id),
    name: asString(row.name),
    location: asString(row.location),
    warehouseId: asString(row.warehouse_id),
    manager: asString(row.manager),
    status: (asString(row.status) as Branch['status']) || 'active',
  };
}

function mapProduct(row: DbRow): Product {
  return {
    id: asString(row.id),
    name: asString(row.name),
    sku: asString(row.sku),
    unit: asString(row.unit) as Product['unit'],
    unitPrice: asNumber(row.unit_price),
    standardCost: asNumber(row.standard_cost),
    currentStock: asNumber(row.current_stock),
    reorderLevel: asNumber(row.reorder_level),
    status: (asString(row.status) as Product['status']) || 'active',
  };
}

function mapStockMovement(row: DbRow): StockMovement {
  return {
    id: asString(row.id),
    date: asDate(row.txn_date),
    type: asString(row.txn_type) as StockMovement['type'],
    productId: asString(row.product_id),
    quantity: asNumber(row.quantity),
    unit: asString(row.unit),
    warehouseId: asString(row.warehouse_id),
    branchId: row.branch_id ? asString(row.branch_id) : undefined,
    referenceDocument: asString(row.reference_document),
    cost: asNumber(row.total_cost),
    status: (asString(row.status) as StockMovement['status']) || 'posted',
    createdBy: asString(row.created_by || 'system'),
    approvalDate: undefined,
    approvedBy: undefined,
  };
}

function mapJournalLine(row: DbRow): JournalLine {
  return {
    id: asString(row.id),
    accountId: asString(row.account_code),
    accountCode: asString(row.account_code),
    accountName: asString(row.account_name),
    debit: asNumber(row.debit),
    credit: asNumber(row.credit),
    description: asString(row.description),
  };
}

function mapSalesLine(row: DbRow): SalesLineItem {
  return {
    id: asString(row.id),
    productId: asString(row.product_id),
    productName: asString(row.product_name),
    quantity: asNumber(row.quantity),
    unitPrice: asNumber(row.unit_price),
    lineTotal: asNumber(row.line_total),
    cost: asNumber(row.cost),
    margin: asNumber(row.margin),
  };
}

function buildJournalEntryFromRows(headerRow: DbRow, lineRows: DbRow[]): JournalEntry {
  return {
    id: asString(headerRow.id),
    date: asDate(headerRow.entry_date),
    journalNumber: asString(headerRow.journal_number),
    description: asString(headerRow.description),
    lines: lineRows.map(mapJournalLine),
    totalDebit: asNumber(headerRow.total_debit),
    totalCredit: asNumber(headerRow.total_credit),
    status: asString(headerRow.status) as JournalEntry['status'],
    sourceDocument: asString(headerRow.source_document),
    createdBy: asString(headerRow.created_by || 'system'),
    createdAt: asDate(headerRow.created_at),
  };
}
async function upsertBalance(
  db: Pool,
  locationType: LocationType,
  locationId: string,
  productId: string,
  quantityDelta: number,
  costDelta: number
) {
  await db.query(
    `
      INSERT INTO inventory_balances (location_type, location_id, product_id, quantity, cost_value, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (location_type, location_id, product_id)
      DO UPDATE SET
        quantity = inventory_balances.quantity + EXCLUDED.quantity,
        cost_value = inventory_balances.cost_value + EXCLUDED.cost_value,
        updated_at = NOW();
    `,
    [locationType, locationId, productId, quantityDelta, costDelta]
  );
}

async function getBalance(
  db: Pool,
  locationType: LocationType,
  locationId: string,
  productId: string
): Promise<BalanceRow> {
  const result = await db.query(
    `
      SELECT location_type, location_id, product_id, quantity, cost_value
      FROM inventory_balances
      WHERE location_type = $1 AND location_id = $2 AND product_id = $3
      LIMIT 1
    `,
    [locationType, locationId, productId]
  );

  if (!result.rowCount) {
    return {
      locationType,
      locationId,
      productId,
      quantity: 0,
      costValue: 0,
    };
  }

  const row = result.rows[0] as DbRow;
  return {
    locationType,
    locationId,
    productId,
    quantity: asNumber(row.quantity),
    costValue: asNumber(row.cost_value),
  };
}

async function writeStockLedgerEntry(
  db: Pool,
  input: {
    transactionId: string;
    txnDate: Date;
    locationType: LocationType;
    locationId: string;
    productId: string;
    quantityDelta: number;
    costDelta: number;
    referenceDocument: string;
    metadata?: Record<string, unknown>;
  }
) {
  const balance = await getBalance(db, input.locationType, input.locationId, input.productId);

  await db.query(
    `
      INSERT INTO stock_ledger (
        id, transaction_id, txn_date, location_type, location_id, product_id,
        quantity_delta, cost_delta, balance_quantity, balance_cost, reference_document, metadata, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12::jsonb, NOW()
      )
    `,
    [
      `sld_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      input.transactionId,
      input.txnDate.toISOString(),
      input.locationType,
      input.locationId,
      input.productId,
      round(input.quantityDelta),
      round(input.costDelta),
      round(balance.quantity),
      round(balance.costValue),
      input.referenceDocument,
      JSON.stringify(input.metadata || {}),
    ]
  );
}

async function postJournal(
  db: Pool,
  input: {
    date: Date;
    number: string;
    description: string;
    sourceDocument: string;
    createdBy: string;
    lines: Array<{ accountCode: string; accountName: string; debit: number; credit: number; description: string }>;
  }
) {
  const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);

  const journalId = `jr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.query(
    `
      INSERT INTO journal_entries (
        id, entry_date, journal_number, description, total_debit, total_credit,
        status, source_document, created_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'posted', $7, $8, NOW())
    `,
    [
      journalId,
      input.date.toISOString(),
      input.number,
      input.description,
      round(totalDebit),
      round(totalCredit),
      input.sourceDocument,
      input.createdBy,
    ]
  );

  for (const line of input.lines) {
    await db.query(
      `
        INSERT INTO journal_lines (id, journal_entry_id, account_code, account_name, debit, credit, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        `jrl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        journalId,
        line.accountCode,
        line.accountName,
        round(line.debit),
        round(line.credit),
        line.description,
      ]
    );
  }
}

export async function getMasterDataBundle(): Promise<MasterDataBundle> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return {
      warehouses: fallbackStore.warehouses,
      branches: fallbackStore.branches,
      products: fallbackStore.products,
    };
  }

  const db = getPool();
  if (!db) {
    return {
      warehouses: [],
      branches: [],
      products: [],
    };
  }

  const [warehouseResult, branchResult, productResult] = await Promise.all([
    db.query(`SELECT * FROM warehouses ORDER BY name`),
    db.query(`SELECT * FROM branches ORDER BY name`),
    db.query(`
      SELECT p.*, COALESCE(SUM(b.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN inventory_balances b ON b.product_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `),
  ]);

  return {
    warehouses: warehouseResult.rows.map((row) => mapWarehouse(row as DbRow)),
    branches: branchResult.rows.map((row) => mapBranch(row as DbRow)),
    products: productResult.rows.map((row) => mapProduct(row as DbRow)),
  };
}

export async function listProducts(): Promise<Product[]> {
  const data = await getMasterDataBundle();
  return data.products;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const product: Product & { category: ProductCategory } = {
      id: `prod_${Date.now()}`,
      name: input.name,
      sku: input.sku,
      unit: input.unit,
      unitPrice: input.unitPrice,
      standardCost: input.standardCost,
      currentStock: 0,
      reorderLevel: input.reorderLevel,
      status: input.status || 'active',
      category: input.category,
    };

    fallbackStore.products = [product, ...fallbackStore.products];
    return product;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const id = `prod_${Date.now()}`;

  await db.query(
    `
      INSERT INTO products (id, name, sku, category, unit, unit_price, standard_cost, reorder_level, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      id,
      input.name,
      input.sku,
      input.category,
      input.unit,
      input.unitPrice,
      input.standardCost,
      input.reorderLevel,
      input.status || 'active',
    ]
  );

  const result = await db.query(
    `
      SELECT p.*, COALESCE(SUM(b.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN inventory_balances b ON b.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `,
    [id]
  );

  return mapProduct(result.rows[0] as DbRow);
}

export async function listPurchases(): Promise<StockMovement[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.purchases;
  }

  const db = getPool();
  if (!db) return [];

  const result = await db.query(`
    SELECT * FROM inventory_transactions
    WHERE txn_type = 'purchase'
    ORDER BY txn_date DESC
  `);

  return result.rows.map((row) => mapStockMovement(row as DbRow));
}

export async function createPurchase(input: CreatePurchaseInput): Promise<StockMovement> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const product = getFallbackProduct(input.productId);
    if (!product) throw new Error('product_not_found');

    const unitCost = round(input.unitCost);
    const totalCost = round(input.quantity * unitCost);
    const txnDate = input.date ? new Date(input.date) : new Date();

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      date: txnDate,
      type: 'purchase',
      productId: input.productId,
      quantity: input.quantity,
      unit: product.unit,
      warehouseId: input.warehouseId,
      referenceDocument: input.referenceDocument || `PO-${Date.now()}`,
      cost: totalCost,
      status: 'posted',
      createdBy: input.actorUserId,
    };

    fallbackStore.purchases = [movement, ...fallbackStore.purchases];
    const warehouseBalance = getFallbackBalance('warehouse', input.warehouseId, input.productId);
    warehouseBalance.quantity = round(warehouseBalance.quantity + input.quantity);
    warehouseBalance.costValue = round(warehouseBalance.costValue + totalCost);

    const targetProduct = getFallbackProduct(input.productId);
    if (targetProduct) {
      targetProduct.currentStock = round(targetProduct.currentStock + input.quantity);
      targetProduct.standardCost = unitCost;
    }

    return movement;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const productResult = await db.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [input.productId]);
  if (!productResult.rowCount) {
    throw new Error('product_not_found');
  }

  const productRow = productResult.rows[0] as DbRow;
  const txnDate = input.date ? new Date(input.date) : new Date();
  const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const reference = input.referenceDocument || `PO-${Date.now()}`;
  const unitCost = round(input.unitCost);
  const totalCost = round(input.quantity * unitCost);

  await db.query('BEGIN');

  try {
    await db.query(
      `
        INSERT INTO inventory_transactions (
          id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
          reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
        )
        VALUES ($1, $2, 'purchase', $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, 'posted', $11, NOW())
      `,
      [
        movementId,
        txnDate.toISOString(),
        input.productId,
        input.quantity,
        asString(productRow.unit),
        input.warehouseId,
        reference,
        unitCost,
        totalCost,
        JSON.stringify({ flow: 'purchase_receipt' }),
        input.actorUserId,
      ]
    );

    await upsertBalance(db, 'warehouse', input.warehouseId, input.productId, input.quantity, totalCost);
    await writeStockLedgerEntry(db, {
      transactionId: movementId,
      txnDate,
      locationType: 'warehouse',
      locationId: input.warehouseId,
      productId: input.productId,
      quantityDelta: input.quantity,
      costDelta: totalCost,
      referenceDocument: reference,
      metadata: { flow: 'purchase_receipt' },
    });

    await postJournal(db, {
      date: txnDate,
      number: `JE-PUR-${Date.now()}`,
      description: `Purchase ${reference}`,
      sourceDocument: reference,
      createdBy: input.actorUserId,
      lines: [
        {
          accountCode: '1020',
          accountName: 'Inventory',
          debit: totalCost,
          credit: 0,
          description: `Inventory purchase ${reference}`,
        },
        {
          accountCode: '2010',
          accountName: 'Accounts Payable',
          debit: 0,
          credit: totalCost,
          description: `Supplier payable ${reference}`,
        },
      ],
    });

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const result = await db.query(`SELECT * FROM inventory_transactions WHERE id = $1 LIMIT 1`, [movementId]);
  return mapStockMovement(result.rows[0] as DbRow);
}
export async function listSalesTransactions(): Promise<SalesTransaction[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.sales;
  }

  const db = getPool();
  if (!db) return [];

  const headerResult = await db.query(`
    SELECT *
    FROM sales_transactions
    ORDER BY sales_date DESC
  `);

  if (!headerResult.rowCount) return [];

  const salesIds = headerResult.rows.map((row) => asString((row as DbRow).id));
  const lineResult = await db.query(
    `
      SELECT *
      FROM sales_line_items
      WHERE sales_transaction_id = ANY($1::text[])
      ORDER BY sales_transaction_id, id
    `,
    [salesIds]
  );

  const linesBySalesId = new Map<string, SalesLineItem[]>();
  for (const line of lineResult.rows) {
    const lineRow = line as DbRow;
    const salesId = asString(lineRow.sales_transaction_id);
    const existing = linesBySalesId.get(salesId) || [];
    existing.push(mapSalesLine(lineRow));
    linesBySalesId.set(salesId, existing);
  }

  return headerResult.rows.map((headerRaw) => {
    const header = headerRaw as DbRow;
    const salesId = asString(header.id);
    const items = linesBySalesId.get(salesId) || [];

    return {
      id: salesId,
      date: asDate(header.sales_date),
      transactionNumber: asString(header.transaction_number),
      customerId: `cust_${salesId}`,
      customerName: asString(header.customer_name),
      warehouseId: asString(header.warehouse_id),
      branchId: asString(header.branch_id),
      items,
      totalQuantity: asNumber(header.total_quantity),
      totalAmount: asNumber(header.total_amount),
      costOfGoods: asNumber(header.cost_of_goods),
      grossMargin: asNumber(header.gross_margin),
      marginPercentage: asNumber(header.margin_percentage),
      status: asString(header.status) as SalesTransaction['status'],
      createdBy: asString(header.created_by || 'system'),
      createdAt: asDate(header.created_at),
    } as SalesTransaction;
  });
}

export async function createSalesTransaction(input: CreateSalesInput): Promise<SalesTransaction> {
  await ensureErpDatabaseReady();

  if (input.items.length === 0) {
    throw new Error('at_least_one_item_required');
  }

  if (!isDatabaseEnabled()) {
    seedFallbackBalancesOnce();

    const items: SalesLineItem[] = [];
    let totalAmount = 0;
    let totalCost = 0;
    let totalQuantity = 0;

    for (const item of input.items) {
      const product = getFallbackProduct(item.productId);
      if (!product) throw new Error('product_not_found');

      const balance = getFallbackBalance('branch', input.branchId, item.productId);
      if (balance.quantity < item.quantity) {
        throw new Error(`insufficient_stock:${product.name}`);
      }

      const avgCost = balance.quantity > 0 ? balance.costValue / balance.quantity : product.standardCost;
      const unitPrice = item.unitPrice ?? product.unitPrice;
      const lineTotal = round(item.quantity * unitPrice);
      const lineCost = round(item.quantity * avgCost);

      balance.quantity = round(balance.quantity - item.quantity);
      balance.costValue = round(balance.costValue - lineCost);

      items.push({
        id: `sli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        cost: lineCost,
        margin: round(lineTotal - lineCost),
      });

      totalAmount += lineTotal;
      totalCost += lineCost;
      totalQuantity += item.quantity;
    }

    const transaction: SalesTransaction = {
      id: `sale_${Date.now()}`,
      date: input.date ? new Date(input.date) : new Date(),
      transactionNumber: `SO-${Date.now()}`,
      customerId: `cust_${Date.now()}`,
      customerName: input.customerName,
      warehouseId: input.warehouseId,
      branchId: input.branchId,
      items,
      totalQuantity: round(totalQuantity),
      totalAmount: round(totalAmount),
      costOfGoods: round(totalCost),
      grossMargin: round(totalAmount - totalCost),
      marginPercentage: totalAmount > 0 ? round(((totalAmount - totalCost) / totalAmount) * 100) : 0,
      status: input.status || 'posted',
      createdBy: input.actorUserId,
    };

    fallbackStore.sales = [transaction, ...fallbackStore.sales];
    return transaction;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const salesId = `sale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const transactionNumber = `SO-${Date.now()}`;
  const salesDate = input.date ? new Date(input.date) : new Date();

  await db.query('BEGIN');

  try {
    const lineItems: SalesLineItem[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalCost = 0;

    for (const item of input.items) {
      const productResult = await db.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [item.productId]);
      if (!productResult.rowCount) {
        throw new Error('product_not_found');
      }

      const productRow = productResult.rows[0] as DbRow;
      const balance = await getBalance(db, 'branch', input.branchId, item.productId);
      if (balance.quantity < item.quantity) {
        throw new Error(`insufficient_stock:${asString(productRow.name)}`);
      }

      const avgCost = balance.quantity > 0 ? balance.costValue / balance.quantity : asNumber(productRow.standard_cost);
      const unitPrice = item.unitPrice ?? asNumber(productRow.unit_price);

      const lineTotal = round(item.quantity * unitPrice);
      const lineCost = round(item.quantity * avgCost);
      const lineMargin = round(lineTotal - lineCost);

      await upsertBalance(db, 'branch', input.branchId, item.productId, -item.quantity, -lineCost);

      const movementId = `mov_sale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.query(
        `
        INSERT INTO inventory_transactions (
          id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
          reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
        )
        VALUES ($1, $2, 'sale', $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, 'posted', $12, NOW())
      `,
      [
        movementId,
        salesDate.toISOString(),
        item.productId,
        item.quantity,
          asString(productRow.unit),
          input.warehouseId,
          input.branchId,
        transactionNumber,
        avgCost,
        lineCost,
        JSON.stringify({ flow: 'branch_sale' }),
        input.actorUserId,
      ]
    );
      await writeStockLedgerEntry(db, {
        transactionId: movementId,
        txnDate: salesDate,
        locationType: 'branch',
        locationId: input.branchId,
        productId: item.productId,
        quantityDelta: -item.quantity,
        costDelta: -lineCost,
        referenceDocument: transactionNumber,
        metadata: { flow: 'branch_sale' },
      });

      const lineItem: SalesLineItem = {
        id: `sli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: item.productId,
        productName: asString(productRow.name),
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        cost: lineCost,
        margin: lineMargin,
      };

      lineItems.push(lineItem);
      totalQuantity += item.quantity;
      totalAmount += lineTotal;
      totalCost += lineCost;
    }

    const grossMargin = round(totalAmount - totalCost);
    const marginPercentage = totalAmount > 0 ? round((grossMargin / totalAmount) * 100) : 0;

    await db.query(
      `
        INSERT INTO sales_transactions (
          id, sales_date, transaction_number, customer_name, warehouse_id, branch_id,
          total_quantity, total_amount, cost_of_goods, gross_margin, margin_percentage,
          metadata, status, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, NOW())
      `,
      [
        salesId,
        salesDate.toISOString(),
        transactionNumber,
        input.customerName,
        input.warehouseId,
        input.branchId,
        round(totalQuantity),
        round(totalAmount),
        round(totalCost),
        grossMargin,
        marginPercentage,
        JSON.stringify({ flow: 'branch_sale' }),
        input.status || 'posted',
        input.actorUserId,
      ]
    );

    for (const lineItem of lineItems) {
      await db.query(
        `
          INSERT INTO sales_line_items (
            id, sales_transaction_id, product_id, product_name, quantity,
            unit_price, line_total, cost, margin, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        `,
        [
          lineItem.id,
          salesId,
          lineItem.productId,
          lineItem.productName,
          lineItem.quantity,
          lineItem.unitPrice,
          lineItem.lineTotal,
          lineItem.cost,
          lineItem.margin,
          JSON.stringify({}),
        ]
      );
    }

    await postJournal(db, {
      date: salesDate,
      number: `JE-SAL-${Date.now()}`,
      description: `Sales posting ${transactionNumber}`,
      sourceDocument: transactionNumber,
      createdBy: input.actorUserId,
      lines: [
        {
          accountCode: '1010',
          accountName: 'Cash and Bank',
          debit: totalAmount,
          credit: 0,
          description: `Sales receipt ${transactionNumber}`,
        },
        {
          accountCode: '4010',
          accountName: 'Sales Revenue',
          debit: 0,
          credit: totalAmount,
          description: `Sales revenue ${transactionNumber}`,
        },
        {
          accountCode: '5020',
          accountName: 'Cost of Goods Sold',
          debit: totalCost,
          credit: 0,
          description: `COGS ${transactionNumber}`,
        },
        {
          accountCode: '1020',
          accountName: 'Inventory',
          debit: 0,
          credit: totalCost,
          description: `Inventory release ${transactionNumber}`,
        },
      ],
    });

    await db.query('COMMIT');

    return {
      id: salesId,
      date: salesDate,
      transactionNumber,
      customerId: `cust_${salesId}`,
      customerName: input.customerName,
      warehouseId: input.warehouseId,
      branchId: input.branchId,
      items: lineItems,
      totalQuantity: round(totalQuantity),
      totalAmount: round(totalAmount),
      costOfGoods: round(totalCost),
      grossMargin,
      marginPercentage,
      status: (input.status || 'posted') as SalesTransaction['status'],
      createdBy: input.actorUserId,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

function fallbackBomForOutput(outputProductId: string) {
  if (outputProductId !== 'prod_fg_1l') return [];
  return [
    { productId: 'prod_1', qtyPerOutput: 1, wasteFactorPercent: 0 },
    { productId: 'prod_pkg_bottle_1l', qtyPerOutput: 1, wasteFactorPercent: 0 },
    { productId: 'prod_pkg_cap_1l', qtyPerOutput: 1, wasteFactorPercent: 0 },
  ];
}

export async function listProductionRecords(): Promise<StockMovement[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.production;
  }

  const db = getPool();
  if (!db) return [];

  const result = await db.query(`
    SELECT * FROM inventory_transactions
    WHERE txn_type = 'production'
    ORDER BY txn_date DESC
  `);

  return result.rows.map((row) => mapStockMovement(row as DbRow));
}

export async function createProduction(input: CreateProductionInput): Promise<StockMovement> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const outputProduct = getFallbackProduct(input.outputProductId);
    if (!outputProduct) throw new Error('output_product_not_found');

    const components = fallbackBomForOutput(input.outputProductId);
    if (components.length === 0) throw new Error('bom_not_configured');

    let componentCost = 0;
    for (const component of components) {
      const product = getFallbackProduct(component.productId);
      if (!product) throw new Error('component_not_found');
      const requiredQty = input.outputQuantity * component.qtyPerOutput;
      const balance = getFallbackBalance('warehouse', input.warehouseId, component.productId);
      if (balance.quantity < requiredQty) {
        throw new Error(`insufficient_component:${product.name}`);
      }
      const avgCost = balance.quantity > 0 ? balance.costValue / balance.quantity : product.standardCost;
      const cost = requiredQty * avgCost;
      balance.quantity = round(balance.quantity - requiredQty);
      balance.costValue = round(balance.costValue - cost);
      componentCost += cost;
    }

    const overhead = input.overheadCost || 0;
    const totalCost = round(componentCost + overhead);
    const outputBalance = getFallbackBalance('warehouse', input.warehouseId, input.outputProductId);
    outputBalance.quantity = round(outputBalance.quantity + input.outputQuantity);
    outputBalance.costValue = round(outputBalance.costValue + totalCost);

    const movement: StockMovement = {
      id: `prd_${Date.now()}`,
      date: input.date ? new Date(input.date) : new Date(),
      type: 'adjustment',
      productId: input.outputProductId,
      quantity: input.outputQuantity,
      unit: outputProduct.unit,
      warehouseId: input.warehouseId,
      referenceDocument: input.referenceDocument || `PRD-${Date.now()}`,
      cost: totalCost,
      status: 'posted',
      createdBy: input.actorUserId,
    };

    fallbackStore.production = [movement, ...fallbackStore.production];
    return movement;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const outputProductResult = await db.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [input.outputProductId]);
  if (!outputProductResult.rowCount) {
    throw new Error('output_product_not_found');
  }

  const bomResult = await db.query(
    `
      SELECT
        r.id AS recipe_id,
        r.output_qty,
        c.component_product_id,
        c.qty_per_output,
        c.waste_factor_percent,
        p.name AS component_name,
        p.unit AS component_unit,
        p.standard_cost AS component_standard_cost
      FROM bom_recipes r
      INNER JOIN bom_recipe_components c ON c.recipe_id = r.id
      INNER JOIN products p ON p.id = c.component_product_id
      WHERE r.output_product_id = $1
        AND r.is_active = TRUE
      ORDER BY c.id
    `,
    [input.outputProductId]
  );

  if (!bomResult.rowCount) {
    throw new Error('bom_not_configured');
  }

  const productionId = `prd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const productionDate = input.date ? new Date(input.date) : new Date();
  const reference = input.referenceDocument || `PRD-${Date.now()}`;
  const outputProductRow = outputProductResult.rows[0] as DbRow;

  await db.query('BEGIN');
  try {
    let componentCost = 0;
    for (const raw of bomResult.rows) {
      const row = raw as DbRow;
      const componentProductId = asString(row.component_product_id);
      const qtyPerOutput = asNumber(row.qty_per_output);
      const wasteFactor = asNumber(row.waste_factor_percent);
      const requiredQty = round(input.outputQuantity * qtyPerOutput * (1 + wasteFactor / 100));

      const componentBalance = await getBalance(db, 'warehouse', input.warehouseId, componentProductId);
      if (componentBalance.quantity < requiredQty) {
        throw new Error(`insufficient_component:${asString(row.component_name)}`);
      }

      const avgCost =
        componentBalance.quantity > 0
          ? componentBalance.costValue / componentBalance.quantity
          : asNumber(row.component_standard_cost);
      const totalCost = round(requiredQty * avgCost);
      componentCost += totalCost;

      await upsertBalance(db, 'warehouse', input.warehouseId, componentProductId, -requiredQty, -totalCost);

      const consumptionMovementId = `mov_cons_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.query(
        `
          INSERT INTO inventory_transactions (
            id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
            reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
          )
          VALUES ($1, $2, 'consumption', $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, 'posted', $11, NOW())
        `,
        [
          consumptionMovementId,
          productionDate.toISOString(),
          componentProductId,
          requiredQty,
          asString(row.component_unit),
          input.warehouseId,
          reference,
          avgCost,
          totalCost,
          JSON.stringify({ flow: 'production_bom', productionId, outputProductId: input.outputProductId }),
          input.actorUserId,
        ]
      );

      await writeStockLedgerEntry(db, {
        transactionId: consumptionMovementId,
        txnDate: productionDate,
        locationType: 'warehouse',
        locationId: input.warehouseId,
        productId: componentProductId,
        quantityDelta: -requiredQty,
        costDelta: -totalCost,
        referenceDocument: reference,
        metadata: { flow: 'production_bom', productionId },
      });
    }

    const overhead = round(input.overheadCost || 0);
    const totalProductionCost = round(componentCost + overhead);
    const outputUnitCost = input.outputQuantity > 0 ? round(totalProductionCost / input.outputQuantity) : 0;

    await upsertBalance(
      db,
      'warehouse',
      input.warehouseId,
      input.outputProductId,
      input.outputQuantity,
      totalProductionCost
    );

    const productionMovementId = `mov_prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.query(
      `
        INSERT INTO inventory_transactions (
          id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
          reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
        )
        VALUES ($1, $2, 'production', $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, 'posted', $11, NOW())
      `,
      [
        productionMovementId,
        productionDate.toISOString(),
        input.outputProductId,
        input.outputQuantity,
        asString(outputProductRow.unit),
        input.warehouseId,
        reference,
        outputUnitCost,
        totalProductionCost,
        JSON.stringify({ flow: 'production_bom', productionId }),
        input.actorUserId,
      ]
    );

    await writeStockLedgerEntry(db, {
      transactionId: productionMovementId,
      txnDate: productionDate,
      locationType: 'warehouse',
      locationId: input.warehouseId,
      productId: input.outputProductId,
      quantityDelta: input.outputQuantity,
      costDelta: totalProductionCost,
      referenceDocument: reference,
      metadata: { flow: 'production_bom', productionId },
    });

    const journalLines = [
      {
        accountCode: '1022',
        accountName: 'Finished Goods Inventory',
        debit: totalProductionCost,
        credit: 0,
        description: `BOM production ${reference}`,
      },
      {
        accountCode: '1021',
        accountName: 'Raw and Packaging Inventory',
        debit: 0,
        credit: componentCost,
        description: `Component consumption ${reference}`,
      },
    ];

    if (overhead > 0) {
      journalLines.push({
        accountCode: '2015',
        accountName: 'Accrued Production Overhead',
        debit: 0,
        credit: overhead,
        description: `Production overhead ${reference}`,
      });
    }

    await postJournal(db, {
      date: productionDate,
      number: `JE-PRD-${Date.now()}`,
      description: `Production posting ${reference}`,
      sourceDocument: reference,
      createdBy: input.actorUserId,
      lines: journalLines,
    });

    await db.query('COMMIT');

    return mapStockMovement({
      id: productionMovementId,
      txn_date: productionDate,
      txn_type: 'production',
      product_id: input.outputProductId,
      quantity: input.outputQuantity,
      unit: asString(outputProductRow.unit),
      warehouse_id: input.warehouseId,
      branch_id: null,
      reference_document: reference,
      total_cost: totalProductionCost,
      status: 'posted',
      created_by: input.actorUserId,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

function mapTransferHeader(row: DbRow, lines: TransferLineRecord[]): TransferRecord {
  return {
    id: asString(row.id),
    transferNumber: asString(row.transfer_number),
    date: asDate(row.transfer_date),
    fromWarehouseId: asString(row.from_warehouse_id),
    toBranchId: asString(row.to_branch_id),
    status: asString(row.status) as TransferRecord['status'],
    createdBy: asString(row.created_by || 'system'),
    lines,
  };
}

export async function listTransfers(): Promise<TransferRecord[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.transfers;
  }

  const db = getPool();
  if (!db) return [];

  const headerResult = await db.query(`SELECT * FROM stock_transfers ORDER BY transfer_date DESC LIMIT 200`);
  if (!headerResult.rowCount) return [];

  const transferIds = headerResult.rows.map((row) => asString((row as DbRow).id));
  const lineResult = await db.query(
    `SELECT * FROM stock_transfer_lines WHERE transfer_id = ANY($1::text[]) ORDER BY transfer_id, id`,
    [transferIds]
  );

  const linesByTransferId = new Map<string, TransferLineRecord[]>();
  for (const raw of lineResult.rows) {
    const row = raw as DbRow;
    const transferId = asString(row.transfer_id);
    const existing = linesByTransferId.get(transferId) || [];
    existing.push({
      id: asString(row.id),
      productId: asString(row.product_id),
      quantitySent: asNumber(row.quantity_sent),
      quantityReceived: asNumber(row.quantity_received),
      varianceQuantity: asNumber(row.variance_quantity),
      unitCost: asNumber(row.unit_cost),
    });
    linesByTransferId.set(transferId, existing);
  }

  return headerResult.rows.map((raw) =>
    mapTransferHeader(raw as DbRow, linesByTransferId.get(asString((raw as DbRow).id)) || [])
  );
}

export async function createTransfer(input: CreateTransferInput): Promise<TransferRecord> {
  await ensureErpDatabaseReady();

  if (input.lines.length === 0) throw new Error('at_least_one_line_required');

  if (!isDatabaseEnabled()) {
    const transfer: TransferRecord = {
      id: `trf_${Date.now()}`,
      transferNumber: `TRF-${Date.now()}`,
      date: input.date ? new Date(input.date) : new Date(),
      fromWarehouseId: input.fromWarehouseId,
      toBranchId: input.toBranchId,
      status: 'in_transit',
      createdBy: input.actorUserId,
      lines: input.lines.map((line) => ({
        id: `trfl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: line.productId,
        quantitySent: line.quantity,
        quantityReceived: 0,
        varianceQuantity: 0,
        unitCost: line.unitCost || 0,
      })),
    };
    fallbackStore.transfers = [transfer, ...fallbackStore.transfers];
    return transfer;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const transferId = `trf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const transferNumber = `TRF-${Date.now()}`;
  const transferDate = input.date ? new Date(input.date) : new Date();

  await db.query('BEGIN');
  try {
    await db.query(
      `
        INSERT INTO stock_transfers (
          id, transfer_number, transfer_date, from_warehouse_id, to_branch_id,
          status, notes, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, 'in_transit', $6, $7, NOW())
      `,
      [
        transferId,
        transferNumber,
        transferDate.toISOString(),
        input.fromWarehouseId,
        input.toBranchId,
        input.notes || null,
        input.actorUserId,
      ]
    );

    for (const line of input.lines) {
      const productResult = await db.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [line.productId]);
      if (!productResult.rowCount) throw new Error('product_not_found');

      const productRow = productResult.rows[0] as DbRow;
      const warehouseBalance = await getBalance(db, 'warehouse', input.fromWarehouseId, line.productId);
      if (warehouseBalance.quantity < line.quantity) {
        throw new Error(`insufficient_stock:${asString(productRow.name)}`);
      }

      const avgCost =
        warehouseBalance.quantity > 0
          ? warehouseBalance.costValue / warehouseBalance.quantity
          : asNumber(productRow.standard_cost);
      const unitCost = line.unitCost ?? avgCost;
      const totalCost = round(line.quantity * unitCost);

      await db.query(
        `
          INSERT INTO stock_transfer_lines (
            id, transfer_id, product_id, quantity_sent, quantity_received, variance_quantity, unit_cost, variance_value
          )
          VALUES ($1, $2, $3, $4, 0, 0, $5, 0)
        `,
        [
          `trfl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          transferId,
          line.productId,
          line.quantity,
          unitCost,
        ]
      );

      await upsertBalance(db, 'warehouse', input.fromWarehouseId, line.productId, -line.quantity, -totalCost);
      await upsertBalance(db, 'in_transit', transferId, line.productId, line.quantity, totalCost);

      const movementId = `mov_trfout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.query(
        `
          INSERT INTO inventory_transactions (
            id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
            reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
          )
          VALUES ($1, $2, 'transfer_out', $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, 'posted', $12, NOW())
        `,
        [
          movementId,
          transferDate.toISOString(),
          line.productId,
          line.quantity,
          asString(productRow.unit),
          input.fromWarehouseId,
          input.toBranchId,
          transferNumber,
          unitCost,
          totalCost,
          JSON.stringify({ transferId, flow: 'transfer_out' }),
          input.actorUserId,
        ]
      );

      await writeStockLedgerEntry(db, {
        transactionId: movementId,
        txnDate: transferDate,
        locationType: 'warehouse',
        locationId: input.fromWarehouseId,
        productId: line.productId,
        quantityDelta: -line.quantity,
        costDelta: -totalCost,
        referenceDocument: transferNumber,
        metadata: { transferId, flow: 'transfer_out' },
      });

      await writeStockLedgerEntry(db, {
        transactionId: movementId,
        txnDate: transferDate,
        locationType: 'in_transit',
        locationId: transferId,
        productId: line.productId,
        quantityDelta: line.quantity,
        costDelta: totalCost,
        referenceDocument: transferNumber,
        metadata: { transferId, flow: 'transfer_in_transit' },
      });
    }

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const transfers = await listTransfers();
  const transfer = transfers.find((item) => item.id === transferId);
  if (!transfer) throw new Error('transfer_not_found');
  return transfer;
}

export async function receiveTransfer(input: ReceiveTransferInput): Promise<TransferRecord> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const transfer = fallbackStore.transfers.find((item) => item.id === input.transferId);
    if (!transfer) throw new Error('transfer_not_found');
    transfer.status = 'received';
    return transfer;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  await db.query('BEGIN');
  try {
    const transferResult = await db.query(`SELECT * FROM stock_transfers WHERE id = $1 LIMIT 1`, [input.transferId]);
    if (!transferResult.rowCount) throw new Error('transfer_not_found');
    const transferRow = transferResult.rows[0] as DbRow;
    if (asString(transferRow.status) === 'received') throw new Error('transfer_already_received');

    const lineResult = await db.query(`SELECT * FROM stock_transfer_lines WHERE transfer_id = $1`, [input.transferId]);
    if (!lineResult.rowCount) throw new Error('transfer_lines_not_found');

    const receiveById = new Map(input.lines.map((line) => [line.lineId, line.quantityReceived]));
    let hasVariance = false;
    let varianceCostTotal = 0;

    for (const raw of lineResult.rows) {
      const row = raw as DbRow;
      const lineId = asString(row.id);
      const qtySent = asNumber(row.quantity_sent);
      const qtyReceived = round(receiveById.has(lineId) ? Number(receiveById.get(lineId)) : qtySent);
      if (qtyReceived < 0 || qtyReceived > qtySent) {
        throw new Error('invalid_received_quantity');
      }

      const varianceQty = round(qtySent - qtyReceived);
      const unitCost = asNumber(row.unit_cost);
      const varianceValue = round(varianceQty * unitCost);
      const totalSentCost = round(qtySent * unitCost);
      const receivedCost = round(qtyReceived * unitCost);

      await db.query(
        `
          UPDATE stock_transfer_lines
          SET quantity_received = $1, variance_quantity = $2, variance_value = $3
          WHERE id = $4
        `,
        [qtyReceived, varianceQty, varianceValue, lineId]
      );

      await upsertBalance(db, 'in_transit', input.transferId, asString(row.product_id), -qtySent, -totalSentCost);
      if (qtyReceived > 0) {
        await upsertBalance(
          db,
          'branch',
          asString(transferRow.to_branch_id),
          asString(row.product_id),
          qtyReceived,
          receivedCost
        );
      }

      const movementId = `mov_trfrcv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.query(
        `
          INSERT INTO inventory_transactions (
            id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
            reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
          )
          VALUES ($1, NOW(), 'transfer_in', $2, $3, 'litres', $4, $5, $6, $7, $8, $9::jsonb, 'posted', $10, NOW())
        `,
        [
          movementId,
          asString(row.product_id),
          qtyReceived,
          asString(transferRow.from_warehouse_id),
          asString(transferRow.to_branch_id),
          asString(transferRow.transfer_number),
          unitCost,
          receivedCost,
          JSON.stringify({ transferId: input.transferId, flow: 'transfer_receive' }),
          input.actorUserId,
        ]
      );

      await writeStockLedgerEntry(db, {
        transactionId: movementId,
        txnDate: new Date(),
        locationType: 'in_transit',
        locationId: input.transferId,
        productId: asString(row.product_id),
        quantityDelta: -qtySent,
        costDelta: -totalSentCost,
        referenceDocument: asString(transferRow.transfer_number),
        metadata: { transferId: input.transferId, flow: 'transfer_receive' },
      });

      if (qtyReceived > 0) {
        await writeStockLedgerEntry(db, {
          transactionId: movementId,
          txnDate: new Date(),
          locationType: 'branch',
          locationId: asString(transferRow.to_branch_id),
          productId: asString(row.product_id),
          quantityDelta: qtyReceived,
          costDelta: receivedCost,
          referenceDocument: asString(transferRow.transfer_number),
          metadata: { transferId: input.transferId, flow: 'transfer_receive' },
        });
      }

      if (varianceQty > 0) {
        hasVariance = true;
        varianceCostTotal += varianceValue;
        await db.query(
          `
            INSERT INTO inventory_transactions (
              id, txn_date, txn_type, product_id, quantity, unit, warehouse_id, branch_id,
              reference_document, unit_cost, total_cost, metadata, status, created_by, created_at
            )
            VALUES ($1, NOW(), 'leakage', $2, $3, 'litres', $4, $5, $6, $7, $8, $9::jsonb, 'posted', $10, NOW())
          `,
          [
            `mov_leak_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            asString(row.product_id),
            varianceQty,
            asString(transferRow.from_warehouse_id),
            asString(transferRow.to_branch_id),
            asString(transferRow.transfer_number),
            unitCost,
            varianceValue,
            JSON.stringify({ transferId: input.transferId, flow: 'transfer_variance' }),
            input.actorUserId,
          ]
        );
      }
    }

    if (hasVariance && varianceCostTotal > 0) {
      await postJournal(db, {
        date: new Date(),
        number: `JE-TRFVAR-${Date.now()}`,
        description: `Transfer variance ${asString(transferRow.transfer_number)}`,
        sourceDocument: asString(transferRow.transfer_number),
        createdBy: input.actorUserId,
        lines: [
          {
            accountCode: '5031',
            accountName: 'Transit Loss and Leakage',
            debit: varianceCostTotal,
            credit: 0,
            description: 'Variance loss on transfer',
          },
          {
            accountCode: '1020',
            accountName: 'Inventory',
            debit: 0,
            credit: varianceCostTotal,
            description: 'Inventory write-down for variance',
          },
        ],
      });
    }

    await db.query(`UPDATE stock_transfers SET status = $1 WHERE id = $2`, [
      hasVariance ? 'variance' : 'received',
      input.transferId,
    ]);

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const transfers = await listTransfers();
  const transfer = transfers.find((item) => item.id === input.transferId);
  if (!transfer) throw new Error('transfer_not_found');
  return transfer;
}

export async function listJournalEntries(): Promise<JournalEntry[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.journals;
  }

  const db = getPool();
  if (!db) return [];

  const headerResult = await db.query(`SELECT * FROM journal_entries ORDER BY entry_date DESC LIMIT 200`);
  if (!headerResult.rowCount) return [];

  const entryIds = headerResult.rows.map((row) => asString((row as DbRow).id));
  const lineResult = await db.query(
    `SELECT * FROM journal_lines WHERE journal_entry_id = ANY($1::text[]) ORDER BY journal_entry_id, id`,
    [entryIds]
  );

  const linesById = new Map<string, DbRow[]>();
  for (const raw of lineResult.rows) {
    const row = raw as DbRow;
    const journalId = asString(row.journal_entry_id);
    const existing = linesById.get(journalId) || [];
    existing.push(row);
    linesById.set(journalId, existing);
  }

  return headerResult.rows.map((raw) => {
    const header = raw as DbRow;
    const journalId = asString(header.id);
    return buildJournalEntryFromRows(header, linesById.get(journalId) || []);
  });
}

export async function listAdminCostSummaries(): Promise<AdminCostSummary[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.adminCostSummaries;
  }

  const db = getPool();
  if (!db) return [];

  const result = await db.query(`
    SELECT c.id, c.code, c.name, COALESCE(SUM(e.amount), 0) AS total_amount
    FROM admin_expense_codes c
    LEFT JOIN admin_expenses e ON e.code_id = c.id
    GROUP BY c.id, c.code, c.name
    ORDER BY c.code
  `);

  return result.rows.map((row) => ({
    id: asString((row as DbRow).id),
    code: asString((row as DbRow).code),
    name: asString((row as DbRow).name),
    totalAmount: asNumber((row as DbRow).total_amount),
  }));
}

export async function createAdminCost(input: CreateAdminCostInput): Promise<AdminCostSummary> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const summary = fallbackStore.adminCostSummaries.find((item) => item.code === input.code);
    if (!summary) throw new Error('expense_code_not_found');
    summary.totalAmount = round(summary.totalAmount + input.amount);
    return summary;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const codeResult = await db.query(`SELECT id, code, name FROM admin_expense_codes WHERE code = $1 LIMIT 1`, [
    input.code,
  ]);
  if (!codeResult.rowCount) throw new Error('expense_code_not_found');

  const codeRow = codeResult.rows[0] as DbRow;
  const expenseDate = input.date ? new Date(input.date) : new Date();

  await db.query('BEGIN');
  try {
    await db.query(
      `
        INSERT INTO admin_expenses (id, expense_date, code_id, description, amount, status, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, 'posted', $6, NOW())
      `,
      [
        `adme_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        expenseDate.toISOString(),
        asString(codeRow.id),
        input.description,
        round(input.amount),
        input.actorUserId,
      ]
    );

    await postJournal(db, {
      date: expenseDate,
      number: `JE-ADM-${Date.now()}`,
      description: `Administrative cost ${asString(codeRow.code)}`,
      sourceDocument: asString(codeRow.code),
      createdBy: input.actorUserId,
      lines: [
        {
          accountCode: asString(codeRow.code),
          accountName: asString(codeRow.name),
          debit: input.amount,
          credit: 0,
          description: input.description,
        },
        {
          accountCode: '1010',
          accountName: 'Cash and Bank',
          debit: 0,
          credit: input.amount,
          description: `Payment for ${asString(codeRow.code)}`,
        },
      ],
    });

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const summaryResult = await db.query(
    `
      SELECT c.id, c.code, c.name, COALESCE(SUM(e.amount), 0) AS total_amount
      FROM admin_expense_codes c
      LEFT JOIN admin_expenses e ON e.code_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.code, c.name
      LIMIT 1
    `,
    [asString(codeRow.id)]
  );

  const row = summaryResult.rows[0] as DbRow;
  return {
    id: asString(row.id),
    code: asString(row.code),
    name: asString(row.name),
    totalAmount: asNumber(row.total_amount),
  };
}

function detectAccountType(accountCode: string): TrialBalance['accountType'] {
  const first = accountCode.trim()[0];
  if (first === '1') return 'asset';
  if (first === '2') return 'liability';
  if (first === '3') return 'equity';
  if (first === '4') return 'revenue';
  if (first === '5') return 'expense';
  return 'asset';
}

export async function listTrialBalance(): Promise<TrialBalance[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const aggregates = new Map<
      string,
      { accountCode: string; accountName: string; debit: number; credit: number }
    >();

    for (const journal of fallbackStore.journals) {
      for (const line of journal.lines) {
        const key = line.accountCode;
        const row = aggregates.get(key) || {
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: 0,
          credit: 0,
        };
        row.debit += line.debit;
        row.credit += line.credit;
        aggregates.set(key, row);
      }
    }

    return [...aggregates.values()]
      .map((row) => ({
        accountId: row.accountCode,
        accountCode: row.accountCode,
        accountName: row.accountName,
        accountType: detectAccountType(row.accountCode),
        debit: round(row.debit),
        credit: round(row.credit),
        balance: round(row.debit - row.credit),
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  const db = getPool();
  if (!db) return [];

  const result = await db.query(`
    SELECT
      account_code,
      MAX(account_name) AS account_name,
      COALESCE(SUM(debit), 0) AS debit,
      COALESCE(SUM(credit), 0) AS credit
    FROM journal_lines
    GROUP BY account_code
    ORDER BY account_code
  `);

  return result.rows.map((raw) => {
    const row = raw as DbRow;
    const accountCode = asString(row.account_code);
    const debit = asNumber(row.debit);
    const credit = asNumber(row.credit);
    return {
      accountId: accountCode,
      accountCode,
      accountName: asString(row.account_name),
      accountType: detectAccountType(accountCode),
      debit: round(debit),
      credit: round(credit),
      balance: round(debit - credit),
    } as TrialBalance;
  });
}

function mapAsset(row: DbRow): AssetRecord {
  return {
    id: asString(row.id),
    assetCode: asString(row.asset_code),
    name: asString(row.name),
    category: asString(row.category),
    acquiredDate: asDate(row.acquired_date),
    acquisitionCost: asNumber(row.acquisition_cost),
    usefulLifeYears: asNumber(row.useful_life_years),
    status: (asString(row.status) as AssetRecord['status']) || 'active',
  };
}

export async function listAssets(): Promise<AssetRecord[]> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    return fallbackStore.assets;
  }

  const db = getPool();
  if (!db) return [];

  const result = await db.query(`SELECT * FROM assets ORDER BY acquired_date DESC`);
  return result.rows.map((row) => mapAsset(row as DbRow));
}

export async function createAsset(input: CreateAssetInput): Promise<AssetRecord> {
  await ensureErpDatabaseReady();

  const acquiredDate = input.acquiredDate ? new Date(input.acquiredDate) : new Date();

  if (!isDatabaseEnabled()) {
    const asset: AssetRecord = {
      id: `asset_${Date.now()}`,
      assetCode: input.assetCode,
      name: input.name,
      category: input.category,
      acquiredDate,
      acquisitionCost: input.acquisitionCost,
      usefulLifeYears: input.usefulLifeYears,
      status: 'active',
    };
    fallbackStore.assets = [asset, ...fallbackStore.assets];
    return asset;
  }

  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const id = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.query('BEGIN');
  try {
    await db.query(
      `
        INSERT INTO assets (
          id, asset_code, name, category, acquired_date, acquisition_cost, useful_life_years, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
      `,
      [id, input.assetCode, input.name, input.category, acquiredDate.toISOString(), input.acquisitionCost, input.usefulLifeYears]
    );

    await postJournal(db, {
      date: acquiredDate,
      number: `JE-PPE-${Date.now()}`,
      description: `PPE acquisition ${input.assetCode}`,
      sourceDocument: input.assetCode,
      createdBy: input.actorUserId,
      lines: [
        {
          accountCode: '1500',
          accountName: 'Property, Plant and Equipment',
          debit: input.acquisitionCost,
          credit: 0,
          description: `Acquire ${input.name}`,
        },
        {
          accountCode: '1010',
          accountName: 'Cash and Bank',
          debit: 0,
          credit: input.acquisitionCost,
          description: `Payment for ${input.name}`,
        },
      ],
    });

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const result = await db.query(`SELECT * FROM assets WHERE id = $1 LIMIT 1`, [id]);
  return mapAsset(result.rows[0] as DbRow);
}

function mapSalesToStockMovement(sale: SalesTransaction): StockMovement {
  return {
    id: `sale-mov-${sale.id}`,
    date: sale.date,
    type: 'sale',
    productId: sale.items[0]?.productId || 'unknown',
    quantity: sale.totalQuantity,
    unit: 'litres',
    warehouseId: sale.warehouseId,
    branchId: sale.branchId,
    referenceDocument: sale.transactionNumber,
    cost: sale.costOfGoods,
    status: sale.status === 'posted' ? 'posted' : 'draft',
    createdBy: sale.createdBy,
  };
}

function monthKey(input: Date | string) {
  const d = input instanceof Date ? input : new Date(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(key: string) {
  const [yearText, monthText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  return new Date(year, month - 1, 1).toLocaleDateString('en-NG', {
    month: 'short',
    year: '2-digit',
  });
}

function buildMonthAxis(size = 6) {
  const axis: string[] = [];
  const base = new Date();
  for (let i = size - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    axis.push(monthKey(d));
  }
  return axis;
}

function buildDashboardAnalytics(input: {
  salesTransactions: SalesTransaction[];
  products: Product[];
  adminCosts: AdminCostSummary[];
  assets: AssetRecord[];
  stockByLocation?: Array<{ category: string; warehouse: number; branch: number; inTransit: number }>;
  transferVariance?: Array<{ route: string; sent: number; received: number; variance: number }>;
  leakageMap?: Record<string, { quantityLost: number; valueLost: number }>;
  bankNetByMonth?: Record<string, number>;
}): DashboardAnalytics {
  const monthAxis = buildMonthAxis(6);
  const monthAgg = new Map<
    string,
    { revenue: number; cogs: number; qty: number; expected: number; actual: number }
  >();
  for (const key of monthAxis) {
    monthAgg.set(key, { revenue: 0, cogs: 0, qty: 0, expected: 0, actual: 0 });
  }

  const categoryByProduct = new Map(input.products.map((product) => [product.id, (product as any).category || 'raw_oil']));
  const productAgg = new Map<string, { revenue: number; cogs: number }>();

  for (const sale of input.salesTransactions) {
    const key = monthKey(sale.date);
    const bucket = monthAgg.get(key);
    if (bucket) {
      bucket.revenue += sale.totalAmount;
      bucket.cogs += sale.costOfGoods;
      bucket.qty += sale.totalQuantity;
    }

    for (const item of sale.items) {
      const p = productAgg.get(item.productName) || { revenue: 0, cogs: 0 };
      p.revenue += item.lineTotal;
      p.cogs += item.cost;
      productAgg.set(item.productName, p);

      const category = categoryByProduct.get(item.productId) || 'raw_oil';
      if (bucket) {
        if (category === 'packaging') {
          bucket.actual += item.quantity;
        } else {
          bucket.expected += item.quantity;
        }
      }
    }
  }

  const salesTrend = monthAxis.map((key) => ({
    period: monthLabel(key),
    sales: round(monthAgg.get(key)?.revenue || 0),
    quantity: round(monthAgg.get(key)?.qty || 0),
  }));

  const revenueVsCogs = monthAxis.map((key) => {
    const revenue = monthAgg.get(key)?.revenue || 0;
    const cogs = monthAgg.get(key)?.cogs || 0;
    return {
      period: monthLabel(key),
      revenue: round(revenue),
      cogs: round(cogs),
      grossProfit: round(revenue - cogs),
    };
  });

  const packagingEfficiency = monthAxis.map((key) => {
    const expected = monthAgg.get(key)?.expected || 0;
    const actual = monthAgg.get(key)?.actual || 0;
    return {
      period: monthLabel(key),
      expected: round(expected),
      actual: round(actual),
      variance: round(actual - expected),
    };
  });

  const leakageTrend = monthAxis.map((key) => ({
    period: monthLabel(key),
    quantityLost: round(input.leakageMap?.[key]?.quantityLost || 0),
    valueLost: round(input.leakageMap?.[key]?.valueLost || 0),
  }));

  const productProfitability = [...productAgg.entries()]
    .map(([product, values]) => {
      const margin = values.revenue - values.cogs;
      return {
        product,
        revenue: round(values.revenue),
        cogs: round(values.cogs),
        margin: round(margin),
        marginPct: values.revenue > 0 ? round((margin / values.revenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.marginPct - a.marginPct)
    .slice(0, 10);

  const expenseBreakdown = input.adminCosts.map((row) => ({
    category: row.name,
    amount: round(row.totalAmount),
  }));

  const totalRevenue = input.salesTransactions.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalCogs = input.salesTransactions.reduce((sum, row) => sum + row.costOfGoods, 0);
  const totalAdmin = input.adminCosts.reduce((sum, row) => sum + row.totalAmount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalAdmin;

  const pnlBridge = [
    { step: 'Sales Revenue', value: round(totalRevenue) },
    { step: 'COGS', value: round(-totalCogs) },
    { step: 'Gross Profit', value: round(grossProfit) },
    { step: 'Admin Costs', value: round(-totalAdmin) },
    { step: 'Net Profit', value: round(netProfit) },
  ];

  const defaultStockByLocation = [
    {
      category: 'all',
      warehouse: round(input.products.reduce((sum, product) => sum + product.currentStock * 0.7, 0)),
      branch: round(input.products.reduce((sum, product) => sum + product.currentStock * 0.3, 0)),
      inTransit: 0,
    },
  ];

  const transferVariance =
    input.transferVariance && input.transferVariance.length > 0
      ? input.transferVariance
      : [{ route: 'Main -> Shops', sent: 0, received: 0, variance: 0 }];

  const acquisitionsByMonth = new Map<string, number>();
  for (const asset of input.assets) {
    const key = monthKey(asset.acquiredDate);
    acquisitionsByMonth.set(key, (acquisitionsByMonth.get(key) || 0) + asset.acquisitionCost);
  }

  let assetRunning = 0;
  let bankRunning = 0;
  const assetBankTrend = monthAxis.map((key) => {
    assetRunning += acquisitionsByMonth.get(key) || 0;
    bankRunning += input.bankNetByMonth?.[key] || 0;
    return {
      period: monthLabel(key),
      assets: round(assetRunning),
      bank: round(bankRunning),
    };
  });

  return {
    salesTrend,
    revenueVsCogs,
    stockByLocation: input.stockByLocation && input.stockByLocation.length > 0 ? input.stockByLocation : defaultStockByLocation,
    transferVariance: transferVariance.map((row) => ({
      route: row.route,
      sent: round(row.sent),
      received: round(row.received),
      variance: round(row.variance),
    })),
    leakageTrend,
    packagingEfficiency,
    productProfitability,
    pnlBridge,
    expenseBreakdown,
    assetBankTrend,
  };
}

export async function getCeoDashboardData(): Promise<{
  metrics: DashboardMetrics;
  salesTransactions: SalesTransaction[];
  analytics: DashboardAnalytics;
}> {
  await ensureErpDatabaseReady();

  if (!isDatabaseEnabled()) {
    const analytics = buildDashboardAnalytics({
      salesTransactions: fallbackStore.sales,
      products: fallbackStore.products,
      adminCosts: fallbackStore.adminCostSummaries,
      assets: fallbackStore.assets,
    });
    return {
      metrics: {
        ...mockDashboardMetrics,
        totalSales: {
          ...mockDashboardMetrics.totalSales,
          amount: fallbackStore.sales.reduce((sum, item) => sum + item.totalAmount, 0),
          quantity: fallbackStore.sales.reduce((sum, item) => sum + item.totalQuantity, 0),
          transactions: fallbackStore.sales.length,
        },
      },
      salesTransactions: fallbackStore.sales.slice(0, 20),
      analytics,
    };
  }

  const db = getPool();
  if (!db) {
    const analytics = buildDashboardAnalytics({
      salesTransactions: mockSalesTransactions,
      products: mockProducts,
      adminCosts: fallbackStore.adminCostSummaries,
      assets: fallbackStore.assets,
    });
    return {
      metrics: mockDashboardMetrics,
      salesTransactions: mockSalesTransactions,
      analytics,
    };
  }

  const [salesTransactions, products, adminCosts, assets, stockRows, transferRows, leakageRows, bankRows] =
    await Promise.all([
      listSalesTransactions(),
      listProducts(),
      listAdminCostSummaries(),
      listAssets(),
      db.query(`
        SELECT
          p.category,
          COALESCE(SUM(CASE WHEN b.location_type = 'warehouse' THEN b.quantity ELSE 0 END), 0) AS warehouse_qty,
          COALESCE(SUM(CASE WHEN b.location_type = 'branch' THEN b.quantity ELSE 0 END), 0) AS branch_qty,
          COALESCE(SUM(CASE WHEN b.location_type = 'in_transit' THEN b.quantity ELSE 0 END), 0) AS in_transit_qty
        FROM inventory_balances b
        INNER JOIN products p ON p.id = b.product_id
        GROUP BY p.category
        ORDER BY p.category
      `),
      db.query(`
        SELECT
          COALESCE(warehouse_id, 'warehouse') AS warehouse_id,
          COALESCE(branch_id, 'branch') AS branch_id,
          COALESCE(SUM(CASE WHEN txn_type = 'transfer_out' THEN quantity ELSE 0 END), 0) AS sent_qty,
          COALESCE(SUM(CASE WHEN txn_type = 'transfer_in' THEN quantity ELSE 0 END), 0) AS received_qty
        FROM inventory_transactions
        WHERE txn_type IN ('transfer_out', 'transfer_in')
        GROUP BY warehouse_id, branch_id
      `),
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', txn_date), 'YYYY-MM') AS month_key,
          COALESCE(SUM(quantity), 0) AS qty_lost,
          COALESCE(SUM(total_cost), 0) AS value_lost
        FROM inventory_transactions
        WHERE txn_type IN ('damage', 'leakage', 'shrinkage')
        GROUP BY DATE_TRUNC('month', txn_date)
      `),
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', je.entry_date), 'YYYY-MM') AS month_key,
          COALESCE(SUM(jl.debit - jl.credit), 0) AS bank_net
        FROM journal_entries je
        INNER JOIN journal_lines jl ON jl.journal_entry_id = je.id
        WHERE jl.account_code = '1010'
        GROUP BY DATE_TRUNC('month', je.entry_date)
      `),
    ]);

  const salesAmount = salesTransactions.reduce((sum, item) => sum + item.totalAmount, 0);
  const salesQuantity = salesTransactions.reduce((sum, item) => sum + item.totalQuantity, 0);
  const stockValue = products.reduce((sum, item) => sum + item.currentStock * item.standardCost, 0);
  const stockQuantity = products.reduce((sum, item) => sum + item.currentStock, 0);

  const [pendingPurchasesResult, varianceResult] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS count FROM inventory_transactions WHERE status = 'draft'`),
    db.query(`
      SELECT COALESCE(SUM(cost_value), 0) AS value
      FROM inventory_balances
      WHERE quantity < 0
    `),
  ]);

  const pendingApprovals = asNumber((pendingPurchasesResult.rows[0] as DbRow).count);
  const negativeVarianceValue = Math.abs(asNumber((varianceResult.rows[0] as DbRow).value));

  const recentTransactions: StockMovement[] = salesTransactions
    .slice(0, 10)
    .map((item) => mapSalesToStockMovement(item));

  const metrics: DashboardMetrics = {
    totalStock: {
      quantity: round(stockQuantity),
      value: round(stockValue),
      trend: 0,
    },
    totalSales: {
      amount: round(salesAmount),
      quantity: round(salesQuantity),
      transactions: salesTransactions.length,
      trend: 0,
    },
    pendingApprovals,
    reconciliationVariance: {
      amount: round(negativeVarianceValue),
      percentage: 0,
    },
    topProducts: products
      .sort((a, b) => b.currentStock * b.standardCost - a.currentStock * a.standardCost)
      .slice(0, 5),
    recentTransactions,
  };

  const leakageMap: Record<string, { quantityLost: number; valueLost: number }> = {};
  for (const raw of leakageRows.rows) {
    const row = raw as DbRow;
    const key = asString(row.month_key);
    leakageMap[key] = {
      quantityLost: asNumber(row.qty_lost),
      valueLost: asNumber(row.value_lost),
    };
  }

  const bankNetByMonth: Record<string, number> = {};
  for (const raw of bankRows.rows) {
    const row = raw as DbRow;
    bankNetByMonth[asString(row.month_key)] = asNumber(row.bank_net);
  }

  const analytics = buildDashboardAnalytics({
    salesTransactions,
    products,
    adminCosts,
    assets,
    stockByLocation: stockRows.rows.map((raw) => {
      const row = raw as DbRow;
      return {
        category: asString(row.category),
        warehouse: asNumber(row.warehouse_qty),
        branch: asNumber(row.branch_qty),
        inTransit: asNumber(row.in_transit_qty),
      };
    }),
    transferVariance: transferRows.rows.map((raw) => {
      const row = raw as DbRow;
      const sent = asNumber(row.sent_qty);
      const received = asNumber(row.received_qty);
      return {
        route: `${asString(row.warehouse_id)} -> ${asString(row.branch_id)}`,
        sent,
        received,
        variance: sent - received,
      };
    }),
    leakageMap,
    bankNetByMonth,
  });

  return {
    metrics,
    salesTransactions: salesTransactions.slice(0, 20),
    analytics,
  };
}

export type { CreateProductInput, CreatePurchaseInput, CreateSalesInput, CreateAdminCostInput, MasterDataBundle };
