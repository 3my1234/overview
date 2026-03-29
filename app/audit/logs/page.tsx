'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import { mockAuditLogs } from '@/lib/mock-data';
import { formatDate, formatTime, timeAgo } from '@/lib/utils/formatting';
import { AuditLog } from '@/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Entity Type',
      placeholder: 'All Types',
      key: 'entityType',
      options: [
        { id: 'SalesTransaction', label: 'Sales Transaction', value: 'SalesTransaction' },
        { id: 'JournalEntry', label: 'Journal Entry', value: 'JournalEntry' },
        { id: 'StockMovement', label: 'Stock Movement', value: 'StockMovement' },
      ],
    },
    {
      type: 'select',
      label: 'Action',
      placeholder: 'All Actions',
      key: 'action',
      options: [
        { id: 'CREATE', label: 'Create', value: 'CREATE' },
        { id: 'UPDATE', label: 'Update', value: 'UPDATE' },
        { id: 'DELETE', label: 'Delete', value: 'DELETE' },
        { id: 'APPROVE', label: 'Approve', value: 'APPROVE' },
      ],
    },
    {
      type: 'date-range',
      label: 'From Date',
      key: 'fromDate',
    },
  ];

  // Filtered data
  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch =
      !searchTerm ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filters.entityType || log.entityType === filters.entityType;
    const matchesAction = !filters.action || log.action === filters.action;

    return matchesSearch && matchesType && matchesAction;
  });

  // Table columns
  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value) => formatTime(value),
    },
    {
      key: 'userEmail',
      label: 'User',
      sortable: true,
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity Type',
    },
    {
      key: 'entityId',
      label: 'Entity ID',
      sortable: true,
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => value || 'N/A',
    },
  ];

  return (
    <AppShell userRole="auditor">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Audit Logs"
          description="System activity and user action tracking"
          breadcrumbs={[
            { label: 'Audit', href: '/audit' },
            { label: 'Logs' },
          ]}
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Audit Logs Table */}
        <DataTable<AuditLog>
          columns={columns}
          data={filteredLogs}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        {/* Activity Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 text-lg">Activity Summary</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Logs</p>
              <p className="text-2xl font-bold">{filteredLogs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Creates</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter(l => l.action === 'CREATE').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Updates</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter(l => l.action === 'UPDATE').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Approvals</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter(l => l.action === 'APPROVE').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
