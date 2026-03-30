'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatVariance } from '@/lib/utils/formatting';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReconciliationWidgetProps {
  productName: string;
  expected: number;
  actual: number;
  unit: string;
  variance?: number;
  variancePercentage?: number;
  status: 'reconciled' | 'pending' | 'investigation';
  notes?: string;
  reconciledBy?: string;
  reconciliationDate?: Date;
}

export default function ReconciliationWidget({
  productName,
  expected,
  actual,
  unit,
  variance,
  variancePercentage,
  status,
  notes,
  reconciledBy,
  reconciliationDate,
}: ReconciliationWidgetProps) {
  const computed = {
    variance: actual - expected,
    variancePercentage: ((actual - expected) / expected) * 100,
  };

  const v = variance !== undefined ? variance : computed.variance;
  const vp = variancePercentage !== undefined ? variancePercentage : computed.variancePercentage;
  const varInfo = formatVariance(v, vp, true);

  const statusConfig = {
    reconciled: {
      badge: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      label: 'Reconciled',
    },
    pending: {
      badge: 'bg-amber-100 text-amber-800',
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      label: 'Pending',
    },
    investigation: {
      badge: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
      label: 'Under Investigation',
    },
  };

  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{productName}</CardTitle>
        </div>
        <Badge className={config.badge}>{config.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Values Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Expected</p>
            <p className="text-lg font-semibold">{formatNumber(expected)}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-lg font-semibold">{formatNumber(actual)}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={`text-lg font-semibold ${varInfo.color}`}>
              {varInfo.text.split('(')[0].trim()}
            </p>
            <p className={`text-xs ${varInfo.color}`}>{vp.toFixed(2)}%</p>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          {config.icon}
          <div className="text-sm">
            {status === 'reconciled' && reconciledBy && (
              <p>
                Reconciled by <span className="font-medium">{reconciledBy}</span>
                {reconciliationDate && ` on ${reconciliationDate.toLocaleDateString()}`}
              </p>
            )}
            {status === 'pending' && <p>Waiting for reconciliation</p>}
            {status === 'investigation' && <p>Variance being investigated</p>}
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
