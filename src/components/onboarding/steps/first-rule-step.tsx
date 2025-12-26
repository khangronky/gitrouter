'use client';

import { useState } from 'react';
import {
  Route,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCreateRoutingRule } from '@/lib/api/rules';
import { useReviewers } from '@/lib/api/reviewers';
import { toast } from 'sonner';

interface FirstRuleStepProps {
  onNext: () => void;
  onBack: () => void;
  orgId: string;
}

const EXAMPLE_PATTERNS = [
  { label: 'Frontend files', pattern: '*.tsx, *.ts, *.css' },
  { label: 'Backend files', pattern: 'src/api/**, src/lib/**' },
  { label: 'Documentation', pattern: '*.md, docs/**' },
  { label: 'Tests', pattern: '**/*.test.ts, **/*.spec.ts' },
];

export function FirstRuleStep({ onNext, onBack, orgId }: FirstRuleStepProps) {
  const [ruleName, setRuleName] = useState('');
  const [filePattern, setFilePattern] = useState('');
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: reviewersData, isLoading: loadingReviewers } =
    useReviewers(orgId);
  const createRule = useCreateRoutingRule(orgId);

  const reviewers = reviewersData?.reviewers || [];

  const handleAddReviewer = (reviewerId: string) => {
    if (!selectedReviewerIds.includes(reviewerId)) {
      setSelectedReviewerIds([...selectedReviewerIds, reviewerId]);
    }
  };

  const handleRemoveReviewer = (reviewerId: string) => {
    setSelectedReviewerIds(
      selectedReviewerIds.filter((id) => id !== reviewerId)
    );
  };

  const handleSelectPattern = (pattern: string) => {
    setFilePattern(pattern);
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) {
      toast.error('Please enter a rule name');
      return;
    }
    if (!filePattern.trim()) {
      toast.error('Please enter a file pattern');
      return;
    }
    if (selectedReviewerIds.length === 0) {
      toast.error('Please select at least one reviewer');
      return;
    }

    setIsCreating(true);
    try {
      // Parse file patterns (comma-separated)
      const patterns = filePattern
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await createRule.mutateAsync({
        name: ruleName,
        conditions: [
          {
            type: 'file_pattern',
            patterns,
            match_mode: 'any',
          },
        ],
        reviewer_ids: selectedReviewerIds,
        is_active: true,
        priority: 0,
      });

      toast.success('Routing rule created!');
      onNext();
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast.error('Failed to create rule. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedReviewers = reviewers.filter((r) =>
    selectedReviewerIds.includes(r.id)
  );
  const availableReviewers = reviewers.filter(
    (r) => !selectedReviewerIds.includes(r.id)
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Route className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Create Your First Rule</h2>
        <p className="text-muted-foreground text-sm">
          Routing rules automatically assign reviewers based on the files
          changed in a pull request.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ruleName">Rule Name</Label>
          <Input
            id="ruleName"
            placeholder="e.g., Frontend Team Review"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filePattern">File Pattern</Label>
          <Input
            id="filePattern"
            placeholder="e.g., *.tsx, src/components/**"
            value={filePattern}
            onChange={(e) => setFilePattern(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {EXAMPLE_PATTERNS.map((example) => (
              <Button
                key={example.label}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSelectPattern(example.pattern)}
              >
                {example.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Reviewers</Label>
          {selectedReviewers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedReviewers.map((reviewer) => (
                <Badge
                  key={reviewer.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {reviewer.user?.full_name ||
                    reviewer.user?.email ||
                    'Unknown'}
                  <button
                    type="button"
                    onClick={() => handleRemoveReviewer(reviewer.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Select onValueChange={handleAddReviewer} value="">
            <SelectTrigger>
              <SelectValue placeholder="Add a reviewer..." />
            </SelectTrigger>
            <SelectContent>
              {loadingReviewers ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Loading reviewers...
                </div>
              ) : availableReviewers.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  {reviewers.length === 0
                    ? 'No reviewers available. Sync from GitHub first.'
                    : 'All reviewers selected'}
                </div>
              ) : (
                availableReviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    <div className="flex items-center gap-2">
                      <Plus className="size-3" />
                      {reviewer.user?.full_name ||
                        reviewer.user?.email ||
                        'Unknown'}
                      {reviewer.user?.github_username && (
                        <span className="text-muted-foreground">
                          @{reviewer.user.github_username}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Skip
          </Button>
          <Button onClick={handleCreateRule} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Check className="size-4 mr-2" />
            )}
            Create Rule
          </Button>
        </div>
      </div>
    </div>
  );
}
