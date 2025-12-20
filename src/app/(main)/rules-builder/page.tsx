'use client';

import { useState, useMemo } from 'react';
import {
  useRoutingRules,
  useCreateRoutingRule,
  useDeleteRoutingRule,
  useUpdateRoutingRule,
} from '@/lib/api/rules';
import {
  useReviewers,
  useEnsureCurrentUserReviewer,
} from '@/lib/api/reviewers';
import { useUserStore } from '@/stores/user-store';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  RoutingRuleType,
  RoutingCondition,
} from '@/lib/schema/routing-rule';
import { DataTable } from '@/components/ui/data-table';
import { createRulesColumns, type RuleWithStatus } from './columns';
import {
  CreateRuleDialog,
  type RuleFormData,
  type MatchType,
} from './create-rule-dialog';
import { EditRuleDialog } from './edit-rule-dialog';

const DEFAULT_FORM_DATA: RuleFormData = {
  name: '',
  match_type: 'file_pattern',
  match_value: '',
  reviewer_ids: [],
  priority: 50,
  is_active: true,
};

export default function RulesBuilderPage() {
  const {
    currentOrgId,
    isLoading: orgsLoading,
    organizations,
  } = useCurrentOrganization();
  const user = useUserStore((state) => state.user);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRuleType | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(DEFAULT_FORM_DATA);
  const [useHardcodedData, setUseHardcodedData] = useState(false);

  const { data: rulesData, isLoading: rulesLoading } = useRoutingRules(
    currentOrgId || ''
  );
  const { data: reviewersData } = useReviewers(currentOrgId || '');
  const createRuleMutation = useCreateRoutingRule(currentOrgId || '');
  const deleteRuleMutation = useDeleteRoutingRule(currentOrgId || '');
  const ensureReviewerMutation = useEnsureCurrentUserReviewer(
    currentOrgId || ''
  );
  const updateRuleMutation = useUpdateRoutingRule(
    currentOrgId || '',
    editingRule?.id || ''
  );

  // Use API data for display (can switch to hardcoded for demo)
  const allRules = useHardcodedData ? [] : rulesData?.rules || [];
  const reviewers = useHardcodedData ? [] : reviewersData?.reviewers || [];

  // Transform rules to RuleWithStatus type
  const rulesWithStatus: RuleWithStatus[] = useMemo(() => {
    return allRules.map((rule) => ({
      ...rule,
    }));
  }, [allRules]);

  const buildConditions = (
    matchType: MatchType,
    matchValue: string
  ): RoutingCondition[] => {
    switch (matchType) {
      case 'file_pattern':
        return [
          { type: 'file_pattern', patterns: [matchValue], match_mode: 'any' },
        ];
      case 'author':
        return [{ type: 'author', usernames: [matchValue], mode: 'include' }];
      case 'branch':
        return [
          { type: 'branch', patterns: [matchValue], branch_type: 'head' },
        ];
      case 'time_window':
        // Default time window for weekdays 9-5
        return [
          {
            type: 'time_window',
            timezone: 'UTC',
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            start_hour: 9,
            end_hour: 17,
          },
        ];
      default:
        return [
          { type: 'file_pattern', patterns: [matchValue], match_mode: 'any' },
        ];
    }
  };

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

  const handleCreateRule = async () => {
    if (!formData.name || formData.reviewer_ids.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createRuleMutation.mutateAsync({
        name: formData.name,
        conditions: buildConditions(formData.match_type, formData.match_value),
        reviewer_ids: formData.reviewer_ids,
        priority: formData.priority,
        is_active: formData.is_active,
      });
      toast.success('Rule created successfully');
      setCreateDialogOpen(false);
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      toast.error('Failed to create rule');
      console.error(error);
    }
  };

  const handleEditRule = async () => {
    if (!editingRule || !currentOrgId) return;

    try {
      await updateRuleMutation.mutateAsync({
        name: formData.name,
        conditions: buildConditions(formData.match_type, formData.match_value),
        reviewer_ids: formData.reviewer_ids,
        priority: formData.priority,
        is_active: formData.is_active,
      });
      toast.success('Rule updated successfully');
      setEditDialogOpen(false);
      setEditingRule(null);
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      toast.error('Failed to update rule');
      console.error(error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRuleMutation.mutateAsync(ruleId);
      toast.success('Rule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete rule');
      console.error(error);
    }
  };

  const handleDuplicateRule = (rule: RuleWithStatus) => {
    const { matchType, matchValue } = parseConditions(rule.conditions);
    setFormData({
      name: `${rule.name} (Copy)`,
      match_type: matchType,
      match_value: matchValue,
      reviewer_ids: rule.reviewer_ids,
      priority: rule.priority,
      is_active: true,
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (rule: RuleWithStatus) => {
    const { matchType, matchValue } = parseConditions(rule.conditions);
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      match_type: matchType,
      match_value: matchValue,
      reviewer_ids: rule.reviewer_ids,
      priority: rule.priority,
      is_active: rule.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleCreateDefaultRule = async () => {
    if (!user || !currentOrgId) {
      toast.error('Please log in to create a default rule');
      return;
    }

    try {
      // Ensure current user has a reviewer entry
      const result = await ensureReviewerMutation.mutateAsync({
        user_id: user.id,
      });

      // Create the default catch-all rule with lowest priority (highest number)
      await createRuleMutation.mutateAsync({
        name: 'Default - Auto Assign to Me',
        description:
          'Catch-all rule that assigns PRs to me when no other rule matches',
        conditions: [{ type: 'branch', patterns: ['.*'], branch_type: 'head' }],
        reviewer_ids: [result.reviewer.id],
        priority: 9999, // Lowest priority (highest number = evaluated last)
        is_active: true,
      });

      toast.success(
        'Default rule created! You will be assigned when no other rule matches.'
      );
    } catch (error) {
      toast.error('Failed to create default rule');
      console.error(error);
    }
  };

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () =>
      createRulesColumns({
        reviewers,
        onEdit: openEditDialog,
        onDuplicate: handleDuplicateRule,
        onDelete: handleDeleteRule,
      }),
    [reviewers]
  );

  if (orgsLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="w-full space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!organizations.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Organization Found</h2>
          <p className="text-muted-foreground">
            Please create or join an organization first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="w-full p-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Rule Builder</h1>
          <p className="text-sm text-muted-foreground">
            Routing rules in the system
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            onClick={() => {
              setFormData(DEFAULT_FORM_DATA);
              setCreateDialogOpen(true);
            }}
            variant="destructive"
            className="cursor-pointer bg-primary-500 "
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Rule
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateDefaultRule}
            disabled={
              ensureReviewerMutation.isPending || createRuleMutation.isPending
            }
            className="cursor-pointer"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Create Default Rule (Assign to Me)
          </Button>
        </div>

        {/* Rules Table */}
        {rulesLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : rulesWithStatus.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <h3 className="text-lg font-medium">No rules yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first routing rule to automatically assign reviewers
              to PRs.
            </p>
            <Button
              className="mt-4 cursor-pointer"
              onClick={handleCreateDefaultRule}
              disabled={
                ensureReviewerMutation.isPending || createRuleMutation.isPending
              }
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Quick Start: Create Default Rule
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rulesWithStatus}
            pageSize={10}
            pageSizeOptions={[5, 10, 15, 20, 25, 30]}
          />
        )}

        {/* Create Rule Dialog */}
        <CreateRuleDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          formData={formData}
          onFormDataChange={setFormData}
          reviewers={reviewers}
          onSubmit={handleCreateRule}
          isPending={createRuleMutation.isPending}
        />

        {/* Edit Rule Dialog */}
        <EditRuleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          formData={formData}
          onFormDataChange={setFormData}
          reviewers={reviewers}
          onSubmit={handleEditRule}
          isPending={updateRuleMutation.isPending}
        />
      </div>
    </div>
  );
}
