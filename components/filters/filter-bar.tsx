'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterConfig {
  type: 'search' | 'select' | 'date-range' | 'status';
  label: string;
  placeholder?: string;
  options?: FilterOption[];
  key: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFiltersChange: (filters: Record<string, any>) => void;
  onSearch?: (term: string) => void;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  onSearch,
}: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    onFiltersChange({});
    onSearch?.('');
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchTerm.length > 0;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.key}>
            {filter.type === 'select' && (
              <Select
                value={activeFilters[filter.key] || ''}
                onValueChange={(value) =>
                  handleFilterChange(filter.key, value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={filter.placeholder || filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filter.type === 'date-range' && (
              <input
                type="date"
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            )}

            {filter.type === 'status' && (
              <Select
                value={activeFilters[filter.key] || ''}
                onValueChange={(value) =>
                  handleFilterChange(filter.key, value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={filter.placeholder || 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
