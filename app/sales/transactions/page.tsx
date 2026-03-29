'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockSalesTransactions, mockWarehouses, mockBranches } from '@/lib/mock-data';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { SalesTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function SalesTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Warehouse',
      placeholder: 'All Warehouses',
      key: 'warehouseId',
      options: mockWarehouses.map(w => ({
        id: w.id,
        label: w.name,
        value: w.id,
      })),
    },
    {
      type: 'select',
      label: 'Branch',
      placeholder: 'All Branches',
      key: 'branchId',
      options: mockBranches.map(b => ({
        id: b.id,
        label: b.name,
        value: b.id,
      })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'draft', label: 'Draft', value: 'draft' },
        { id: 'submitted', label: 'Submitted', value: 'submitted' },
        { id: 'approved', label: 'Approved', value: 'approved' },
        { id: 'posted', label: 'Posted', value: 'posted' },
      ],
    },
    {
      type: 'date-range',
      label: 'From Date',
      key: 'fromDate',
    },
  ];

  // Filtered data
  const filteredTransactions = mockSalesTransactions.filter(transaction => {
    const matchesSearch =
      !searchTerm ||
      transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse = !filters.warehouseId || transaction.warehouseId === filters.warehouseId;
    const matchesBranch = !filters.branchId || transaction.branchId === filters.branchId;
    const matchesStatus = !filters.status || transaction.status === filters.status;

    return matchesSearch && matchesWarehouse && matchesBranch && matchesStatus;
  });

  // Table columns
  const columns: DataTableColumn<SalesTransaction>[] = [
    {
      key: 'transactionNumber',
      label: 'Transaction #',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
    },
    {
      key: 'totalQuantity',
      label: 'Qty',
      render: (value) => formatNumber(value),
      align: 'right',
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'costOfGoods',
      label: 'COGS',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'marginPercentage',
      label: 'Margin %',
      render: (value) => `${value.toFixed(2)}%`,
      align: 'right',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <AppShell userRole="sales_manager">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Sales Transactions"
          description="All sales orders and transactions"
          breadcrumbs={[
            { label: 'Sales', href: '/sales' },
            { label: 'Transactions' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Sales Transactions Table */}
        <DataTable<SalesTransaction>
          columns={columns}
          data={filteredTransactions}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
