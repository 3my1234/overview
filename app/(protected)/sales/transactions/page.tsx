'use client';

import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockSalesTransactions, mockWarehouses, mockBranches } from '@/lib/mock-data';
import { createSalesTransaction, getMasterData, getProducts, getSalesTransactions } from '@/lib/api/client';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { Product, SalesTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalesTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>(mockSalesTransactions);
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [branches, setBranches] = useState(mockBranches);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    warehouseId: '',
    branchId: '',
    productId: '',
    quantity: '',
    unitPrice: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [salesData, masterData, productsData] = await Promise.all([
        getSalesTransactions(),
        getMasterData(),
        getProducts(),
      ]);
      if (!isMounted) return;
      setSalesTransactions(salesData);
      setWarehouses(masterData.warehouses);
      setBranches(masterData.branches);
      setProducts(productsData);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateSale() {
    if (!form.customerName || !form.warehouseId || !form.branchId || !form.productId || !form.quantity) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSalesTransaction({
        customerName: form.customerName,
        warehouseId: form.warehouseId,
        branchId: form.branchId,
        status: 'posted',
        items: [
          {
            productId: form.productId,
            quantity: Number(form.quantity),
            unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
          },
        ],
      });

      setSalesTransactions((prev) => [created, ...prev]);
      setForm({
        customerName: '',
        warehouseId: '',
        branchId: '',
        productId: '',
        quantity: '',
        unitPrice: '',
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
      label: 'Branch',
      placeholder: 'All Branches',
      key: 'branchId',
      options: branches.map(b => ({
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
  const filteredTransactions = salesTransactions.filter(transaction => {
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record Branch Sale</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={form.customerName}
                      onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <Label>Branch</Label>
                      <Select
                        value={form.branchId || 'none'}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select branch</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Label htmlFor="unitPrice">Unit Price (Optional)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        value={form.unitPrice}
                        onChange={(event) => setForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreateSale()} disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Sale'}
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
  );
}

