'use client';

import { useState } from 'react';
import {
  IconGitMerge,
  IconGitPullRequest,
  IconRefresh,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const prTitles = [
  'Fix auth bug',
  'Add dark mode',
  'Update dependencies',
  'Refactor API layer',
  'Fix memory leak',
  'Add unit tests',
  'Improve perf',
];

const branches = [
  'main ← feature/auth',
  'main ← fix/memory',
  'develop ← feature/ui',
  'main ← hotfix/api',
  'main ← chore/deps',
];

const statuses = [
  {
    label: 'Merged',
    color: 'bg-green-500/20 text-green-600 dark:text-green-400',
    icon: IconGitMerge,
  },
  {
    label: 'Open',
    color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    icon: IconGitPullRequest,
  },
  {
    label: 'Merged',
    color: 'bg-green-500/20 text-green-600 dark:text-green-400',
    icon: IconGitMerge,
  },
];

const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function GitHubCell() {
  const [prData, setPrData] = useState({
    title: prTitles[0],
    number: 1234,
    branch: branches[0],
    status: statuses[0],
    additions: 12,
    deletions: 3,
  });
  const [isSpinning, setIsSpinning] = useState(false);

  const randomize = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setPrData({
        title: getRandomItem(prTitles),
        number: getRandomNumber(1000, 9999),
        branch: getRandomItem(branches),
        status: getRandomItem(statuses),
        additions: getRandomNumber(1, 500),
        deletions: getRandomNumber(0, 100),
      });
      setIsSpinning(false);
    }, 400);
  };

  const StatusIcon = prData.status.icon;

  return (
    <div className="flex h-full flex-col justify-center">
      {/* Mini PR Card */}
      <div
        className="rounded-lg border border-landing-border bg-landing-skeleton p-3 cursor-pointer transition-all duration-200 hover:border-landing-text/20 hover:bg-landing-skeleton-strong active:scale-[0.98]"
        onClick={randomize}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconGitPullRequest
              className={cn(
                'h-4 w-4 shrink-0 transition-colors duration-300',
                prData.status.label === 'Merged'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium text-landing-text truncate transition-opacity duration-300',
                isSpinning && 'opacity-0'
              )}
            >
              {prData.title}
            </span>
          </div>
          <div
            className={cn(
              'shrink-0 ml-2 transition-transform duration-400 ease-out',
              isSpinning && 'rotate-180'
            )}
          >
            <IconRefresh className="h-3.5 w-3.5 text-landing-text-muted" />
          </div>
        </div>
        <div
          className={cn(
            'mb-3 flex items-center gap-3 text-xs text-landing-text-muted transition-opacity duration-300',
            isSpinning && 'opacity-0'
          )}
        >
          <span>#{prData.number}</span>
          <span>•</span>
          <span className="truncate">{prData.branch}</span>
        </div>
        {/* Status animation */}
        <div
          className={cn(
            'flex items-center gap-2 transition-opacity duration-300',
            isSpinning && 'opacity-0'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5',
              prData.status.color
            )}
          >
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">{prData.status.label}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-landing-text-muted">
            <span className="text-green-600 dark:text-green-400">
              +{prData.additions}
            </span>
            <span className="text-red-600 dark:text-red-400">
              -{prData.deletions}
            </span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-landing-text-muted text-center mt-2">
        Click to randomize
      </p>
    </div>
  );
}
