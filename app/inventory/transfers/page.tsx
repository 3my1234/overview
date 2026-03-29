'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockStockMovements, mockWarehouses, mockBranches, mockProducts } from '@/lib/mock-data';
import { formatDate, formatQuantity } from '@/lib/utils/formatting';
import { StockMovement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function TransfersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter transfers only
  const transferMovements = mockStockMovements.filter(m => m.type === 'transfer');

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'From Warehouse',
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
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'draft', label: 'Draft', value: 'draft' },
        { id: 'submitted', label: 'Submitted', value: 'submitted' },
        { id: 'posted', label: 'Posted', value: 'posted' },
      ],
    },
  ];

  // Filtered data
  const filteredTransfers = transferMovements.filter(movement => {
    const matchesSearch =
      !searchTerm ||
      movement.referenceDocument.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse = !filters.warehouseId || movement.warehouseId === filters.warehouseId;
    const matchesStatus = !filters.status || movement.status === filters.status;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // Table columns
  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: 'referenceDocument',
      label: 'Transfer #',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'productId',
      label: 'Product',
      render: (value) => mockProducts.find(p => p.id === value)?.name || value,
    },
    {
      key: 'warehouseId',
      label: 'From',
      render: (value) => mockWarehouses.find(w => w.id === value)?.name || value,
    },
    {
      key: 'branchId',
      label: 'To',
      render: (value) => (value ? mockBranches.find(b => b.id === value)?.name || value : 'Internal'),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value, row) => formatQuantity(value, row.unit),
      align: 'right',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <AppShell userRole="warehouse_manager">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Stock Transfers"
          description="Inter-warehouse and branch transfers"
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Transfers' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Transfers Table */}
        <DataTable<StockMovement>
          columns={columns}
          data={filteredTransfers}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
