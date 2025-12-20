'use client';

import { useEffect } from 'react';
import { useCurrentOrganization } from './use-current-organization';

/**
 * Hook to handle keyboard shortcuts for workspace switching
 * CMD/Ctrl + 1-9 to switch to workspace by index
 */
export function useWorkspaceShortcuts() {
  const { organizations, switchByIndex } = useCurrentOrganization();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for CMD (Mac) or Ctrl (Windows/Linux) + number
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      
      if (!modifierKey) return;

      // Check if key is a number 1-9
      const num = parseInt(event.key, 10);
      if (isNaN(num) || num < 1 || num > 9) return;

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default browser behavior
      event.preventDefault();

      // Switch to workspace at index (0-indexed)
      const index = num - 1;
      if (index < organizations.length) {
        switchByIndex(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [organizations, switchByIndex]);
}

