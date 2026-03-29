'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import EmptyState from '@/components/states/empty-state';

export default function PPELedgerPage() {
  return (
    <AppShell userRole="accountant">
      <div className="space-y-6">
        <PageHeader
          title="PPE Ledger"
          description="General ledger for property, plant and equipment"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Ledgers' },
            { label: 'PPE' },
          ]}
        />

        <EmptyState
          title="No PPE Transactions"
          description="No property, plant and equipment transactions have been recorded yet."
        />
      </div>
    </AppShell>
  );
}
