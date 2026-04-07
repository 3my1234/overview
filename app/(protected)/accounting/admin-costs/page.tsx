'use client';

import { useEffect, useState } from 'react';

import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import { AdminCostSummary, createAdminCost, getAdminCostSummaries } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/formatting';
import { Briefcase, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminCostsPage() {
  const [adminExpenses, setAdminExpenses] = useState<AdminCostSummary[]>([]);
  const [form, setForm] = useState({
    code: '',
    description: '',
    amount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminCosts() {
      const payload = await getAdminCostSummaries();
      if (!isMounted) return;
      setAdminExpenses(payload);
    }

    void loadAdminCosts();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handlePostCost() {
    if (!form.code || !form.description || !form.amount) return;

    setSubmitting(true);
    try {
      const updated = await createAdminCost({
        code: form.code,
        description: form.description,
        amount: Number(form.amount),
      });

      setAdminExpenses((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setForm({ code: '', description: '', amount: '' });
    } finally {
      setSubmitting(false);
    }
  }

  const totalAdminCosts = adminExpenses.reduce((sum, a) => sum + a.totalAmount, 0);
  const avgCost = totalAdminCosts / Math.max(adminExpenses.length, 1);

  const kpiCards = [
    {
      title: 'Total Admin Costs',
      value: formatCurrency(totalAdminCosts),
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: 'Average Cost per Category',
      value: formatCurrency(avgCost),
      icon: <TrendingDown className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="Administrative Costs"
          description="Tracking administrative and operating expenses"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Admin Costs' },
          ]}
        />

        <SummaryCardsRow cards={kpiCards} />

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Post Administrative Cost</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Expense Code</Label>
              <Select
                value={form.code || 'none'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, code: value === 'none' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select code</SelectItem>
                  {adminExpenses.map((item) => (
                    <SelectItem key={item.id} value={item.code}>
                      {item.code} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="e.g. April transport support"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => void handlePostCost()} disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Cost'}
            </Button>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-6">Cost Categories</h2>
          <div className="space-y-4">
            {adminExpenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-semibold">{expense.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {expense.code}</p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(expense.totalAmount)}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t-2 border-primary flex justify-between">
            <span className="font-bold text-lg">Total Administrative Costs</span>
            <span className="text-2xl font-bold text-red-600">
              {formatCurrency(totalAdminCosts)}
            </span>
          </div>
        </div>
      </div>
  );
}

