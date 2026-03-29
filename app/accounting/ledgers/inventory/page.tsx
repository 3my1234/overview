'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import { mockGeneralLedger, mockAccounts } from '@/lib/mock-data';
import { formatDate, formatCurrency } from '@/lib/utils/formatting';
import { GeneralLedger } from '@/lib/types';

export default function InventoryLedgerPage() {
  // Filter for inventory accounts
  const inventoryAccounts = mockAccounts.filter(a => a.code.startsWith('102'));
  const ledgerData = mockGeneralLedger.filter(l => 
    inventoryAccounts.find(a => a.id === l.accountId)
  );

  const columns: DataTableColumn<GeneralLedger>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'journalNumber',
      label: 'Journal #',
    },
    {
      key: 'description',
      label: 'Description',
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
        <PageHeader
          title="Inventory Ledger"
          description="General ledger for inventory accounts"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Ledgers' },
            { label: 'Inventory' },
          ]}
        />

        <DataTable<GeneralLedger>
          columns={columns}
          data={ledgerData}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
