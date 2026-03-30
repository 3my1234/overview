'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockStockMovements, mockWarehouses, mockProducts } from '@/lib/mock-data';
import { getMasterData, getPurchases } from '@/lib/api/client';
import { formatDate, formatCurrency, formatNumber, formatQuantity } from '@/lib/utils/formatting';
import { StockMovement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [purchases, setPurchases] = useState<StockMovement[]>(
    mockStockMovements.filter((movement) => movement.type === 'purchase')
  );
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [products, setProducts] = useState(mockProducts);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [purchasesData, masterData] = await Promise.all([getPurchases(), getMasterData()]);
      if (!isMounted) return;

      setPurchases(purchasesData);
      setWarehouses(masterData.warehouses);
      setProducts(masterData.products);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Warehouse',
      placeholder: 'All Warehouses',
      key: 'warehouseId',
      options: warehouses.map(w => ({
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
        { id: 'posted', label: 'Posted', value: 'posted' },
      ],
    },
  ];

  // Filtered data
  const filteredPurchases = purchases.filter(movement => {
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
      label: 'PO #',
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
      render: (value) => products.find(p => p.id === value)?.name || value,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value, row) => formatQuantity(value, row.unit),
      align: 'right',
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (value) => formatCurrency(value || 0),
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
          title="Purchases"
          description="Purchase orders and inbound goods"
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Purchases' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Purchases Table */}
        <DataTable<StockMovement>
          columns={columns}
          data={filteredPurchases}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
