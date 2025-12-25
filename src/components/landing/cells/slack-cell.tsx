'use client';

import { useState } from 'react';
import { IconBrandSlack } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const messages = [
  { title: 'Fix auth bug', mention: '@you' },
  { title: 'Update user API', mention: '@team' },
  { title: 'Add dark mode', mention: '@you' },
  { title: 'Refactor hooks', mention: '@sarah' },
];

export function SlackCell() {
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(true);

  const currentMessage = messages[messageIndex];

  const cycleMessage = () => {
    setIsVisible(false);
    setHasNewNotification(false);

    setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      setIsVisible(true);
      setTimeout(() => setHasNewNotification(true), 100);
    }, 300);
  };

  return (
    <div className="flex h-full flex-col justify-center">
      {/* Slack Message */}
      <div
        className={cn(
          'cursor-pointer rounded-lg border border-landing-border bg-landing-skeleton p-3 transition-all duration-300 hover:border-landing-text/20 hover:bg-landing-skeleton-strong',
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        )}
        onClick={cycleMessage}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4A154B] transition-transform duration-200 hover:scale-110">
            <IconBrandSlack className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-medium text-landing-text">GitRouter</span>
          <span className="text-xs text-landing-text-muted">now</span>

          {/* Notification dot with ping */}
          <div className="relative ml-auto flex h-2 w-2">
            {hasNewNotification && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-landing-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-landing-accent" />
              </>
            )}
          </div>
        </div>
        <div className="text-sm text-landing-text/70 truncate">
          New PR assigned:{' '}
          <span className="text-blue-600 dark:text-blue-400 hover:underline">
            {currentMessage.title}
          </span>
        </div>
        <div className="mt-1 text-xs text-landing-text-muted">
          <span className="text-blue-600 dark:text-blue-400">{currentMessage.mention}</span>{' '}
          requested for review
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-landing-text-muted">
        Click for new notification
      </p>
    </div>
  );
}
