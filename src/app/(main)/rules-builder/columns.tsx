'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import type {
  RoutingRuleType,
  RoutingCondition,
} from '@/lib/schema/routing-rule';
import type { ReviewerType } from '@/lib/schema/reviewer';

type MatchType = 'file_pattern' | 'author' | 'time_window' | 'branch';

export interface RuleWithStatus extends RoutingRuleType {
  is_active: boolean;
}

interface ColumnOptions {
  reviewers: ReviewerType[];
  onEdit: (rule: RuleWithStatus) => void;
  onDuplicate: (rule: RuleWithStatus) => void;
  onDelete: (ruleId: string) => void;
}

const parseConditions = (
  conditions: RoutingCondition[]
): { matchType: MatchType; matchValue: string } => {
  if (!conditions || conditions.length === 0) {
    return { matchType: 'file_pattern', matchValue: '' };
  }

  const condition = conditions[0];
  switch (condition.type) {
    case 'file_pattern':
      return {
        matchType: 'file_pattern',
        matchValue: condition.patterns?.[0] || '',
      };
    case 'author':
      return {
        matchType: 'author',
        matchValue: condition.usernames?.[0] || '',
      };
    case 'branch':
      return {
        matchType: 'branch',
        matchValue: condition.patterns?.[0] || '',
      };
    case 'time_window':
      return { matchType: 'time_window', matchValue: 'Custom Schedule' };
    default:
      return { matchType: 'file_pattern', matchValue: '' };
  }
};

const getMatchTypeLabel = (type: string) => {
  switch (type) {
    case 'file_pattern':
      return 'Files';
    case 'author':
      return 'Author';
    case 'time_window':
      return 'Time';
    case 'branch':
      return 'Branch';
    default:
      return type;
  }
};

const getReviewerNames = (
  reviewerIds: string[],
  allReviewers: ReviewerType[]
) => {
  return reviewerIds
    .map((id) => {
      const reviewer = allReviewers.find((r) => r.id === id);
      return reviewer ? `@${reviewer.github_username || reviewer.name}` : null;
    })
    .filter(Boolean)
    .join(', ');
};

export const createRulesColumns = ({
  reviewers,
  onEdit,
  onDuplicate,
  onDelete,
}: ColumnOptions): ColumnDef<RuleWithStatus>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Rule Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    id: 'matchRule',
    header: 'Match Rule',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const { matchValue } = parseConditions(row.original.conditions);
      return <span className="font-mono text-sm">{matchValue}</span>;
    },
  },
  {
    id: 'matchType',
    header: 'Match Type',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const { matchType } = parseConditions(row.original.conditions);
      return getMatchTypeLabel(matchType);
    },
  },
  {
    id: 'assignees',
    header: 'Assignees',
    meta: { align: 'center' },
    cell: ({ row }) => {
      return (
        getReviewerNames(row.original.reviewer_ids, reviewers) || 'No reviewers'
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      return (
        <Badge
          variant={isActive ? 'default' : 'destructive'}
          className={
            isActive
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-red-100 text-red-800'
          }
        >
          {isActive ? 'Enabled' : 'Disabled'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const rule = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(rule)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(rule)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
