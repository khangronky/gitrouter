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

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-foreground text-sm uppercase">
          Filter and Search
        </h2>
        <div className="flex gap-1">
          <Input
            placeholder="Filter by PR's title.."
            value={titleFilter}
            onChange={(event) => setTitleFilter(event.target.value)}
            className="w-[300px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={repositoryFilter} onValueChange={setRepositoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Repos</SelectItem>
              {repositories.map((repo) => (
                <SelectItem key={repo} value={repo}>
                  {repo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviewers</SelectItem>
              {reviewers.map((reviewer) => (
                <SelectItem key={reviewer} value={reviewer}>
                  {reviewer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="h-[68px]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center"
                >
                  <p className="text-muted-foreground">
                    No pull requests found matching your filters.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t p-4">
          <p className="font-medium text-foreground text-sm">
            Showing{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </p>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <span className="text-foreground text-sm">Row per page</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-foreground text-sm">
              Page{' '}
              <span className="font-semibold">
                {table.getState().pagination.pageIndex + 1}
              </span>{' '}
              of {table.getPageCount()}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-10 w-10"
              >
                <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-10 w-10"
              >
                <ChevronsRight className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
