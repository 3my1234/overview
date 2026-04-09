'use client';

import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockStockMovements, mockWarehouses, mockProducts } from '@/lib/mock-data';
import { createPurchase, getMasterData, getPurchases } from '@/lib/api/client';
import { formatDate, formatCurrency, formatNumber, formatQuantity } from '@/lib/utils/formatting';
import { StockMovement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [purchases, setPurchases] = useState<StockMovement[]>(
    mockStockMovements.filter((movement) => movement.type === 'purchase')
  );
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [products, setProducts] = useState(mockProducts);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    unitCost: '',
    referenceDocument: '',
  });

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

  async function handleCreatePurchase() {
    if (!form.productId || !form.warehouseId || !form.quantity || !form.unitCost) return;

    setSubmitting(true);
    try {
      const created = await createPurchase({
        productId: form.productId,
        warehouseId: form.warehouseId,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        referenceDocument: form.referenceDocument || undefined,
      });

      setPurchases((prev) => [created, ...prev]);
      setForm({
        productId: '',
        warehouseId: '',
        quantity: '',
        unitCost: '',
        referenceDocument: '',
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record Purchase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Warehouse</Label>
                    <Select
                      value={form.warehouseId || 'none'}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, warehouseId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select warehouse</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select
                      value={form.productId || 'none'}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, productId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select product</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={form.quantity}
                        onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitCost">Unit Cost</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        min="0"
                        value={form.unitCost}
                        onChange={(event) => setForm((prev) => ({ ...prev, unitCost: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referenceDocument">Reference (Optional)</Label>
                    <Input
                      id="referenceDocument"
                      value={form.referenceDocument}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, referenceDocument: event.target.value }))
                      }
                      placeholder="PO-2026-0001"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreatePurchase()} disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Purchase'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
  );
}

