'use client';

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
import type { ReviewerType } from '@/lib/schema/reviewer';

export type MatchType = 'file_pattern' | 'author' | 'time_window' | 'branch';

export interface RuleFormData {
  name: string;
  match_type: MatchType;
  match_value: string;
  reviewer_ids: string[];
  priority: number;
  is_active: boolean;
}

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: RuleFormData;
  onFormDataChange: (data: RuleFormData) => void;
  reviewers: ReviewerType[];
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateRuleDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  reviewers,
  onSubmit,
  isPending,
}: CreateRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onFormDataChange({ ...formData, name: e.target.value })
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
                onFormDataChange({ ...formData, match_type: value })
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
                  onFormDataChange({ ...formData, match_value: e.target.value })
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
                  onFormDataChange({
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
                    (reviewer) => !formData.reviewer_ids.includes(reviewer.id)
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
                  const reviewer = reviewers.find((r) => r.id === reviewerId);
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
                          onFormDataChange({
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
                  onFormDataChange({ ...formData, priority: value })
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
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="cursor-pointer"
          >
            Save Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
