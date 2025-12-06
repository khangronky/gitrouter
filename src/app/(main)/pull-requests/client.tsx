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
import type { Database } from '@/types/supabase';

type PullRequest = {
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

export function PullRequestsClient({
  pullRequests,
}: {
  pullRequests: PullRequest[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repositoryFilter, setRepositoryFilter] = useState<string>('all');
  const [reviewerFilter, setReviewerFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get unique repositories and reviewers for filters
  const repositories = Array.from(
    new Set(pullRequests.map((pr) => pr.repository))
  ).sort();
  const reviewers = Array.from(
    new Set(
      pullRequests.map((pr) => pr.reviewer).filter((r): r is string => r !== null)
    )
  ).sort();

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesSearch = pr.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    const matchesRepository =
      repositoryFilter === 'all' || pr.repository === repositoryFilter;
    const matchesReviewer =
      reviewerFilter === 'all' || pr.reviewer === reviewerFilter;
    return matchesSearch && matchesStatus && matchesRepository && matchesReviewer;
  });

  const totalPages = Math.ceil(filteredPRs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPRs = filteredPRs.slice(startIndex, endIndex);

  return (
    <div className="flex min-h-screen flex-col gap-8 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl text-foreground">
          Browse Pull Requests
        </h1>
        <p className="text-muted-foreground text-sm">
          Found {filteredPRs.length} Pull Requests in the system
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-foreground text-sm uppercase">
          Filter and Search
        </h2>
        <div className="flex gap-1">
          <Input
            placeholder="Filter by PR's title.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-card hover:bg-card">
              <TableHead>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    PR&apos;s ID
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="min-w-[225px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Title
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Repository
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Author
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Reviewer
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Status
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Created
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-foreground text-sm">
                    Action
                  </span>
                  <ArrowUpDown className="h-4 w-4 text-foreground" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPRs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No pull requests found matching your filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              currentPRs.map((pr) => (
                <TableRow key={pr.id} className="h-[68px]">
                  <TableCell className="font-normal text-foreground text-sm">
                    #{pr.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="font-normal text-foreground text-sm">
                    {pr.title}
                  </TableCell>
                  <TableCell className="text-center font-normal text-foreground text-sm">
                    {pr.repository}
                  </TableCell>
                  <TableCell className="text-center font-normal text-foreground text-sm">
                    {pr.author}
                  </TableCell>
                  <TableCell className="text-center font-normal text-foreground text-sm">
                    {pr.reviewer || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={pr.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-normal text-foreground text-sm">
                    {pr.created}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pr.html_url, '_blank')}
                    >
                      View Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t p-4">
          <p className="font-medium text-foreground text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPRs.length)} of{' '}
            {filteredPRs.length} results
          </p>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <span className="text-foreground text-sm">Row per page</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
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
                <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
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
                <ChevronRight className="h-4 w-4 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
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
