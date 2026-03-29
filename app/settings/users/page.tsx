'use client';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { mockUsers } from '@/lib/mock-data';
import { ROLE_LABELS } from '@/lib/constants';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Role',
      placeholder: 'All Roles',
      key: 'role',
      options: [
        { id: 'admin', label: 'Administrator', value: 'admin' },
        { id: 'ceo', label: 'CEO', value: 'ceo' },
        { id: 'accountant', label: 'Accountant', value: 'accountant' },
        { id: 'warehouse_manager', label: 'Warehouse Manager', value: 'warehouse_manager' },
        { id: 'sales_manager', label: 'Sales Manager', value: 'sales_manager' },
        { id: 'auditor', label: 'Auditor', value: 'auditor' },
      ],
    },
    {
      type: 'select',
      label: 'Status',
      placeholder: 'All Status',
      key: 'status',
      options: [
        { id: 'active', label: 'Active', value: 'active' },
        { id: 'inactive', label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // Filtered data
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Table columns
  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => ROLE_LABELS[value as keyof typeof ROLE_LABELS] || value,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return (
    <AppShell userRole="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="User Management"
          description="Manage system users and permissions"
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Users' },
          ]}
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar
          filters={filterConfigs}
          onFiltersChange={setFilters}
          onSearch={setSearchTerm}
        />

        {/* Users Table */}
        <DataTable<User>
          columns={columns}
          data={filteredUsers}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
