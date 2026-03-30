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
import { createWorker, getMasterData, getWorkers } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { Worker } from '@/lib/types';

interface WorkerFormState {
  employeeCode: string;
  fullName: string;
  roleTitle: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  hireDate: string;
  employmentType: Worker['employmentType'];
  locationType: Worker['locationType'];
  locationId: string;
  monthlySalary: string;
  bankName: string;
  bankAccountNumber: string;
  governmentIdType: NonNullable<Worker['governmentIdType']>;
  governmentIdNumber: string;
  status: Worker['status'];
}

const initialFormState: WorkerFormState = {
  employeeCode: '',
  fullName: '',
  roleTitle: '',
  department: '',
  phone: '',
  email: '',
  address: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  hireDate: '',
  employmentType: 'full_time',
  locationType: 'warehouse',
  locationId: '',
  monthlySalary: '',
  bankName: '',
  bankAccountNumber: '',
  governmentIdType: 'nin',
  governmentIdNumber: '',
  status: 'active',
};

export default function WorkersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WorkerFormState>(initialFormState);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [workersData, masterData] = await Promise.all([getWorkers(), getMasterData()]);
      if (!isMounted) return;

      setWorkers(workersData);
      setWarehouses(masterData.warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })));
      setBranches(masterData.branches.map((branch) => ({ id: branch.id, name: branch.name })));
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const locationOptions = useMemo(() => {
    if (form.locationType === 'warehouse') return warehouses;
    if (form.locationType === 'branch') return branches;
    return [];
  }, [branches, form.locationType, warehouses]);

  const filterConfigs: FilterConfig[] = [
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
    {
      type: 'select',
      label: 'Location Type',
      placeholder: 'All Locations',
      key: 'locationType',
      options: [
        { id: 'warehouse', label: 'Warehouse', value: 'warehouse' },
        { id: 'branch', label: 'Branch', value: 'branch' },
        { id: 'hq', label: 'Head Office', value: 'hq' },
      ],
    },
  ];

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      !searchTerm ||
      worker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filters.status || worker.status === filters.status;
    const matchesLocationType = !filters.locationType || worker.locationType === filters.locationType;

    return matchesSearch && matchesStatus && matchesLocationType;
  });

  const columns: DataTableColumn<Worker>[] = [
    { key: 'employeeCode', label: 'Worker Code', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'roleTitle', label: 'Role', sortable: true },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'monthlySalary',
      label: 'Monthly Salary',
      align: 'right',
      render: (value) => (value ? formatCurrency(value, 'NGN') : '-'),
    },
    {
      key: 'hireDate',
      label: 'Hire Date',
      render: (value) => formatDate(value, 'short'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  async function onSubmitWorker() {
    if (!form.employeeCode || !form.fullName || !form.phone || !form.address || !form.hireDate) return;

    setSubmitting(true);

    const worker = await createWorker({
      employeeCode: form.employeeCode,
      fullName: form.fullName,
      roleTitle: form.roleTitle || 'Worker',
      department: form.department || 'Operations',
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      nextOfKinName: form.nextOfKinName || 'Not Provided',
      nextOfKinPhone: form.nextOfKinPhone || 'Not Provided',
      hireDate: new Date(form.hireDate),
      employmentType: form.employmentType,
      locationType: form.locationType,
      locationId: form.locationId || undefined,
      monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined,
      bankName: form.bankName || undefined,
      bankAccountNumber: form.bankAccountNumber || undefined,
      governmentIdType: form.governmentIdType || undefined,
      governmentIdNumber: form.governmentIdNumber || undefined,
      status: form.status,
    });

    setWorkers((prev) => [worker, ...prev]);
    setForm(initialFormState);
    setSubmitting(false);
    setOpen(false);
  }

  return (
    <AppShell userRole="super_admin">
      <div className="space-y-6">
        <PageHeader
          title="Worker Management"
          description="Super Admin and Admin can register and manage worker employment records."
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Workers' },
          ]}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Worker Profile</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employeeCode">Worker Code</Label>
                    <Input
                      id="employeeCode"
                      value={form.employeeCode}
                      onChange={(event) => setForm((prev) => ({ ...prev, employeeCode: event.target.value }))}
                      placeholder="WRK-0003"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleTitle">Job Title</Label>
                    <Input
                      id="roleTitle"
                      value={form.roleTitle}
                      onChange={(event) => setForm((prev) => ({ ...prev, roleTitle: event.target.value }))}
                      placeholder="Warehouse Assistant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={form.department}
                      onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                      placeholder="Operations"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinName">Next of Kin Name</Label>
                    <Input
                      id="nextOfKinName"
                      value={form.nextOfKinName}
                      onChange={(event) => setForm((prev) => ({ ...prev, nextOfKinName: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinPhone">Next of Kin Phone</Label>
                    <Input
                      id="nextOfKinPhone"
                      value={form.nextOfKinPhone}
                      onChange={(event) => setForm((prev) => ({ ...prev, nextOfKinPhone: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={form.hireDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, hireDate: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={form.employmentType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, employmentType: value as Worker['employmentType'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location Type</Label>
                    <Select
                      value={form.locationType}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          locationType: value as Worker['locationType'],
                          locationId: '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="branch">Branch</SelectItem>
                        <SelectItem value="hq">Head Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned Location</Label>
                    <Select
                      value={form.locationId || 'none'}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, locationId: value === 'none' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.locationType === 'hq' ? 'Head Office' : 'Select location'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {locationOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlySalary">Monthly Salary (NGN)</Label>
                    <Input
                      id="monthlySalary"
                      type="number"
                      min="0"
                      value={form.monthlySalary}
                      onChange={(event) => setForm((prev) => ({ ...prev, monthlySalary: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Government ID Type</Label>
                    <Select
                      value={form.governmentIdType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, governmentIdType: value as NonNullable<Worker['governmentIdType']> }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nin">NIN</SelectItem>
                        <SelectItem value="voters_card">Voter's Card</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governmentIdNumber">Government ID Number</Label>
                    <Input
                      id="governmentIdNumber"
                      value={form.governmentIdNumber}
                      onChange={(event) => setForm((prev) => ({ ...prev, governmentIdNumber: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={form.bankName}
                      onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={form.bankAccountNumber}
                      onChange={(event) => setForm((prev) => ({ ...prev, bankAccountNumber: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as Worker['status'] }))}
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
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button onClick={() => void onSubmitWorker()} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Worker'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <FilterBar filters={filterConfigs} onFiltersChange={setFilters} onSearch={setSearchTerm} />

        <DataTable<Worker>
          columns={columns}
          data={filteredWorkers}
          pageSize={10}
          showExport={true}
          hover={true}
          striped={true}
        />
      </div>
    </AppShell>
  );
}
