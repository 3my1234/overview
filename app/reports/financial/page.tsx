'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import { mockDashboardMetrics, mockOperationalMetrics, mockTrialBalance } from '@/lib/mock-data';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

export default function FinancialReportsPage() {
  const [reportType, setReportType] = useState<'income' | 'balance' | 'cash' | 'operational'>('income');
  const metrics = mockOperationalMetrics;
  const totalAssets = mockTrialBalance.filter(a => a.accountType === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = mockTrialBalance.filter(a => a.accountType === 'liability').reduce((sum, a) => sum + a.credit, 0);
  const totalEquity = mockTrialBalance.filter(a => a.accountType === 'equity').reduce((sum, a) => sum + a.credit, 0);

  const incomeStatementData = [
    { label: 'Sales Revenue', amount: mockDashboardMetrics.totalSales.amount },
    { label: 'Cost of Goods Sold', amount: -metrics.costOfGoods },
    { label: 'Gross Profit', amount: metrics.grossMargin, highlight: true },
    { label: 'Operating Expenses', amount: -60000 },
    { label: 'Net Income', amount: metrics.grossMargin - 60000, highlight: true },
  ];

  const operationalMetricsData = [
    { label: 'Total Stock Quantity', value: metrics.totalStockQuantity, unit: 'units' },
    { label: 'Total Stock Value', value: metrics.totalStockValue, unit: 'MYR' },
    { label: 'Total Sales Quantity', value: metrics.totalSalesQuantity, unit: 'units' },
    { label: 'Total Sales Amount', value: metrics.totalSalesAmount, unit: 'MYR' },
    { label: 'Stock Turnover Rate', value: metrics.stockTuroverRate, unit: 'times' },
    { label: 'Gross Margin %', value: metrics.marginPercentage, unit: '%' },
  ];

  return (
    <AppShell userRole="accountant">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Financial Reports"
          description="Comprehensive financial statements and analysis"
          breadcrumbs={[
            { label: 'Reports', href: '/reports' },
            { label: 'Financial' },
          ]}
          actions={
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          }
          tabs={[
            { label: 'Income Statement', value: 'income' },
            { label: 'Balance Sheet', value: 'balance' },
            { label: 'Operational Metrics', value: 'operational' },
          ]}
          activeTab={reportType}
          onTabChange={(tab) => setReportType(tab as any)}
        />

        {reportType === 'income' && (
          <div className="space-y-6">
            {/* Income Statement */}
            <div className="rounded-lg border border-border bg-card p-8">
              <h2 className="text-center text-2xl font-bold mb-2">Income Statement</h2>
              <p className="text-center text-sm text-muted-foreground mb-8">
                For the period ending {formatDate(new Date(), 'long')}
              </p>

              <div className="max-w-2xl mx-auto space-y-4">
                {incomeStatementData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between py-2 ${
                      item.highlight ? 'border-t-2 border-b-2 border-primary font-bold' : ''
                    }`}
                  >
                    <span className={item.highlight ? 'text-lg' : ''}>
                      {item.label}
                    </span>
                    <span className={`${item.highlight ? 'text-lg' : ''} font-semibold`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Gross Profit Margin</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatPercentage(metrics.marginPercentage)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Net Profit Margin</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatPercentage(((metrics.grossMargin - 60000) / metrics.totalSalesAmount) * 100)}
                </p>
              </div>
            </div>
          </div>
        )}

        {reportType === 'balance' && (
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="text-center text-2xl font-bold mb-2">Balance Sheet</h2>
            <p className="text-center text-sm text-muted-foreground mb-8">
              As of {formatDate(new Date(), 'long')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Assets */}
              <div>
                <h3 className="font-bold text-lg mb-4">Assets</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Assets</span>
                    <span className="font-semibold">{formatCurrency(totalAssets * 0.6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fixed Assets</span>
                    <span className="font-semibold">{formatCurrency(totalAssets * 0.4)}</span>
                  </div>
                </div>
                <div className="border-t-2 border-b-2 border-primary py-2 flex justify-between font-bold">
                  <span>Total Assets</span>
                  <span>{formatCurrency(totalAssets)}</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <h3 className="font-bold text-lg mb-4">Liabilities & Equity</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Liabilities</span>
                    <span className="font-semibold">{formatCurrency(totalLiabilities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equity</span>
                    <span className="font-semibold">{formatCurrency(totalEquity)}</span>
                  </div>
                </div>
                <div className="border-t-2 border-b-2 border-primary py-2 flex justify-between font-bold">
                  <span>Total Liab. & Equity</span>
                  <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'operational' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operationalMetricsData.map((metric, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-primary">
                  {metric.unit === 'MYR' ? formatCurrency(metric.value) : formatNumber(metric.value)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{metric.unit}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
