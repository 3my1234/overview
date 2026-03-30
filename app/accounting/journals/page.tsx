'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockJournalEntries } from '@/lib/mock-data';
import { getJournalEntries } from '@/lib/api/client';
import { formatDate, formatCurrency } from '@/lib/utils/formatting';
import { JournalEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function JournalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);

  useEffect(() => {
    let isMounted = true;

    async function loadJournals() {
      const payload = await getJournalEntries();
      if (!isMounted) return;
      setJournalEntries(payload);
    }

    void loadJournals();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'draft', label: 'Draft', value: 'draft' },
        { id: 'submitted', label: 'Submitted', value: 'submitted' },
        { id: 'approved', label: 'Approved', value: 'approved' },
        { id: 'posted', label: 'Posted', value: 'posted' },
      ],
    },
    {
      type: 'date-range',
      label: 'From Date',
      key: 'fromDate',
    },
  ];

  // Filtered data
  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch =
      !searchTerm ||
      entry.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filters.status || entry.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns: DataTableColumn<JournalEntry>[] = [
    {
      key: 'journalNumber',
      label: 'Journal #',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'totalDebit',
      label: 'Debit',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'totalCredit',
      label: 'Credit',
      render: (value) => formatCurrency(value),
      align: 'right',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'id',
      label: 'Action',
      render: () => (
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell userRole="accountant">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Journal Entries"
          description="General journal for all transactions"
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: 'Journals' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Journal Entries Table */}
        <DataTable<JournalEntry>
          columns={columns}
          data={filteredEntries}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />

        {/* Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Journal Summary</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{filteredEntries.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Debits</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredEntries.reduce((sum, e) => sum + e.totalDebit, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredEntries.reduce((sum, e) => sum + e.totalCredit, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Difference</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  filteredEntries.reduce((sum, e) => sum + e.totalDebit, 0) -
                  filteredEntries.reduce((sum, e) => sum + e.totalCredit, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
