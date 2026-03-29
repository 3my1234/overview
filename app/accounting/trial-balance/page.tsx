'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import { mockTrialBalance, mockAccounts } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils/formatting';
import { TrialBalance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function TrialBalancePage() {
  // Calculate totals
  const totalDebits = mockTrialBalance.reduce((sum, item) => sum + item.debit, 0);
  const totalCredits = mockTrialBalance.reduce((sum, item) => sum + item.credit, 0);
  const difference = totalDebits - totalCredits;

  // Table columns
  const columns: DataTableColumn<TrialBalance>[] = [
    {
      key: 'accountCode',
      label: 'Account Code',
      sortable: true,
    },
    {
      key: 'accountName',
      label: 'Account Name',
      sortable: true,
    },
    {
      key: 'accountType',
      label: 'Account Type',
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
  ];

  return (
    <AppShell userRole="accountant">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Trial Balance"
          description="Unadjusted trial balance as of today"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Trial Balance' },
          ]}
          actions={
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          }
        />

        {/* Trial Balance Table */}
        <DataTable<TrialBalance>
          columns={columns}
          data={mockTrialBalance}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        {/* Totals Section */}
        <div className="rounded-lg border-2 border-primary bg-card p-6">
          <h3 className="font-semibold mb-6 text-lg">Trial Balance Summary</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Debits</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(totalDebits)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Credits</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalCredits)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Difference</p>
              <p className={`text-3xl font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(difference)}
              </p>
            </div>
          </div>

          {difference === 0 ? (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-green-700">
              ✓ Trial balance is in balance
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
              ✗ Trial balance has a discrepancy of {formatCurrency(Math.abs(difference))}
            </div>
          )}
        </div>

        {/* Account Type Breakdown */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
            const accounts = mockTrialBalance.filter(a => a.accountType === type);
            const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
            const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);
            return (
              <div key={type} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase text-muted-foreground font-semibold mb-3">
                  {type}
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Debits</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(totalDebits)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Credits</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(totalCredits)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
