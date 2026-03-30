'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import StatusBadge from '@/components/badges/status-badge';
import LoadingSkeleton from '@/components/states/loading-skeleton';
import { mockDashboardMetrics, mockSalesTransactions } from '@/lib/mock-data';
import { getCeoDashboardData } from '@/lib/api/client';
import { formatCurrency, formatNumber, formatDate, formatQuantity } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/button';
import { SalesTransaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Zap,
  AlertTriangle,
} from 'lucide-react';

export default function CEODashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(mockDashboardMetrics);
  const [salesData, setSalesData] = useState(mockSalesTransactions);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const payload = await getCeoDashboardData();
      if (!isMounted) return;

      setMetrics(payload.metrics);
      setSalesData(payload.salesTransactions);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // KPI Cards Config
  const kpiCards = [
    {
      title: 'Total Stock Value',
      value: formatCurrency(metrics.totalStock.value),
      unit: 'MYR',
      trend: metrics.totalStock.trend,
      icon: <Package className="h-5 w-5" />,
      description: 'Current inventory',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(metrics.totalSales.amount),
      unit: 'MYR',
      trend: metrics.totalSales.trend,
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'This period',
    },
    {
      title: 'Pending Approvals',
      value: metrics.pendingApprovals,
      unit: 'items',
      icon: <AlertTriangle className="h-5 w-5" />,
      highlight: metrics.pendingApprovals > 0,
    },
    {
      title: 'Stock Variance',
      value: formatCurrency(Math.abs(metrics.reconciliationVariance.amount)),
      unit: 'MYR',
      trend: metrics.reconciliationVariance.percentage,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  // Sales Transactions Table
  const salesColumns: DataTableColumn<SalesTransaction>[] = [
    {
      key: 'transactionNumber',
      label: 'Transaction',
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
      label: 'Quantity',
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

  if (loading) {
    return (
      <AppShell userRole="ceo">
        <LoadingSkeleton rows={5} columns={4} type="table" />
      </AppShell>
    );
  }

  return (
    <AppShell userRole="ceo">
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Executive Dashboard"
          description="Overview of palm oil operations across all warehouses and branches"
          actions={
            <Button variant="default">
              Generate Report
            </Button>
          }
        />

        {/* KPI Summary */}
        <SummaryCardsRow cards={kpiCards} />

        {/* Top Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Top Products</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {metrics.topProducts.map(product => (
              <div key={product.id} className="rounded-lg border border-border bg-card p-4">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">
                      {formatQuantity(product.currentStock, product.unit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">{formatCurrency(product.unitPrice)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Stock Value</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(product.currentStock * product.unitPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales Transactions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Sales Transactions</h2>
          <DataTable<SalesTransaction>
            columns={salesColumns}
            data={salesData}
            pageSize={5}
            showExport={true}
            hover={true}
            striped={true}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-24">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Reports</span>
            </div>
          </Button>
          <Button variant="outline" className="h-24">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Pending Approvals</span>
            </div>
          </Button>
          <Button variant="outline" className="h-24">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-6 w-6" />
              <span>Inventory Status</span>
            </div>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
