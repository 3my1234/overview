'use client';

import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/lib/utils/formatting';
import { STATUS_LABELS } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export default function StatusBadge({
  status,
  label,
  variant = 'default',
}: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const displayLabel = label || STATUS_LABELS[status] || status;

  return (
    <Badge
      className={`${colors.bg} ${colors.text} font-medium`}
      variant={variant === 'outline' ? 'outline' : 'default'}
    >
      {displayLabel}
    </Badge>
  );
}
