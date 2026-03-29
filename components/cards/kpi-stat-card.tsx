'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // Percentage change (positive or negative)
  icon?: ReactNode;
  description?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export default function KPIStatCard({
  title,
  value,
  unit,
  trend,
  icon,
  description,
  highlight = false,
  onClick,
}: KPIStatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    return trend > 0 ? (
      <ArrowUp className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600" />
    );
  };

  const trendColor = trend === undefined || trend === 0 ? 'text-muted-foreground' : trend > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        highlight ? 'border-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        {(trend !== undefined || description) && (
          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-semibold ${trendColor}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
