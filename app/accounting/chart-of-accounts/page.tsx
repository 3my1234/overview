'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockAccounts } from '@/lib/mock-data';
import { formatCurrency, formatLabel } from '@/lib/utils/formatting';
import { Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ChartOfAccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Account Type',
      placeholder: 'All Types',
      key: 'type',
      options: [
        { id: 'asset', label: 'Asset', value: 'asset' },
        { id: 'liability', label: 'Liability', value: 'liability' },
        { id: 'equity', label: 'Equity', value: 'equity' },
        { id: 'revenue', label: 'Revenue', value: 'revenue' },
        { id: 'expense', label: 'Expense', value: 'expense' },
      ],
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'active', label: 'Active', value: 'active' },
        { id: 'inactive', label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // Filtered data
  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch =
      !searchTerm ||
      account.code.includes(searchTerm) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filters.type || account.type === filters.type;
    const matchesStatus = !filters.status || account.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Table columns
  const columns: DataTableColumn<Account>[] = [
    {
      key: 'code',
      label: 'Account Code',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => formatLabel(value),
      sortable: true,
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'isControlAccount',
      label: 'Control',
      render: (value) => (value ? 'Yes' : 'No'),
      align: 'center',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <AppShell userRole="accountant">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Chart of Accounts"
          description="General ledger account structure"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Chart of Accounts' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Accounts Table */}
        <DataTable<Account>
          columns={columns}
          data={filteredAccounts}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        {/* Summary Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
            const accounts = mockAccounts.filter(a => a.type === type);
            const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
            return (
              <div key={type} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase text-muted-foreground font-semibold">
                  {formatLabel(type)}
                </p>
                <p className="text-lg font-bold text-foreground mt-2">
                  {formatCurrency(totalBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{accounts.length} accounts</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
