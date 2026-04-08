'use client';

import Link from 'next/link';
import { Factory, ArrowRightLeft, ShoppingCart, ClipboardCheck } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const workerActions = [
  {
    title: 'Sales Entry',
    description: 'Record customer sales and daily branch transactions.',
    href: '/sales/transactions',
    icon: ShoppingCart,
  },
  {
    title: 'Production Entry',
    description: 'Capture finished goods produced from factory operations.',
    href: '/inventory/production',
    icon: Factory,
  },
  {
    title: 'Transfer Entry',
    description: 'Create and receive transfer notes between warehouse and shop.',
    href: '/inventory/transfers',
    icon: ArrowRightLeft,
  },
  {
    title: 'Daily Reconciliation',
    description: 'Submit variance and stock checks for supervisor review.',
    href: '/reconciliation/daily',
    icon: ClipboardCheck,
  },
];

export default function WorkerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Worker Dashboard"
        description="Day-to-day transaction workspace for operational staff."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {workerActions.map((action) => (
          <Card key={action.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <action.icon className="h-5 w-5 text-primary" />
                {action.title}
              </CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent />
            <CardFooter>
              <Button asChild size="sm">
                <Link href={action.href}>Open</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

