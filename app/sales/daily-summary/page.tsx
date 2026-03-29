'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import { mockSalesTransactions, mockDashboardMetrics } from '@/lib/mock-data';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { TrendingUp, Zap, Package, Target } from 'lucide-react';

export default function DailySalesPage() {
  const metrics = mockDashboardMetrics;
  const totalMargin = mockSalesTransactions.reduce((sum, t) => sum + t.grossMargin, 0);
  const totalTransactions = mockSalesTransactions.length;

  const kpiCards = [
    {
      title: 'Total Sales Amount',
      value: formatCurrency(metrics.totalSales.amount),
      trend: metrics.totalSales.trend,
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Today',
    },
    {
      title: 'Total Quantity Sold',
      value: formatNumber(metrics.totalSales.quantity),
      unit: 'units',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Gross Margin',
      value: formatCurrency(totalMargin),
      icon: <Zap className="h-5 w-5" />,
    },
    {
      title: 'Transactions',
      value: totalTransactions,
      unit: 'today',
      icon: <Target className="h-5 w-5" />,
    },
  ];

  const salesByTransaction = mockSalesTransactions.map(t => ({
    transaction: t.transactionNumber,
    amount: t.totalAmount,
    quantity: t.totalQuantity,
    margin: t.grossMargin,
    marginPercent: t.marginPercentage,
  }));

  return (
    <AppShell userRole="sales_manager">
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Daily Sales Summary"
          description="Overview of sales performance for today"
          breadcrumbs={[
            { label: 'Sales', href: '/sales' },
            { label: 'Daily Summary' },
          ]}
        />

        {/* KPI Cards */}
        <SummaryCardsRow cards={kpiCards} />

        {/* Transactions Breakdown */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Sales by Transaction</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Transaction</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 text-right font-semibold">Qty</th>
                  <th className="px-6 py-3 text-right font-semibold">Margin</th>
                  <th className="px-6 py-3 text-right font-semibold">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {salesByTransaction.map((sale, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="px-6 py-3">{sale.transaction}</td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="px-6 py-3 text-right">{formatNumber(sale.quantity)}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(sale.margin)}</td>
                    <td className="px-6 py-3 text-right">{sale.marginPercent.toFixed(2)}%</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-primary bg-primary/5">
                  <td className="px-6 py-3 font-bold">Total</td>
                  <td className="px-6 py-3 text-right font-bold">
                    {formatCurrency(metrics.totalSales.amount)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold">
                    {formatNumber(metrics.totalSales.quantity)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold">
                    {formatCurrency(totalMargin)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold">
                    {((totalMargin / metrics.totalSales.amount) * 100).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
