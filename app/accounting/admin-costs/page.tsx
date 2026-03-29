'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import { mockAccounts } from '@/lib/mock-data';
import { formatCurrency, formatLabel } from '@/lib/utils/formatting';
import { Briefcase, TrendingDown } from 'lucide-react';

export default function AdminCostsPage() {
  // Administrative and operating expenses
  const adminExpenses = mockAccounts.filter(a => 
    a.type === 'expense' && (a.code === '5030' || a.code === '5020')
  );

  const totalAdminCosts = adminExpenses.reduce((sum, a) => sum + a.balance, 0);
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
    <AppShell userRole="accountant">
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
                  {formatCurrency(expense.balance)}
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
    </AppShell>
  );
}
