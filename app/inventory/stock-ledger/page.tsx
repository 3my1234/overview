'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import { mockStockLedger, mockWarehouses, mockProducts } from '@/lib/mock-data';
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils/formatting';
import { StockLedger } from '@/lib/types';
import { useState } from 'react';

export default function StockLedgerPage() {
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
      label: 'Product',
      placeholder: 'All Products',
      key: 'productId',
      options: mockProducts.map(p => ({
        id: p.id,
        label: p.name,
        value: p.id,
      })),
    },
    {
      type: 'date-range',
      label: 'From Date',
      key: 'fromDate',
    },
  ];

  // Filtered data
  const filteredLedger = mockStockLedger.filter(record => {
    const matchesSearch = !searchTerm || record.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = !filters.warehouseId || record.warehouseId === filters.warehouseId;
    const matchesProduct = !filters.productId || record.productId === filters.productId;

    return matchesSearch && matchesWarehouse && matchesProduct;
  });

  // Table columns
  const columns: DataTableColumn<StockLedger>[] = [
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
      key: 'movementType',
      label: 'Movement Type',
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value) => formatNumber(value),
      align: 'right',
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatNumber(value),
      align: 'right',
    },
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
    },
  ];

  return (
    <AppShell userRole="warehouse_manager">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Stock Ledger"
          description="Detailed history of all stock movements"
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Stock Ledger' },
          ]}
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Stock Ledger Table */}
        <DataTable<StockLedger>
          columns={columns}
          data={filteredLedger}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
