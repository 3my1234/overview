'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProduction, getMasterData, getProductionRecords } from '@/lib/api/client';
import { mockProducts, mockStockMovements, mockWarehouses } from '@/lib/mock-data';
import { Product, StockMovement } from '@/lib/types';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/utils/formatting';

export default function ProductionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [records, setRecords] = useState<StockMovement[]>(
    mockStockMovements.filter((movement) => movement.type === 'production')
  );
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    warehouseId: '',
    outputProductId: 'prod_fg_1l',
    outputQuantity: '',
    overheadCost: '',
    referenceDocument: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [productionData, masterData] = await Promise.all([getProductionRecords(), getMasterData()]);
      if (!isMounted) return;
      setRecords(productionData);
      setWarehouses(masterData.warehouses);
      setProducts(masterData.products);
      setForm((prev) => ({
        ...prev,
        warehouseId: prev.warehouseId || masterData.warehouses[0]?.id || '',
      }));
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const outputProducts = useMemo(() => {
    return products.filter((product) => product.id === 'prod_fg_1l' || /bottled|finished/i.test(product.name));
  }, [products]);

  async function handleCreateProduction() {
    if (!form.warehouseId || !form.outputProductId || !form.outputQuantity) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createProduction({
        warehouseId: form.warehouseId,
        outputProductId: form.outputProductId,
        outputQuantity: Number(form.outputQuantity),
        overheadCost: form.overheadCost ? Number(form.overheadCost) : undefined,
        referenceDocument: form.referenceDocument || undefined,
      });

      setRecords((prev) => [created, ...prev]);
      setForm({
        warehouseId: form.warehouseId,
        outputProductId: form.outputProductId,
        outputQuantity: '',
        overheadCost: '',
        referenceDocument: '',
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Warehouse',
      placeholder: 'All Warehouses',
      key: 'warehouseId',
      options: warehouses.map((warehouse) => ({
        id: warehouse.id,
        label: warehouse.name,
        value: warehouse.id,
      })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [{ id: 'posted', label: 'Posted', value: 'posted' }],
    },
  ];

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchTerm || record.referenceDocument.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = !filters.warehouseId || record.warehouseId === filters.warehouseId;
    const matchesStatus = !filters.status || record.status === filters.status;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: 'referenceDocument',
      label: 'Production Ref',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (value) => warehouses.find((warehouse) => warehouse.id === value)?.name || value,
    },
    {
      key: 'productId',
      label: 'Finished Product',
      render: (value) => products.find((product) => product.id === value)?.name || value,
    },
    {
      key: 'quantity',
      label: 'Qty Produced',
      align: 'right',
      render: (value, row) => formatQuantity(value, row.unit),
    },
    {
      key: 'cost',
      label: 'Production Cost',
      align: 'right',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="Production (BOM)"
          description="Convert bulk oil + bottles + caps into finished goods with automatic cost posting."
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Production' },
          ]}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Production
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Post Production Batch</DialogTitle>
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
                    <Label>Output Product</Label>
                    <Select
                      value={form.outputProductId || 'none'}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, outputProductId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select finished product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select finished product</SelectItem>
                        {outputProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="outputQuantity">Output Quantity</Label>
                      <Input
                        id="outputQuantity"
                        type="number"
                        min="0"
                        value={form.outputQuantity}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, outputQuantity: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overheadCost">Overhead Cost (Optional)</Label>
                      <Input
                        id="overheadCost"
                        type="number"
                        min="0"
                        value={form.overheadCost}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, overheadCost: event.target.value }))
                        }
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
                      placeholder="e.g. PRD-2026-004"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreateProduction()} disabled={submitting}>
                      {submitting ? 'Posting...' : 'Post Production'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <FilterBar filters={filterConfigs} onFiltersChange={setFilters} onSearch={setSearchTerm} />

        <DataTable<StockMovement>
          columns={columns}
          data={filteredRecords}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
  );
}

