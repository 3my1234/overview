'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import ReconciliationWidget from '@/components/reconciliation/reconciliation-widget';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import { mockReconciliationRecords, mockWarehouses, mockProducts } from '@/lib/mock-data';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DailyReconciliationPage() {
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
      type: 'status',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'pending', label: 'Pending', value: 'pending' },
        { id: 'reconciled', label: 'Reconciled', value: 'reconciled' },
        { id: 'investigation', label: 'Investigation', value: 'investigation' },
      ],
    },
  ];

  // Filtered data
  const filteredRecords = mockReconciliationRecords.filter(record => {
    const matchesWarehouse = !filters.warehouseId || record.warehouseId === filters.warehouseId;
    const matchesStatus = !filters.status || record.status === filters.status;

    return matchesWarehouse && matchesStatus;
  });

  return (
    <AppShell userRole="warehouse_manager">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Daily Reconciliation"
          description="Reconcile physical inventory with system records"
          breadcrumbs={[
            { label: 'Reconciliation', href: '/reconciliation' },
            { label: 'Daily' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Reconciliation
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-3xl font-bold">{filteredRecords.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Reconciled</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredRecords.filter(r => r.status === 'reconciled').length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Under Investigation</p>
            <p className="text-3xl font-bold text-orange-600">
              {filteredRecords.filter(r => r.status === 'investigation').length}
            </p>
          </div>
        </div>

        {/* Reconciliation Widgets */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRecords.map(record => {
            const product = mockProducts.find(p => p.id === record.productId);
            return (
              <ReconciliationWidget
                key={record.id}
                productName={product?.name || 'Unknown'}
                expected={record.expectedQuantity}
                actual={record.actualQuantity}
                unit={product?.unit || 'units'}
                variance={record.variance}
                variancePercentage={record.variancePercentage}
                status={record.status}
                notes={record.notes}
                reconciledBy={record.reconciledBy}
                reconciliationDate={record.reconciliationDate}
              />
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
