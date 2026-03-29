// Currency Formatting
export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number Formatting
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Percentage Formatting
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Date Formatting
export function formatDate(date: Date | string, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formats = {
    short: { year: 'numeric', month: 'short', day: 'numeric' } as const,
    long: { year: 'numeric', month: 'long', day: 'numeric' } as const,
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } as const,
  };

  return new Intl.DateTimeFormat('en-MY', formats[format]).format(d);
}

// Time Formatting
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

// Quantity Formatting (with unit)
export function formatQuantity(value: number, unit: string): string {
  const unitMap: Record<string, string> = {
    litres: 'L',
    drums: 'drum',
    tonnes: 'MT',
    bags: 'bag',
  };
  return `${formatNumber(value)} ${unitMap[unit] || unit}`;
}

// Margin Formatting
export function formatMargin(margin: number, percentage: number): string {
  return `${formatCurrency(margin)} (${formatPercentage(percentage)})`;
}

// Abbreviate Large Numbers
export function abbreviateNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// Variance Formatting with Direction
export function formatVariance(variance: number, percentage: number, showDirection: boolean = true): {
  text: string;
  color: string;
  direction: 'positive' | 'negative' | 'neutral';
} {
  let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (variance > 0) direction = 'positive';
  if (variance < 0) direction = 'negative';

  const prefix = showDirection && direction !== 'neutral' ? (direction === 'positive' ? '+' : '') : '';
  const text = `${prefix}${formatNumber(variance)} (${formatPercentage(percentage)})`;
  const color = direction === 'positive' ? 'text-green-600' : direction === 'negative' ? 'text-red-600' : 'text-gray-600';

  return { text, color, direction };
}

// Status Badge Colors
export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-800' },
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    posted: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
    reconciled: { bg: 'bg-green-100', text: 'text-green-800' },
    investigation: { bg: 'bg-orange-100', text: 'text-orange-800' },
  };
  return colors[status] || colors.draft;
}

// Format Account Balance
export function formatAccountBalance(debit: number, credit: number, accountType: string): {
  balance: number;
  isDebit: boolean;
} {
  const balance = debit - credit;
  const isDebit = ['asset', 'expense'].includes(accountType);
  return { balance, isDebit };
}

// Phone Number Formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : phone;
}

// Text Truncation
export function truncateText(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length - suffix.length) + suffix;
}

// Title Case
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Sentence Case
export function toSentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Convert underscore to space and title case
export function formatLabel(text: string): string {
  return toTitleCase(text.replace(/_/g, ' '));
}

// Calculate Days Since
export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format Time Ago
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d, 'short');
}

// Calculate Financial Metrics
export function calculateMargin(revenue: number, cost: number): {
  margin: number;
  percentage: number;
} {
  const margin = revenue - cost;
  const percentage = revenue > 0 ? (margin / revenue) * 100 : 0;
  return { margin, percentage };
}

// Format GL Account Code
export function formatAccountCode(code: string): string {
  return code.replace(/^(\d{4})/, '$1 ');
}
