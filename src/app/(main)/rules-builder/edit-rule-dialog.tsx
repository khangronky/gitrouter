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
import { Switch } from '@/components/ui/switch';
import type { ReviewerType } from '@/lib/schema/reviewer';
import type { RuleFormData, MatchType } from './create-rule-dialog';

interface EditRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: RuleFormData;
  onFormDataChange: (data: RuleFormData) => void;
  reviewers: ReviewerType[];
  onSubmit: () => void;
  isPending: boolean;
}

export function EditRuleDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  reviewers,
  onSubmit,
  isPending,
}: EditRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onFormDataChange({ ...formData, is_active: checked })
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
                <RadioGroupItem value="file_pattern" id="edit-file_pattern" />
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
                      @{reviewer.user?.github_username || reviewer.user?.full_name || 'Unknown'}
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
                      @{reviewer.user?.github_username || reviewer.user?.full_name || 'Unknown'}
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
            Update Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
