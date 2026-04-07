'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Package, TrendingUp, Zap } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import SummaryCardsRow from '@/components/cards/summary-cards-row';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import StatusBadge from '@/components/badges/status-badge';
import LoadingSkeleton from '@/components/states/loading-skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCeoDashboardData, DashboardAnalytics } from '@/lib/api/client';
import { mockDashboardMetrics, mockSalesTransactions } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatNumber, formatQuantity } from '@/lib/utils/formatting';
import { SalesTransaction } from '@/lib/types';

const colorPalette = ['#15803d', '#0284c7', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4', '#f97316'];

const emptyAnalytics: DashboardAnalytics = {
  salesTrend: [],
  revenueVsCogs: [],
  stockByLocation: [],
  transferVariance: [],
  leakageTrend: [],
  packagingEfficiency: [],
  productProfitability: [],
  pnlBridge: [],
  expenseBreakdown: [],
  assetBankTrend: [],
};

function ChartTitle({ title }: { title: string }) {
  return <CardTitle className="text-base">{title}</CardTitle>;
}

function EmptyChartState() {
  return <p className="text-sm text-muted-foreground">No data yet.</p>;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-NG', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export default function CEODashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(mockDashboardMetrics);
  const [salesData, setSalesData] = useState(mockSalesTransactions);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(emptyAnalytics);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const payload = await getCeoDashboardData();
      if (!isMounted) return;

      setMetrics(payload.metrics);
      setSalesData(payload.salesTransactions);
      setAnalytics(payload.analytics);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const kpiCards = [
    {
      title: 'Total Stock Value',
      value: formatCurrency(metrics.totalStock.value, 'NGN'),
      trend: metrics.totalStock.trend,
      icon: <Package className="h-5 w-5" />,
      description: 'Current inventory',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(metrics.totalSales.amount, 'NGN'),
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
      value: formatCurrency(Math.abs(metrics.reconciliationVariance.amount), 'NGN'),
      trend: metrics.reconciliationVariance.percentage,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  const salesColumns: DataTableColumn<SalesTransaction>[] = [
    { key: 'transactionNumber', label: 'Transaction', sortable: true },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    { key: 'customerName', label: 'Customer', sortable: true },
    {
      key: 'totalQuantity',
      label: 'Quantity',
      render: (value) => formatNumber(value),
      align: 'right',
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (value) => formatCurrency(value, 'NGN'),
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

  const pnlBridgeWithColor = useMemo(
    () => analytics.pnlBridge.map((step) => ({ ...step, color: step.value >= 0 ? '#15803d' : '#dc2626' })),
    [analytics.pnlBridge]
  );

  if (loading) {
    return (
      <LoadingSkeleton rows={5} columns={4} type="table" />
    );
  }

  return (
    <div className="space-y-8">
        <PageHeader
          title="Executive Dashboard"
          description="Live operations and finance analytics for the palm oil business"
          actions={<Button variant="default">Generate Report</Button>}
        />

        <SummaryCardsRow cards={kpiCards} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><ChartTitle title="Sales Trend" /></CardHeader>
            <CardContent>
              {analytics.salesTrend.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ sales: { label: 'Sales', color: '#15803d' }, quantity: { label: 'Qty', color: '#0284c7' } }}>
                  <LineChart data={analytics.salesTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="quantity" stroke="var(--color-quantity)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><ChartTitle title="Revenue vs COGS vs Gross Profit" /></CardHeader>
            <CardContent>
              {analytics.revenueVsCogs.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ revenue: { label: 'Revenue', color: '#0284c7' }, cogs: { label: 'COGS', color: '#f97316' }, grossProfit: { label: 'Gross Profit', color: '#15803d' } }}>
                  <ComposedChart data={analytics.revenueVsCogs}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cogs" fill="var(--color-cogs)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="grossProfit" stroke="var(--color-grossProfit)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><ChartTitle title="Stock Position by Category" /></CardHeader>
            <CardContent>
              {analytics.stockByLocation.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ warehouse: { label: 'Warehouse', color: '#15803d' }, branch: { label: 'Shop', color: '#0284c7' }, inTransit: { label: 'In Transit', color: '#f59e0b' } }}>
                  <BarChart data={analytics.stockByLocation}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="warehouse" stackId="stock" fill="var(--color-warehouse)" />
                    <Bar dataKey="branch" stackId="stock" fill="var(--color-branch)" />
                    <Bar dataKey="inTransit" stackId="stock" fill="var(--color-inTransit)" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><ChartTitle title="Transfer Variance (Sent vs Received)" /></CardHeader>
            <CardContent>
              {analytics.transferVariance.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ sent: { label: 'Sent', color: '#0284c7' }, received: { label: 'Received', color: '#15803d' }, variance: { label: 'Variance', color: '#dc2626' } }}>
                  <ComposedChart data={analytics.transferVariance}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="route" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sent" fill="var(--color-sent)" />
                    <Bar dataKey="received" fill="var(--color-received)" />
                    <Line dataKey="variance" stroke="var(--color-variance)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><ChartTitle title="Leakage/Spoilage Trend" /></CardHeader>
            <CardContent>
              {analytics.leakageTrend.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ quantityLost: { label: 'Qty Lost', color: '#ef4444' }, valueLost: { label: 'Value Lost', color: '#f97316' } }}>
                  <AreaChart data={analytics.leakageTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="quantityLost" stroke="var(--color-quantityLost)" fill="var(--color-quantityLost)" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="valueLost" stroke="var(--color-valueLost)" fill="var(--color-valueLost)" fillOpacity={0.1} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><ChartTitle title="Packaging Efficiency (Expected vs Actual)" /></CardHeader>
            <CardContent>
              {analytics.packagingEfficiency.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ expected: { label: 'Expected', color: '#0284c7' }, actual: { label: 'Actual', color: '#15803d' }, variance: { label: 'Variance', color: '#dc2626' } }}>
                  <ComposedChart data={analytics.packagingEfficiency}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="expected" fill="var(--color-expected)" />
                    <Bar dataKey="actual" fill="var(--color-actual)" />
                    <Line dataKey="variance" stroke="var(--color-variance)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><ChartTitle title="Product Profitability (Margin %)" /></CardHeader>
            <CardContent>
              {analytics.productProfitability.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[320px] w-full" config={{ marginPct: { label: 'Margin %', color: '#15803d' } }}>
                  <BarChart data={analytics.productProfitability} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <YAxis type="category" dataKey="product" width={120} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="marginPct" fill="var(--color-marginPct)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><ChartTitle title="Expense Breakdown" /></CardHeader>
            <CardContent>
              {analytics.expenseBreakdown.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[320px] w-full" config={{ amount: { label: 'Amount', color: '#0284c7' } }}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                    <Pie data={analytics.expenseBreakdown} dataKey="amount" nameKey="category" innerRadius={65} outerRadius={110} paddingAngle={2}>
                      {analytics.expenseBreakdown.map((entry, index) => (
                        <Cell key={entry.category} fill={colorPalette[index % colorPalette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><ChartTitle title="P&L Bridge" /></CardHeader>
            <CardContent>
              {pnlBridgeWithColor.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ value: { label: 'Value', color: '#15803d' } }}>
                  <BarChart data={pnlBridgeWithColor}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="step" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {pnlBridgeWithColor.map((step) => (
                        <Cell key={step.step} fill={step.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><ChartTitle title="Assets and Bank Trend" /></CardHeader>
            <CardContent>
              {analytics.assetBankTrend.length === 0 ? (
                <EmptyChartState />
              ) : (
                <ChartContainer className="h-[280px] w-full" config={{ assets: { label: 'Assets', color: '#7c3aed' }, bank: { label: 'Bank', color: '#0284c7' } }}>
                  <LineChart data={analytics.assetBankTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="assets" stroke="var(--color-assets)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="bank" stroke="var(--color-bank)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Top Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.topProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-border bg-card p-4">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{formatQuantity(product.currentStock, product.unit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">{formatCurrency(product.unitPrice, 'NGN')}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Stock Value</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(product.currentStock * product.unitPrice, 'NGN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>
  );
}

