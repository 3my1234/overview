'use client';

import Link from 'next/link';
import { Boxes, ClipboardCheck, ShoppingCart, Users } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Operations control panel for branch and warehouse administration."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sales Operations</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <Button asChild size="sm" variant="outline">
              <Link href="/sales/transactions">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Boxes className="h-5 w-5 text-primary" />
            <Button asChild size="sm" variant="outline">
              <Link href="/inventory">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Worker Records</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Users className="h-5 w-5 text-primary" />
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/workers">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <Button asChild size="sm" variant="outline">
              <Link href="/reconciliation/daily">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

