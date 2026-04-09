'use client';

import { useEffect, useState } from 'react';

import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import { AssetRecord, createAsset, getAssets } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

export default function PPELedgerPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    assetCode: '',
    name: '',
    category: '',
    acquiredDate: '',
    acquisitionCost: '',
    usefulLifeYears: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      const payload = await getAssets();
      if (!isMounted) return;
      setAssets(payload);
    }

    void loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateAsset() {
    if (!form.assetCode || !form.name || !form.category || !form.acquisitionCost || !form.usefulLifeYears) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAsset({
        assetCode: form.assetCode,
        name: form.name,
        category: form.category,
        acquiredDate: form.acquiredDate || undefined,
        acquisitionCost: Number(form.acquisitionCost),
        usefulLifeYears: Number(form.usefulLifeYears),
      });

      setAssets((prev) => [created, ...prev]);
      setForm({
        assetCode: '',
        name: '',
        category: '',
        acquiredDate: '',
        acquisitionCost: '',
        usefulLifeYears: '',
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<AssetRecord>[] = [
    { key: 'assetCode', label: 'Asset Code', sortable: true },
    { key: 'name', label: 'Asset Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'acquiredDate',
      label: 'Acquired Date',
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'acquisitionCost',
      label: 'Cost',
      align: 'right',
      render: (value) => formatCurrency(value, 'NGN'),
    },
    {
      key: 'usefulLifeYears',
      label: 'Useful Life (Years)',
      align: 'right',
    },
    { key: 'status', label: 'Status' },
  ];

  const totalAssets = assets.reduce((sum, item) => sum + item.acquisitionCost, 0);

  return (
    <div className="space-y-6">
        <PageHeader
          title="PPE Ledger"
          description="Property, Plant and Equipment register with accounting linkage"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Ledgers' },
            { label: 'PPE' },
          ]}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add PPE Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="assetCode">Asset Code</Label>
                      <Input
                        id="assetCode"
                        value={form.assetCode}
                        onChange={(event) => setForm((prev) => ({ ...prev, assetCode: event.target.value }))}
                        placeholder="PPE-003"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={form.category}
                        onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                        placeholder="machine / building / vehicle"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Asset Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="acquiredDate">Acquired Date</Label>
                      <Input
                        id="acquiredDate"
                        type="date"
                        value={form.acquiredDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, acquiredDate: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
                      <Input
                        id="acquisitionCost"
                        type="number"
                        min="0"
                        value={form.acquisitionCost}
                        onChange={(event) => setForm((prev) => ({ ...prev, acquisitionCost: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usefulLifeYears">Useful Life (Years)</Label>
                      <Input
                        id="usefulLifeYears"
                        type="number"
                        min="1"
                        value={form.usefulLifeYears}
                        onChange={(event) => setForm((prev) => ({ ...prev, usefulLifeYears: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreateAsset()} disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Asset'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <DataTable<AssetRecord>
          columns={columns}
          data={assets}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total PPE Acquisition Cost</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalAssets, 'NGN')}</p>
        </div>
      </div>
  );
}

