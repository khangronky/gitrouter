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
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
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

  // Popover open states
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [repoOpen, setRepoOpen] = React.useState(false);
  const [reviewerOpen, setReviewerOpen] = React.useState(false);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'merged', label: 'Merged' },
    { value: 'closed', label: 'Closed' },
  ];

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

          {/* Status Filter Combobox */}
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statusOpen}
                className="w-[140px] justify-between cursor-pointer"
              >
                {statusOptions.find((s) => s.value === statusFilter)?.label}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-0">
              <Command>
                <CommandInput placeholder="Search status..." />
                <CommandList>
                  <CommandEmpty>No status found.</CommandEmpty>
                  <CommandGroup>
                    {statusOptions.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(currentValue) => {
                          setStatusFilter(currentValue);
                          setStatusOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            statusFilter === status.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {status.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Repository Filter Combobox */}
          <Popover open={repoOpen} onOpenChange={setRepoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={repoOpen}
                className="w-[180px] justify-between cursor-pointer"
              >
                {repositoryFilter === 'all' ? 'All Repos' : repositoryFilter}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search repository..." />
                <CommandList>
                  <CommandEmpty>No repository found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setRepositoryFilter('all');
                        setRepoOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          repositoryFilter === 'all'
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      All Repos
                    </CommandItem>
                    {repositories.map((repo) => (
                      <CommandItem
                        key={repo}
                        value={repo}
                        onSelect={(currentValue) => {
                          setRepositoryFilter(currentValue);
                          setRepoOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            repositoryFilter === repo
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {repo}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Reviewer Filter Combobox */}
          <Popover open={reviewerOpen} onOpenChange={setReviewerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={reviewerOpen}
                className="w-[160px] justify-between cursor-pointer"
              >
                {reviewerFilter === 'all' ? 'All Reviewers' : reviewerFilter}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search reviewer..." />
                <CommandList>
                  <CommandEmpty>No reviewer found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setReviewerFilter('all');
                        setReviewerOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          reviewerFilter === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Reviewers
                    </CommandItem>
                    {reviewers.map((reviewer) => (
                      <CommandItem
                        key={reviewer}
                        value={reviewer}
                        onSelect={(currentValue) => {
                          setReviewerFilter(currentValue);
                          setReviewerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            reviewerFilter === reviewer
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {reviewer}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
            Showing {startRow}-{endRow} of {totalRows} results
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
