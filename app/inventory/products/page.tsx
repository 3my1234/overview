'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockProducts } from '@/lib/mock-data';
import { formatCurrency, formatQuantity, formatNumber } from '@/lib/utils/formatting';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'active', label: 'Active', value: 'active' },
        { id: 'discontinued', label: 'Discontinued', value: 'discontinued' },
      ],
    },
  ];

  // Filtered data
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      !filters.status || product.status === filters.status;

    return matchesSearch && matchesFilters;
  });

  // Table columns
  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
    },
    {
      key: 'currentStock',
      label: 'Current Stock',
      render: (value, row) => formatQuantity(value, row.unit),
      align: 'right',
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'standardCost',
      label: 'Standard Cost',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
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
          title="Products Inventory"
          description="Manage all products across warehouses"
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Products Table */}
        <DataTable<Product>
          columns={columns}
          data={filteredProducts}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
