'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import { mockOperationalMetrics, mockProducts, mockWarehouses } from '@/lib/mock-data';
import { formatCurrency, formatNumber, formatQuantity, formatPercentage } from '@/lib/utils/formatting';
import { Package, TrendingUp, Zap, Target } from 'lucide-react';

export default function OperationalReportsPage() {
  const metrics = mockOperationalMetrics;

  const kpiCards = [
    {
      title: 'Total Stock Value',
      value: formatCurrency(metrics.totalStockValue),
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Stock Quantity',
      value: formatNumber(metrics.totalStockQuantity),
      unit: 'units',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: 'Sales Amount',
      value: formatCurrency(metrics.totalSalesAmount),
      icon: <Zap className="h-5 w-5" />,
    },
    {
      title: 'Stock Turnover',
      value: metrics.stockTuroverRate.toFixed(2),
      unit: 'times',
      icon: <Target className="h-5 w-5" />,
    },
  ];

  return (
    <AppShell userRole="ceo">
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Operational Reports"
          description="Inventory and operational performance metrics"
          breadcrumbs={[
            { label: 'Reports', href: '/reports' },
            { label: 'Operational' },
          ]}
        />

        {/* KPI Cards */}
        <SummaryCardsRow cards={kpiCards} />

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Cost of Goods</p>
            <p className="text-3xl font-bold">{formatCurrency(metrics.costOfGoods)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Gross Margin</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(metrics.grossMargin)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Margin %</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatPercentage(metrics.marginPercentage)}
            </p>
          </div>
        </div>

        {/* Product Inventory Levels */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Product Inventory Levels</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-6 py-3 text-right font-semibold">Stock Quantity</th>
                  <th className="px-6 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Stock Value</th>
                  <th className="px-6 py-3 text-center font-semibold">Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {mockProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`${index % 2 === 0 ? 'bg-muted/20' : ''} ${
                      product.currentStock < product.reorderLevel ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-3 font-medium">{product.name}</td>
                    <td className="px-6 py-3 text-right">
                      {formatQuantity(product.currentStock, product.unit)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {formatCurrency(product.unitPrice)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(product.currentStock * product.unitPrice)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {product.currentStock < product.reorderLevel ? (
                        <span className="text-red-600 font-bold">⚠ Low</span>
                      ) : (
                        '✓ OK'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warehouse Capacity */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Warehouse Capacity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mockWarehouses.map(warehouse => (
              <div key={warehouse.id} className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">{warehouse.name}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">
                        {formatQuantity(warehouse.capacity, 'litres')}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Manager: {warehouse.manager}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
