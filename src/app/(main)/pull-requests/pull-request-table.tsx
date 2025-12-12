'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PullRequest } from './columns';

interface PullRequestTableProps {
  columns: ColumnDef<PullRequest>[];
  data: PullRequest[];
  repositories: string[];
  reviewers: string[];
}

export function PullRequestTable({
  columns,
  data,
  repositories,
  reviewers,
}: PullRequestTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [repositoryFilter, setRepositoryFilter] = React.useState<string>('all');
  const [reviewerFilter, setReviewerFilter] = React.useState<string>('all');
  const [titleFilter, setTitleFilter] = React.useState<string>('');

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Apply custom filters from select dropdowns
  React.useEffect(() => {
    const filters: ColumnFiltersState = [];

    // Title filter
    if (titleFilter) {
      filters.push({
        id: 'title',
        value: titleFilter,
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filters.push({
        id: 'status',
        value: statusFilter,
      });
    }

    // Repository filter
    if (repositoryFilter !== 'all') {
      filters.push({
        id: 'repository',
        value: repositoryFilter,
      });
    }

    // Reviewer filter
    if (reviewerFilter !== 'all') {
      filters.push({
        id: 'reviewer',
        value: reviewerFilter,
      });
    }

    setColumnFilters(filters);
  }, [statusFilter, repositoryFilter, reviewerFilter, titleFilter]);

  // Pagination calculations
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPageSize = table.getState().pagination.pageSize;
  const startRow = totalRows > 0 ? (currentPage - 1) * currentPageSize + 1 : 0;
  const endRow = Math.min(currentPage * currentPageSize, totalRows);

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Filter and Search
        </h2>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Filter by PR's title..."
            value={titleFilter}
            onChange={(event) => setTitleFilter(event.target.value)}
            className="w-[280px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
              <SelectItem value="open" className="cursor-pointer">Open</SelectItem>
              <SelectItem value="merged" className="cursor-pointer">Merged</SelectItem>
              <SelectItem value="closed" className="cursor-pointer">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={repositoryFilter} onValueChange={setRepositoryFilter}>
            <SelectTrigger className="w-[180px] cursor-pointer">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Repos</SelectItem>
              {repositories.map((repo) => (
                <SelectItem key={repo} value={repo} className="cursor-pointer">
                  {repo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
            <SelectTrigger className="w-[160px] cursor-pointer">
              <SelectValue placeholder="Reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Reviewers</SelectItem>
              {reviewers.map((reviewer) => (
                <SelectItem key={reviewer} value={reviewer} className="cursor-pointer">
                  {reviewer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="w-full rounded-lg border bg-card">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = (
                    header.column.columnDef.meta as { align?: string }
                  )?.align;
                  return (
                    <TableHead
                      key={header.id}
                      className={`px-4 py-4 ${align === 'center' ? 'text-center' : ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (
                      cell.column.columnDef.meta as { align?: string }
                    )?.align;
                    return (
                      <TableCell
                        key={cell.id}
                        className={`px-4 py-4 ${align === 'center' ? 'text-center' : ''}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <p className="text-muted-foreground">
                    No pull requests found matching your filters.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing {endRow - startRow + 1} of {totalRows} results
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Row per page</span>
              <Select
                value={currentPageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-16 cursor-pointer">
                  <SelectValue>{currentPageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => table.setPageIndex(totalPages - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
