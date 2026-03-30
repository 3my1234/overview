'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import DataTable, { DataTableColumn } from '@/components/table/data-table';
import FilterBar, { FilterConfig } from '@/components/filters/filter-bar';
import StatusBadge from '@/components/badges/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_LABELS } from '@/lib/constants';
import { createUser, getUsers, getWorkers } from '@/lib/api/client';
import { User, Worker } from '@/lib/types';

interface CreateUserForm {
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'worker';
  password: string;
  workerId: string;
  status: 'active' | 'inactive';
}

const initialCreateUserForm: CreateUserForm = {
  name: '',
  username: '',
  email: '',
  role: 'admin',
  password: '',
  workerId: '',
  status: 'active',
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateUserForm>(initialCreateUserForm);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [usersData, workersData] = await Promise.all([getUsers(), getWorkers()]);
      if (!isMounted) return;
      setUsers(usersData);
      setWorkers(workersData);
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      label: 'Role',
      placeholder: 'All Roles',
      key: 'role',
      options: [
        { id: 'super_admin', label: 'Super Admin', value: 'super_admin' },
        { id: 'admin', label: 'Administrator', value: 'admin' },
        { id: 'worker', label: 'Worker', value: 'worker' },
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const unlinkedWorkers = useMemo(() => {
    const linkedWorkerIds = new Set(users.filter((user) => user.workerId).map((user) => user.workerId));
    return workers.filter((worker) => !linkedWorkerIds.has(worker.id));
  }, [users, workers]);

  const columns: DataTableColumn<User>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
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

  async function handleCreateUser() {
    if (!form.name || !form.username || !form.email || !form.password) return;
    if (form.role === 'worker' && !form.workerId) return;

    setSubmitting(true);
    setError('');

    try {
      const newUser = await createUser({
        name: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
        password: form.password,
        workerId: form.role === 'worker' ? form.workerId : undefined,
        status: form.status,
      });

      setUsers((prev) => [newUser, ...prev]);
      setForm(initialCreateUserForm);
      setOpen(false);
    } catch {
      setError('Failed to create user. Ensure you are logged in as super admin/admin.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell userRole="super_admin">
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Super Admin can create admin logins. Super Admin/Admin can create worker logins."
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Users' },
          ]}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Login User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Login User</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, role: value as 'admin' | 'worker', workerId: '' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.role === 'worker' && (
                    <div className="space-y-2">
                      <Label>Link Worker Profile</Label>
                      <Select
                        value={form.workerId || 'none'}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, workerId: value === 'none' ? '' : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select worker profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select worker profile</SelectItem>
                          {unlinkedWorkers.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.employeeCode} - {worker.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, status: value as 'active' | 'inactive' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreateUser()} disabled={submitting}>
                      {submitting ? 'Saving...' : 'Create User'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <FilterBar filters={filterConfigs} onFiltersChange={setFilters} onSearch={setSearchTerm} />

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
