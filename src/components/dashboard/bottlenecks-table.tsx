'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Bottleneck {
  repo: string;
  avg: string;
  pending: number;
  sla: string;
}

const columns: ColumnDef<Bottleneck>[] = [
  {
    accessorKey: 'repo',
    header: 'Repo',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('repo')}</div>
    ),
  },
  {
    accessorKey: 'avg',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            Avg Review Time
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
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.getValue('avg')}
      </div>
    ),
  },
  {
    accessorKey: 'pending',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            PRs Pending
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
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.getValue('pending')}
      </div>
    ),
  },
  {
    accessorKey: 'sla',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            SLA%
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
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.getValue('sla')}
      </div>
    ),
  },
];

export function BottlenecksTable({
  bottlenecks,
  className,
}: {
  bottlenecks: Bottleneck[];
  className?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: bottlenecks,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col gap-1">
        <CardTitle>Bottlenecks</CardTitle>
        <CardDescription>Bottlenecks in the review process</CardDescription>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                  className="h-24 text-center"
                >
                  No bottlenecks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
