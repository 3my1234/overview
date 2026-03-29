'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends Record<string, any>> {
  columns: DataTableColumn<T>[];
  data: T[];
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: keyof T, order: 'asc' | 'desc') => void;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  showExport?: boolean;
  onExport?: () => void;
  striped?: boolean;
  hover?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  sortBy,
  sortOrder = 'asc',
  onSort,
  pageSize = 10,
  onRowClick,
  selectable = false,
  onSelectionChange,
  showExport = true,
  onExport,
  striped = true,
  hover = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  // Pagination
  const totalPages = Math.ceil(data.length / pageSizeState);
  const startIndex = (currentPage - 1) * pageSizeState;
  const paginatedData = data.slice(startIndex, startIndex + pageSizeState);

  // Export to CSV
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    const csvContent = [
      columns.map(col => col.label).join(','),
      ...paginatedData.map(row =>
        columns
          .map(col => {
            const value = row[col.key];
            return `"${value}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
  };

  // Selection
  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    const selected = paginatedData.filter((_, i) => newSelected.has(i));
    onSelectionChange?.(selected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(
        paginatedData.map((_, i) => i)
      );
      setSelectedRows(newSelected);
      onSelectionChange?.(paginatedData);
    }
  };

  // Sorting icon
  const SortIcon = ({ column }: { column: DataTableColumn<T> }) => {
    if (!column.sortable) return null;
    if (sortBy !== column.key) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + pageSizeState, data.length)} of{' '}
          {data.length} results
        </div>
        {showExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-input"
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead
                  key={String(column.key)}
                  className={`${column.width || ''} text-${column.align || 'left'}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() =>
                        onSort?.(
                          column.key,
                          sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc'
                        )
                      }
                      className="flex items-center gap-2 font-semibold hover:text-foreground transition-colors"
                    >
                      {column.label}
                      <SortIcon column={column} />
                    </button>
                  ) : (
                    <span className="font-semibold">{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`${
                    striped && rowIndex % 2 === 0 ? 'bg-muted/40' : ''
                  } ${
                    hover ? 'hover:bg-muted/60 transition-colors' : ''
                  } ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-input"
                      />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell
                      key={String(column.key)}
                      className={`text-${column.align || 'left'}`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Select
          value={String(pageSizeState)}
          onValueChange={(value) => {
            setPageSizeState(parseInt(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
