'use client';

import { useState, useEffect } from 'react';
import { IconArrowsExchange, IconGitPullRequest, IconRefresh } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const statuses = [
  { label: 'To Do', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' },
  { label: 'In Progress', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  { label: 'Done', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
];

export function JiraCell() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [prNumber] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [ticketId] = useState(() => `AUTH-${Math.floor(Math.random() * 900) + 100}`);

  const currentStatus = statuses[statusIndex];

  const triggerSync = () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setTimeout(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="flex h-full items-center justify-center gap-4">
      {/* PR Card */}
      <div className={cn(
        "flex-1 rounded-lg border border-landing-border bg-landing-skeleton p-3 transition-all duration-300",
        isSyncing && "border-landing-accent/50 shadow-lg shadow-landing-accent/10"
      )}>
        <div className="mb-2 flex items-center gap-2">
          <IconGitPullRequest className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-landing-text">PR #{prNumber}</span>
        </div>
        <div className="text-xs text-landing-text-muted">Fix auth bug</div>
      </div>

      {/* Sync Arrows */}
      <div 
        className="flex flex-col items-center gap-1 cursor-pointer group w-10"
        onClick={triggerSync}
      >
        <div className={cn(
          "rounded-full p-2 transition-all duration-300",
          isSyncing ? "bg-landing-accent/20" : "group-hover:bg-white/5"
        )}>
          <IconArrowsExchange className={cn(
            "h-5 w-5 transition-all duration-300",
            isSyncing 
              ? "text-landing-accent-light animate-spin" 
              : "text-landing-accent group-hover:text-landing-accent-light"
          )} />
        </div>
        <span className={cn(
          "text-[10px] transition-colors duration-200",
          isSyncing ? "text-landing-accent-light" : "text-landing-text-muted"
        )}>
          {isSyncing ? "Syncing..." : "Sync"}
        </span>
      </div>

      {/* Jira Card */}
      <div className={cn(
        "flex-1 rounded-lg border border-landing-border bg-landing-skeleton p-3 transition-all duration-300",
        isSyncing && "border-blue-500/50 shadow-lg shadow-blue-500/10"
      )}>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-500 text-[8px] font-bold text-white">
            J
          </div>
          <span className="text-xs font-medium text-landing-text">{ticketId}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            "rounded px-1.5 py-0.5 text-[10px] transition-all duration-300",
            currentStatus.color
          )}>
            {currentStatus.label}
          </span>
        </div>
      </div>
    </div>
  );
}
