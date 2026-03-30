export type ValuationMethod = 'cost' | 'cost_plus_margin';

export type TransactionFlow =
  | 'purchase_receipt'
  | 'warehouse_issue_to_branch'
  | 'branch_sale'
  | 'branch_return_to_warehouse'
  | 'customer_return'
  | 'damage_or_leakage';

export type VarianceTreatment = 'review_only' | 'approval_then_adjust' | 'auto_adjust';

export interface FlowValuationPolicy {
  flow: TransactionFlow;
  method: ValuationMethod;
  notes?: string;
}

export interface ReturnDamagePolicy {
  requiresApproval: boolean;
  approverRole: 'warehouse_manager' | 'accountant' | 'admin';
  defaultMethod: ValuationMethod;
  allowsManualOverride: boolean;
}

export interface ReconciliationPolicy {
  isInstant: boolean;
  varianceTolerancePercent: number;
  treatment: VarianceTreatment;
  requiresAccountingJournalForAdjustments: boolean;
}

export interface ReportingPolicy {
  statementFormat: 'ifrs_sme' | 'custom';
  reportingCurrency: 'NGN' | 'USD';
  accountingPeriod: 'monthly' | 'quarterly';
  includeOCIInPnL: boolean;
}

export interface AccountingPolicyConfig {
  version: number;
  pendingClientSignoff: boolean;
  updatedAt: string;
  valuationPolicies: FlowValuationPolicy[];
  returnDamagePolicy: ReturnDamagePolicy;
  reconciliationPolicy: ReconciliationPolicy;
  reportingPolicy: ReportingPolicy;
}

export const defaultAccountingPolicyConfig: AccountingPolicyConfig = {
  version: 1,
  pendingClientSignoff: true,
  updatedAt: new Date().toISOString(),
  valuationPolicies: [
    {
      flow: 'purchase_receipt',
      method: 'cost',
      notes: 'Default placeholder until client confirms policy.',
    },
    {
      flow: 'warehouse_issue_to_branch',
      method: 'cost',
      notes: 'Supports cost_plus_margin once approved.',
    },
    {
      flow: 'branch_sale',
      method: 'cost_plus_margin',
      notes: 'Revenue and COGS split based on sale lines.',
    },
    {
      flow: 'branch_return_to_warehouse',
      method: 'cost',
    },
    {
      flow: 'customer_return',
      method: 'cost_plus_margin',
    },
    {
      flow: 'damage_or_leakage',
      method: 'cost',
    },
  ],
  returnDamagePolicy: {
    requiresApproval: true,
    approverRole: 'warehouse_manager',
    defaultMethod: 'cost',
    allowsManualOverride: false,
  },
  reconciliationPolicy: {
    isInstant: true,
    varianceTolerancePercent: 0.5,
    treatment: 'approval_then_adjust',
    requiresAccountingJournalForAdjustments: true,
  },
  reportingPolicy: {
    statementFormat: 'ifrs_sme',
    reportingCurrency: 'NGN',
    accountingPeriod: 'monthly',
    includeOCIInPnL: false,
  },
};
