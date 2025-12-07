'use client';

import { useEffect, useState, useMemo } from 'react';
import { useOrganizations } from '@/lib/api/organizations';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  RoutingRuleType,
  RoutingCondition,
} from '@/lib/schema/routing-rule';
import { DataTable } from '@/components/ui/data-table';
import { createRulesColumns, type RuleWithStatus } from './columns';

type MatchType = 'file_pattern' | 'author' | 'time_window' | 'branch';

interface RuleFormData {
  name: string;
  match_type: MatchType;
  match_value: string;
  reviewer_ids: string[];
  priority: number;
  is_active: boolean;
}

const DEFAULT_FORM_DATA: RuleFormData = {
  name: '',
  match_type: 'file_pattern',
  match_value: '',
  reviewer_ids: [],
  priority: 50,
  is_active: true,
};

export default function RulesBuilderPage() {
  const { data: orgData, isLoading: orgsLoading } = useOrganizations();
  const user = useUserStore((state) => state.user);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRuleType | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(DEFAULT_FORM_DATA);
  const [useHardcodedData, setUseHardcodedData] = useState(false);

  // Auto-select first org
  useEffect(() => {
    if (
      orgData?.organizations &&
      orgData.organizations.length > 0 &&
      !selectedOrgId
    ) {
      setSelectedOrgId(orgData.organizations[0].id);
    }
  }, [orgData?.organizations, selectedOrgId]);

  const { data: rulesData, isLoading: rulesLoading } = useRoutingRules(
    selectedOrgId || ''
  );
  const { data: reviewersData } = useReviewers(selectedOrgId || '');
  const createRuleMutation = useCreateRoutingRule(selectedOrgId || '');
  const deleteRuleMutation = useDeleteRoutingRule(selectedOrgId || '');
  const ensureReviewerMutation = useEnsureCurrentUserReviewer(
    selectedOrgId || ''
  );
  const updateRuleMutation = useUpdateRoutingRule(
    selectedOrgId || '',
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
    if (!editingRule || !selectedOrgId) return;

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
    if (!user || !selectedOrgId) {
      toast.error('Please log in to create a default rule');
      return;
    }

    try {
      // Ensure current user has a reviewer entry
      const result = await ensureReviewerMutation.mutateAsync({
        user_id: user.id,
        name: user.name || user.email,
        email: user.email,
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

  if (!orgData?.organizations?.length) {
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Rule</DialogTitle>
              <DialogDescription>
                Define a routing rule to automatically assign reviewers to PRs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">
                  Rule Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rule-name"
                  placeholder="Provide a rule name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Match Type <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.match_type}
                  onValueChange={(value: MatchType) =>
                    setFormData({ ...formData, match_type: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file_pattern" id="file_pattern" />
                    <Label htmlFor="file_pattern" className="font-normal">
                      Files (regex)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="author" id="author" />
                    <Label htmlFor="author" className="font-normal">
                      Author (GitHub username)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time_window" id="time_window" />
                    <Label htmlFor="time_window" className="font-normal">
                      Time of Day (schedule)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="branch" id="branch" />
                    <Label htmlFor="branch" className="font-normal">
                      Branch (regex pattern)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.match_type !== 'time_window' && (
                <div className="space-y-2">
                  <Label htmlFor="match-value">
                    Match Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="match-value"
                    placeholder={
                      formData.match_type === 'file_pattern'
                        ? 'src/api/* OR src/backend/*'
                        : formData.match_type === 'author'
                          ? 'GitHub username'
                          : 'Branch pattern (e.g., feature/*)'
                    }
                    value={formData.match_value}
                    onChange={(e) =>
                      setFormData({ ...formData, match_value: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Assign Reviewers <span className="text-red-500">*</span>
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !formData.reviewer_ids.includes(value)) {
                      setFormData({
                        ...formData,
                        reviewer_ids: [...formData.reviewer_ids, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Pick a Reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers
                      .filter(
                        (reviewer) =>
                          !formData.reviewer_ids.includes(reviewer.id)
                      )
                      .map((reviewer) => (
                        <SelectItem
                          key={reviewer.id}
                          value={reviewer.id}
                          className="cursor-pointer"
                        >
                          @{reviewer.github_username || reviewer.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {/* Display selected reviewers */}
                {formData.reviewer_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.reviewer_ids.map((reviewerId) => {
                      const reviewer = reviewers.find(
                        (r) => r.id === reviewerId
                      );
                      if (!reviewer) return null;
                      return (
                        <Badge
                          key={reviewerId}
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                        >
                          @{reviewer.github_username || reviewer.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                reviewer_ids: formData.reviewer_ids.filter(
                                  (id) => id !== reviewerId
                                ),
                              });
                            }}
                            className="ml-1 hover:text-destructive cursor-pointer"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Priority (1-100) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.priority]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, priority: value })
                    }
                    max={100}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-10 text-center font-mono text-sm">
                    {formData.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower numbers = higher priority (evaluated first)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRule}
                disabled={createRuleMutation.isPending}
                className="cursor-pointer"
              >
                Save Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rule Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Rule</DialogTitle>
              <DialogDescription>
                Update the routing rule configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between">
                <Label htmlFor="edit-status">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-status"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rule-name">
                  Rule Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-rule-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Match Type <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.match_type}
                  onValueChange={(value: MatchType) =>
                    setFormData({ ...formData, match_type: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="file_pattern"
                      id="edit-file_pattern"
                    />
                    <Label htmlFor="edit-file_pattern" className="font-normal">
                      Files (regex)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="author" id="edit-author" />
                    <Label htmlFor="edit-author" className="font-normal">
                      Author (GitHub username)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time_window" id="edit-time_window" />
                    <Label htmlFor="edit-time_window" className="font-normal">
                      Time of Day (schedule)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="branch" id="edit-branch" />
                    <Label htmlFor="edit-branch" className="font-normal">
                      Branch (regex pattern)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.match_type !== 'time_window' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-match-value">
                    Match Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-match-value"
                    value={formData.match_value}
                    onChange={(e) =>
                      setFormData({ ...formData, match_value: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Assign Reviewers <span className="text-red-500">*</span>
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !formData.reviewer_ids.includes(value)) {
                      setFormData({
                        ...formData,
                        reviewer_ids: [...formData.reviewer_ids, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Pick a Reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers
                      .filter(
                        (reviewer) =>
                          !formData.reviewer_ids.includes(reviewer.id)
                      )
                      .map((reviewer) => (
                        <SelectItem
                          key={reviewer.id}
                          value={reviewer.id}
                          className="cursor-pointer"
                        >
                          @{reviewer.github_username || reviewer.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {/* Display selected reviewers */}
                {formData.reviewer_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.reviewer_ids.map((reviewerId) => {
                      const reviewer = reviewers.find(
                        (r) => r.id === reviewerId
                      );
                      if (!reviewer) return null;
                      return (
                        <Badge
                          key={reviewerId}
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                        >
                          @{reviewer.github_username || reviewer.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                reviewer_ids: formData.reviewer_ids.filter(
                                  (id) => id !== reviewerId
                                ),
                              });
                            }}
                            className="ml-1 hover:text-destructive cursor-pointer"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Priority (1-100) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.priority]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, priority: value })
                    }
                    max={100}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-10 text-center font-mono text-sm">
                    {formData.priority}
                  </span>
                </div>
              </div>

             
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditRule}
                className="cursor-pointer"
              >
                Update Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
