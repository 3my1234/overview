export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface ProjectPhase {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: ProjectTask[];
}

export interface ProjectProgress {
  lastUpdatedAt: string;
  phases: ProjectPhase[];
}

export const defaultProjectProgress: ProjectProgress = {
  lastUpdatedAt: new Date().toISOString(),
  phases: [
    {
      id: 'phase-0',
      title: 'Scope Lock',
      status: 'blocked',
      tasks: [
        { id: 'costing-policy', title: 'Confirm costing policy per flow', status: 'blocked' },
        { id: 'return-policy', title: 'Confirm return, damage, leakage treatment', status: 'blocked' },
        { id: 'reconciliation-policy', title: 'Confirm variance treatment rules', status: 'blocked' },
        { id: 'coa-structure', title: 'Confirm chart of accounts structure', status: 'blocked' },
        { id: 'reports-format', title: 'Confirm final report formats', status: 'blocked' },
      ],
    },
    {
      id: 'phase-1',
      title: 'Core Foundation',
      status: 'in_progress',
      tasks: [
        { id: 'api-skeleton', title: 'API skeleton routes', status: 'completed' },
        { id: 'policy-model', title: 'Policy configuration model', status: 'completed' },
        { id: 'rbac-audit', title: 'RBAC and audit pipeline foundation', status: 'pending' },
        { id: 'database-schema', title: 'Persistent schema design', status: 'pending' },
      ],
    },
    {
      id: 'phase-2',
      title: 'Stock Records',
      status: 'pending',
      tasks: [
        { id: 'stock-master', title: 'Warehouse and aggregate stock references', status: 'pending' },
        { id: 'stock-flow', title: 'Purchase and transfer stock flows', status: 'pending' },
        { id: 'stock-reconciliation', title: 'Warehouse-shop reconciliation', status: 'pending' },
      ],
    },
    {
      id: 'phase-3',
      title: 'Sales and Accounting Links',
      status: 'pending',
      tasks: [
        { id: 'branch-sales', title: 'Branch sales and stock deduction', status: 'pending' },
        { id: 'ledgers', title: 'Warehouse, shop, PPE, bank ledgers', status: 'pending' },
        { id: 'trial-balance', title: 'Trial balance extraction', status: 'pending' },
      ],
    },
    {
      id: 'phase-4',
      title: 'Admin Cost and Financial Reports',
      status: 'pending',
      tasks: [
        { id: 'admin-cost-platform', title: 'Admin cost code and posting workflows', status: 'pending' },
        { id: 'financial-statements', title: 'P&L, Balance Sheet, Cash Flow, Equity statements', status: 'pending' },
        { id: 'ceo-dashboard', title: 'CEO dashboard KPIs and drilldowns', status: 'pending' },
      ],
    },
  ],
};
