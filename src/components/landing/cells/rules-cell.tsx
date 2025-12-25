'use client';

import { useState } from 'react';
import {
  IconFolder,
  IconGitBranch,
  IconGripVertical,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Rule {
  id: number;
  icon: typeof IconFolder;
  pattern: string;
  team: string;
  color: string;
  activeColor: string;
}

const initialRules: Rule[] = [
  {
    id: 1,
    icon: IconFolder,
    pattern: 'src/frontend/*',
    team: 'Frontend',
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    activeColor: 'bg-blue-500/40 text-blue-700 dark:text-blue-300',
  },
  {
    id: 2,
    icon: IconGitBranch,
    pattern: 'hotfix/*',
    team: 'Senior',
    color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    activeColor: 'bg-orange-500/40 text-orange-700 dark:text-orange-300',
  },
  {
    id: 3,
    icon: IconFolder,
    pattern: 'src/api/*',
    team: 'Backend',
    color: 'bg-green-500/20 text-green-600 dark:text-green-400',
    activeColor: 'bg-green-500/40 text-green-700 dark:text-green-300',
  },
  {
    id: 4,
    icon: IconFolder,
    pattern: 'src/deploy/*',
    team: 'CI/CD',
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    activeColor: 'bg-purple-500/40 text-purple-700 dark:text-purple-300',
  },
  {
    id: 5,
    icon: IconGitBranch,
    pattern: 'deploy/*',
    team: 'CI/CD',
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    activeColor: 'bg-purple-500/40 text-purple-700 dark:text-purple-300',
  },
];

export function RulesCell() {
  const [rules, setRules] = useState(initialRules);
  const [activeRules, setActiveRules] = useState<number[]>([1, 2, 3]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const toggleRule = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRules((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;

    const newRules = [...rules];
    const draggedIndex = newRules.findIndex((r) => r.id === draggedId);
    const targetIndex = newRules.findIndex((r) => r.id === targetId);

    const [draggedRule] = newRules.splice(draggedIndex, 1);
    newRules.splice(targetIndex, 0, draggedRule);

    setRules(newRules);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {rules.map((rule, i) => {
        const isActive = activeRules.includes(rule.id);
        const isDragging = draggedId === rule.id;
        const isDragOver = dragOverId === rule.id;

        return (
          <div
            key={rule.id}
            draggable
            onDragStart={(e) => handleDragStart(e, rule.id)}
            onDragOver={(e) => handleDragOver(e, rule.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, rule.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              'group/rule flex items-center gap-2 rounded-lg border p-2.5 transition-all duration-150 cursor-grab active:cursor-grabbing',
              isActive
                ? 'border-landing-border bg-landing-skeleton hover:border-landing-text/20'
                : 'border-landing-border/50 bg-landing-skeleton/50 opacity-50',
              isDragging && 'opacity-50 scale-95',
              isDragOver && 'border-landing-accent/50 bg-landing-accent/5'
            )}
          >
            {/* Drag Handle */}
            <IconGripVertical
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isDragging
                  ? 'text-landing-accent'
                  : 'text-landing-text-muted group-hover/rule:text-landing-text/50'
              )}
            />

            {/* Icon */}
            <div
              className={cn(
                'rounded-md p-1.5 shrink-0 transition-colors',
                isActive
                  ? rule.color
                  : 'bg-landing-skeleton-strong text-landing-text-muted'
              )}
            >
              <rule.icon className="h-3.5 w-3.5" />
            </div>

            {/* Pattern */}
            <code
              className={cn(
                'flex-1 text-[11px] font-mono transition-colors truncate',
                isActive
                  ? 'text-landing-text/80'
                  : 'text-landing-text-muted line-through'
              )}
            >
              {rule.pattern}
            </code>

            {/* Team Badge */}
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] transition-colors',
                isActive
                  ? 'bg-landing-skeleton-strong text-landing-text/70'
                  : 'bg-landing-skeleton text-landing-text-muted'
              )}
            >
              {rule.team}
            </span>

            {/* Toggle Button */}
            <button
              onClick={(e) => toggleRule(rule.id, e)}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors',
                isActive
                  ? 'bg-green-500/20 hover:bg-green-500/30'
                  : 'bg-red-500/20 hover:bg-red-500/30'
              )}
            >
              {isActive ? (
                <IconCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <IconX className="h-3 w-3 text-red-400" />
              )}
            </button>
          </div>
        );
      })}
      <p className="text-[10px] text-landing-text-muted text-center mt-1">
        Drag to reorder • Click toggle to enable/disable
      </p>
    </div>
  );
}
