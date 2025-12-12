'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/types/supabase';

export type PullRequest = {
  id: string;
  title: string;
  author: string;
  reviewer: string | null;
  status: Database['public']['Enums']['pr_status'];
  created: string;
  repository: string;
  html_url: string;
};

const StatusBadge = ({
  status,
}: {
  status: Database['public']['Enums']['pr_status'];
}) => {
  const variants = {
    open: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    merged: 'bg-green-100 text-green-700 border-green-300',
    closed: 'bg-red-100 text-red-700 border-red-300',
  };

  const labels = {
    open: 'Open',
    merged: 'Merged',
    closed: 'Closed',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} font-semibold`}>
      {labels[status]}
    </Badge>
  );
};

export const columns: ColumnDef<PullRequest>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="h-8"
        >
          PR&apos;s ID
          {sorted === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : sorted === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-normal text-foreground px-4 text-sm">
          #{row.original.id.substring(0, 8)}
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="h-8"
        >
          Title
          {sorted === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : sorted === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="min-w-[225px] px-4 font-normal text-foreground text-sm">
          {row.getValue('title')}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const title = row.getValue(id) as string;
      return title.toLowerCase().includes((value as string).toLowerCase());
    },
  },
  {
    accessorKey: 'repository',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
            className="h-8"
          >
            Repository
            {sorted === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-center font-normal text-foreground text-sm">
          {row.getValue('repository')}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'author',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
            className="h-8"
          >
            Author
            {sorted === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-center font-normal text-foreground text-sm">
          {row.getValue('author')}
        </div>
      );
    },
  },
  {
    accessorKey: 'reviewer',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
            className="h-8"
          >
            Reviewer
            {sorted === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const reviewer = row.getValue('reviewer') as string | null;
      return (
        <div className="text-center font-normal text-foreground text-sm">
          {reviewer || '-'}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true;
      const reviewer = row.getValue(id) as string | null;
      return reviewer === value;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const filterValue = column.getFilterValue() as string | undefined;
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 cursor-pointer">
                Status
                <Filter className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => column.setFilterValue(undefined)}
              >
                {(!filterValue || filterValue === 'all') && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                <span className={!filterValue || filterValue === 'all' ? '' : 'ml-6'}>
                  All
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => column.setFilterValue('open')}
              >
                {filterValue === 'open' && <Check className="mr-2 h-4 w-4" />}
                <span className={filterValue === 'open' ? '' : 'ml-6'}>Open</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => column.setFilterValue('merged')}
              >
                {filterValue === 'merged' && <Check className="mr-2 h-4 w-4" />}
                <span className={filterValue === 'merged' ? '' : 'ml-6'}>Merged</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => column.setFilterValue('closed')}
              >
                {filterValue === 'closed' && <Check className="mr-2 h-4 w-4" />}
                <span className={filterValue === 'closed' ? '' : 'ml-6'}>Closed</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          <StatusBadge status={row.getValue('status')} />
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || value === 'all') return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
            className="h-8"
          >
            Created
            {sorted === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-center font-normal text-foreground text-sm">
          {row.getValue('created')}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => {
      return (
        <div className="text-center">
          <span className="font-medium text-foreground text-sm">Action</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const pr = row.original;
      return (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pr.html_url, '_blank')}
          >
            View Detail
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
];
