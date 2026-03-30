import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { updatePolicyConfig, getPolicyConfig } from '@/lib/server/in-memory-store';

const valuationMethodSchema = z.enum(['cost', 'cost_plus_margin']);
const transactionFlowSchema = z.enum([
  'purchase_receipt',
  'warehouse_issue_to_branch',
  'branch_sale',
  'branch_return_to_warehouse',
  'customer_return',
  'damage_or_leakage',
]);
const varianceTreatmentSchema = z.enum(['review_only', 'approval_then_adjust', 'auto_adjust']);

const policyUpdateSchema = z.object({
  pendingClientSignoff: z.boolean(),
  valuationPolicies: z.array(
    z.object({
      flow: transactionFlowSchema,
      method: valuationMethodSchema,
      notes: z.string().optional(),
    })
  ),
  returnDamagePolicy: z.object({
    requiresApproval: z.boolean(),
    approverRole: z.enum(['warehouse_manager', 'accountant', 'admin']),
    defaultMethod: valuationMethodSchema,
    allowsManualOverride: z.boolean(),
  }),
  reconciliationPolicy: z.object({
    isInstant: z.boolean(),
    varianceTolerancePercent: z.number().min(0).max(100),
    treatment: varianceTreatmentSchema,
    requiresAccountingJournalForAdjustments: z.boolean(),
  }),
  reportingPolicy: z.object({
    statementFormat: z.enum(['ifrs_sme', 'custom']),
    reportingCurrency: z.enum(['NGN', 'USD']),
    accountingPeriod: z.enum(['monthly', 'quarterly']),
    includeOCIInPnL: z.boolean(),
  }),
});

export async function GET() {
  return NextResponse.json(ok(getPolicyConfig()));
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = policyUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const currentPolicy = getPolicyConfig();
    const updated = updatePolicyConfig({
      ...currentPolicy,
      ...parsed.data,
    });

    return NextResponse.json(ok(updated, 'Policy configuration updated.'));
  } catch {
    return NextResponse.json(fail('invalid_json', 'Request body must be valid JSON.'), {
      status: 400,
    });
  }
}
