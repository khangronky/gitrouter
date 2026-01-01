import { describe, expect, test } from 'bun:test';
import type { ReviewerType } from '@/lib/schema/reviewer';
import type { RoutingCondition } from '@/lib/schema/routing-rule';
import {
  getMatchTypeLabel,
  getReviewerNames,
  type MatchType,
  parseConditions,
} from '@/utils/routing-helpers';

describe('routing-helpers utilities', () => {
  describe('parseConditions', () => {
    test('returns default for empty conditions', () => {
      const result = parseConditions([]);
      expect(result).toEqual({ matchType: 'file_pattern', matchValue: '' });
    });

    test('returns default for undefined conditions', () => {
      // @ts-expect-error - Testing undefined
      const result = parseConditions(undefined);
      expect(result).toEqual({ matchType: 'file_pattern', matchValue: '' });
    });

    test('parses file_pattern condition', () => {
      const conditions: RoutingCondition[] = [
        {
          type: 'file_pattern',
          patterns: ['*.ts', '*.tsx'],
          match_mode: 'any',
        },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'file_pattern', matchValue: '*.ts' });
    });

    test('parses author condition', () => {
      const conditions: RoutingCondition[] = [
        { type: 'author', usernames: ['user1', 'user2'], mode: 'exclude' },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'author', matchValue: 'user1' });
    });

    test('parses branch condition', () => {
      const conditions: RoutingCondition[] = [
        { type: 'branch', patterns: ['main', 'develop'], branch_type: 'base' },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'branch', matchValue: 'main' });
    });

    test('parses time_window condition', () => {
      const conditions: RoutingCondition[] = [
        {
          type: 'time_window',
          timezone: 'UTC',
          days: ['mon', 'tue', 'wed'],
          start_hour: 9,
          end_hour: 17,
        },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({
        matchType: 'time_window',
        matchValue: 'Custom Schedule',
      });
    });

    test('parses label condition', () => {
      const conditions: RoutingCondition[] = [
        { type: 'label', labels: ['urgent', 'bug'], match_mode: 'any' },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'label', matchValue: 'urgent' });
    });

    test('handles missing patterns/values gracefully', () => {
      const conditions: RoutingCondition[] = [
        { type: 'file_pattern', patterns: [], match_mode: 'any' },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'file_pattern', matchValue: '' });
    });

    test('only uses first condition when multiple provided', () => {
      const conditions: RoutingCondition[] = [
        { type: 'author', usernames: ['user1'], mode: 'exclude' },
        { type: 'label', labels: ['urgent'], match_mode: 'any' },
      ];
      const result = parseConditions(conditions);
      expect(result).toEqual({ matchType: 'author', matchValue: 'user1' });
    });
  });

  describe('getMatchTypeLabel', () => {
    test('returns Files for file_pattern', () => {
      expect(getMatchTypeLabel('file_pattern')).toBe('Files');
    });

    test('returns Author for author', () => {
      expect(getMatchTypeLabel('author')).toBe('Author');
    });

    test('returns Time for time_window', () => {
      expect(getMatchTypeLabel('time_window')).toBe('Time');
    });

    test('returns Branch for branch', () => {
      expect(getMatchTypeLabel('branch')).toBe('Branch');
    });

    test('returns Label for label', () => {
      expect(getMatchTypeLabel('label')).toBe('Label');
    });

    test('returns type as-is for unknown type', () => {
      // @ts-expect-error - Testing unknown type
      expect(getMatchTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getReviewerNames', () => {
    const mockReviewers: ReviewerType[] = [
      {
        id: 'rev-1',
        organization_id: 'org-1',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          full_name: 'Alice Smith',
          github_username: 'alicesmith',
          slack_user_id: null,
        },
      },
      {
        id: 'rev-2',
        organization_id: 'org-1',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user: {
          id: 'user-2',
          email: 'bob@example.com',
          full_name: 'Bob Jones',
          github_username: null,
          slack_user_id: null,
        },
      },
      {
        id: 'rev-3',
        organization_id: 'org-1',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user: {
          id: 'user-3',
          email: 'charlie@example.com',
          full_name: null,
          github_username: null,
          slack_user_id: null,
        },
      },
    ];

    test('returns empty string for empty reviewer IDs', () => {
      expect(getReviewerNames([], mockReviewers)).toBe('');
    });

    test('returns github username when available', () => {
      expect(getReviewerNames(['rev-1'], mockReviewers)).toBe('@alicesmith');
    });

    test('falls back to full_name when no github username', () => {
      expect(getReviewerNames(['rev-2'], mockReviewers)).toBe('@Bob Jones');
    });

    test('shows Unknown when no github_username or full_name', () => {
      expect(getReviewerNames(['rev-3'], mockReviewers)).toBe('@Unknown');
    });

    test('joins multiple reviewers with comma', () => {
      expect(getReviewerNames(['rev-1', 'rev-2'], mockReviewers)).toBe(
        '@alicesmith, @Bob Jones'
      );
    });

    test('filters out unknown reviewer IDs', () => {
      expect(getReviewerNames(['rev-1', 'unknown-id'], mockReviewers)).toBe(
        '@alicesmith'
      );
    });

    test('returns empty string when all IDs are unknown', () => {
      expect(getReviewerNames(['unknown-1', 'unknown-2'], mockReviewers)).toBe(
        ''
      );
    });
  });
});
