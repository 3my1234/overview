'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Plus } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createTransfer,
  getMasterData,
  getTransfers,
  receiveTransfer,
  TransferLineRecord,
  TransferRecord,
} from '@/lib/api/client';
import { mockBranches, mockProducts, mockWarehouses } from '@/lib/mock-data';
import { Branch, Product, Warehouse } from '@/lib/types';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/formatting';

type ReceiveQuantities = Record<string, string>;

function sumSent(lines: TransferLineRecord[]) {
  return lines.reduce((sum, line) => sum + line.quantitySent, 0);
}

function sumReceived(lines: TransferLineRecord[]) {
  return lines.reduce((sum, line) => sum + line.quantityReceived, 0);
}

function sumVariance(lines: TransferLineRecord[]) {
  return lines.reduce((sum, line) => sum + line.varianceQuantity, 0);
}

export default function TransfersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState('');
  const [receiveQuantities, setReceiveQuantities] = useState<ReceiveQuantities>({});

  const [createForm, setCreateForm] = useState({
    fromWarehouseId: '',
    toBranchId: '',
    productId: '',
    quantity: '',
    unitCost: '',
    notes: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [transferData, masterData] = await Promise.all([getTransfers(), getMasterData()]);
      if (!isMounted) return;
      setTransfers(transferData);
      setWarehouses(masterData.warehouses);
      setBranches(masterData.branches);
      setProducts(masterData.products);
      setCreateForm((prev) => ({
        ...prev,
        fromWarehouseId: prev.fromWarehouseId || masterData.warehouses[0]?.id || '',
        toBranchId: prev.toBranchId || masterData.branches[0]?.id || '',
      }));
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectableTransfers = useMemo(
    () => transfers.filter((transfer) => transfer.status === 'in_transit'),
    [transfers]
  );

  const selectedTransfer = useMemo(
    () => transfers.find((transfer) => transfer.id === selectedTransferId) || null,
    [transfers, selectedTransferId]
  );

  useEffect(() => {
    if (!selectedTransfer) return;
    const defaults: ReceiveQuantities = {};
    for (const line of selectedTransfer.lines) {
      defaults[line.id] = String(line.quantitySent);
    }
    setReceiveQuantities(defaults);
  }, [selectedTransfer]);

  async function handleCreateTransfer() {
    if (!createForm.fromWarehouseId || !createForm.toBranchId || !createForm.productId || !createForm.quantity) {
      return;
    }

    setSubmittingCreate(true);
    try {
      const created = await createTransfer({
        fromWarehouseId: createForm.fromWarehouseId,
        toBranchId: createForm.toBranchId,
        notes: createForm.notes || undefined,
        lines: [
          {
            productId: createForm.productId,
            quantity: Number(createForm.quantity),
            unitCost: createForm.unitCost ? Number(createForm.unitCost) : undefined,
          },
        ],
      });

      setTransfers((prev) => [created, ...prev]);
      setCreateForm((prev) => ({
        ...prev,
        productId: '',
        quantity: '',
        unitCost: '',
        notes: '',
      }));
      setCreateOpen(false);
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleReceiveTransfer() {
    if (!selectedTransfer) return;

    setSubmittingReceive(true);
    try {
      const payloadLines = selectedTransfer.lines.map((line) => ({
        lineId: line.id,
        quantityReceived: Number(receiveQuantities[line.id] || 0),
      }));

      const received = await receiveTransfer({
        transferId: selectedTransfer.id,
        lines: payloadLines,
      });

      setTransfers((prev) => prev.map((item) => (item.id === received.id ? received : item)));
      setReceiveOpen(false);
      setSelectedTransferId('');
      setReceiveQuantities({});
    } finally {
      setSubmittingReceive(false);
    }
  }

  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'From Warehouse',
      placeholder: 'All Warehouses',
      key: 'fromWarehouseId',
      options: warehouses.map((warehouse) => ({
        id: warehouse.id,
        label: warehouse.name,
        value: warehouse.id,
      })),
    },
    {
      type: 'select',
      label: 'To Branch',
      placeholder: 'All Branches',
      key: 'toBranchId',
      options: branches.map((branch) => ({
        id: branch.id,
        label: branch.name,
        value: branch.id,
      })),
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'in_transit', label: 'In Transit', value: 'in_transit' },
        { id: 'received', label: 'Received', value: 'received' },
        { id: 'variance', label: 'Variance', value: 'variance' },
      ],
    },
  ];

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      !searchTerm || transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFromWarehouse =
      !filters.fromWarehouseId || transfer.fromWarehouseId === filters.fromWarehouseId;
    const matchesToBranch = !filters.toBranchId || transfer.toBranchId === filters.toBranchId;
    const matchesStatus = !filters.status || transfer.status === filters.status;

    return matchesSearch && matchesFromWarehouse && matchesToBranch && matchesStatus;
  });

  const columns: DataTableColumn<TransferRecord>[] = [
    {
      key: 'transferNumber',
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
      key: 'fromWarehouseId',
      label: 'From Warehouse',
      render: (value) => warehouses.find((warehouse) => warehouse.id === value)?.name || value,
    },
    {
      key: 'toBranchId',
      label: 'To Branch',
      render: (value) => branches.find((branch) => branch.id === value)?.name || value,
    },
    {
      key: 'lines',
      label: 'Qty Sent',
      align: 'right',
      render: (_, row) => formatNumber(sumSent(row.lines)),
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
          title="Stock Transfers"
          description="Warehouse to branch transfer notes with receive and variance capture."
          breadcrumbs={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Transfers' },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Receive Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Receive and Reconcile Transfer</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transfer Note</Label>
                      <Select
                        value={selectedTransferId || 'none'}
                        onValueChange={(value) => setSelectedTransferId(value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select in-transit transfer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select transfer</SelectItem>
                          {selectableTransfers.map((transfer) => (
                            <SelectItem key={transfer.id} value={transfer.id}>
                              {transfer.transferNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTransfer && (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-right">Sent</TableHead>
                              <TableHead className="text-right">Received</TableHead>
                              <TableHead className="text-right">Unit Cost</TableHead>
                              <TableHead className="text-right">Expected Variance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTransfer.lines.map((line) => {
                              const received = Number(receiveQuantities[line.id] || 0);
                              const variance = line.quantitySent - received;
                              const productName =
                                products.find((product) => product.id === line.productId)?.name || line.productId;

                              return (
                                <TableRow key={line.id}>
                                  <TableCell>{productName}</TableCell>
                                  <TableCell className="text-right">{formatNumber(line.quantitySent)}</TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={line.quantitySent}
                                      value={receiveQuantities[line.id] ?? ''}
                                      onChange={(event) =>
                                        setReceiveQuantities((prev) => ({
                                          ...prev,
                                          [line.id]: event.target.value,
                                        }))
                                      }
                                      className="ml-auto w-28"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(variance)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReceiveOpen(false);
                          setSelectedTransferId('');
                        }}
                        disabled={submittingReceive}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleReceiveTransfer()}
                        disabled={submittingReceive || !selectedTransfer}
                      >
                        {submittingReceive ? 'Posting...' : 'Post Receipt'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Transfer Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>From Warehouse</Label>
                        <Select
                          value={createForm.fromWarehouseId || 'none'}
                          onValueChange={(value) =>
                            setCreateForm((prev) => ({ ...prev, fromWarehouseId: value === 'none' ? '' : value }))
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
                        <Label>To Branch</Label>
                        <Select
                          value={createForm.toBranchId || 'none'}
                          onValueChange={(value) =>
                            setCreateForm((prev) => ({ ...prev, toBranchId: value === 'none' ? '' : value }))
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
                        value={createForm.productId || 'none'}
                        onValueChange={(value) =>
                          setCreateForm((prev) => ({ ...prev, productId: value === 'none' ? '' : value }))
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
                        <Label htmlFor="transferQuantity">Quantity Sent</Label>
                        <Input
                          id="transferQuantity"
                          type="number"
                          min="0"
                          value={createForm.quantity}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, quantity: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transferUnitCost">Unit Cost (Optional)</Label>
                        <Input
                          id="transferUnitCost"
                          type="number"
                          min="0"
                          value={createForm.unitCost}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, unitCost: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transferNotes">Notes (Optional)</Label>
                      <Input
                        id="transferNotes"
                        value={createForm.notes}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="e.g. Morning dispatch to Ikeja shop"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submittingCreate}>
                        Cancel
                      </Button>
                      <Button onClick={() => void handleCreateTransfer()} disabled={submittingCreate}>
                        {submittingCreate ? 'Saving...' : 'Create Transfer'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <FilterBar filters={filterConfigs} onFiltersChange={setFilters} onSearch={setSearchTerm} />

        <DataTable<TransferRecord>
          columns={columns}
          data={filteredTransfers}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Transfer Reconciliation Snapshot</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Sent</p>
              <p className="text-lg font-semibold">
                {formatNumber(transfers.reduce((sum, transfer) => sum + sumSent(transfer.lines), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Received</p>
              <p className="text-lg font-semibold">
                {formatNumber(transfers.reduce((sum, transfer) => sum + sumReceived(transfer.lines), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Variance</p>
              <p className="text-lg font-semibold text-red-600">
                {formatNumber(transfers.reduce((sum, transfer) => sum + sumVariance(transfer.lines), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}

