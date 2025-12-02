'use client';

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import pullRequestsData from '@/data/pull-requests.json';

type PullRequest = {
  id: string;
  title: string;
  author: string;
  reviewer: string;
  status: 'success' | 'pending' | 'failed';
  created: string;
};

const StatusBadge = ({
  status,
}: {
  status: 'success' | 'pending' | 'failed';
}) => {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-300',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    failed: 'bg-red-100 text-red-700 border-red-300',
  };

  const labels = {
    success: 'Success',
    pending: 'Pending',
    failed: 'Failed',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} font-semibold`}>
      {labels[status]}
    </Badge>
  );
};

export default function PullRequestsPage() {
  const [pullRequests] = useState<PullRequest[]>(
    pullRequestsData as PullRequest[]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesSearch = pr.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPRs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPRs = filteredPRs.slice(startIndex, endIndex);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl text-gray-900">
          Browse Pull Requests
        </h1>
        <p className="text-gray-500 text-sm">
          Found {filteredPRs.length} Pull Requests in the system
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-black text-sm uppercase">
          Filter and Search
        </h2>
        <div className="flex gap-1">
          <Input
            placeholder="Filter by PR's title.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px] border-gray-400 bg-white"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] border-gray-400 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] border-gray-400 bg-white">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Repos</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] border-gray-400 bg-white">
              <SelectValue placeholder="Reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviewers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded border border-gray-300 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    PR&apos;s ID
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="min-w-[225px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Title
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Author
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Reviewer
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Status
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Created
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-gray-900 text-sm">
                    Action
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-gray-900" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPRs.map((pr) => (
              <TableRow key={pr.id} className="h-[68px]">
                <TableCell className="font-normal text-gray-900 text-sm">
                  #{pr.id}
                </TableCell>
                <TableCell className="font-normal text-gray-900 text-sm">
                  {pr.title}
                </TableCell>
                <TableCell className="text-center font-normal text-gray-900 text-sm">
                  {pr.author}
                </TableCell>
                <TableCell className="text-center font-normal text-gray-900 text-sm">
                  {pr.reviewer}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <StatusBadge status={pr.status} />
                  </div>
                </TableCell>
                <TableCell className="text-center font-normal text-gray-900 text-sm">
                  {pr.created}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700"
                  >
                    View Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-gray-300 border-t p-4">
          <p className="font-medium text-gray-900 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPRs.length)} of{' '}
            {filteredPRs.length} results
          </p>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <span className="text-gray-900 text-sm">Row per page</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-gray-900 text-sm">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-10 w-10"
              >
                <ChevronsLeft className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-900" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-10 w-10"
              >
                <ChevronsRight className="h-4 w-4 text-gray-900" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
