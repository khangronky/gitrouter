import { describe, expect, test } from 'bun:test';
import { calculateBottleneckFrequency } from '@/utils/analytics';

describe('analytics', () => {
  describe('calculateBottleneckFrequency', () => {
    test('returns empty object when no assignments provided', () => {
      const result = calculateBottleneckFrequency([]);
      expect(result).toEqual({});
    });

    test('ignores assignments without reviewed_at', () => {
      const assignments = [
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: null,
          pull_request_id: 'pr-1',
        },
      ];
      const result = calculateBottleneckFrequency(assignments);
      expect(result).toEqual({});
    });

    test('identifies bottleneck reviewer for single PR with multiple reviewers', () => {
      const assignments = [
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T11:00:00Z', // 1 hour
          pull_request_id: 'pr-1',
        },
        {
          reviewer_id: 'reviewer-2',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T14:00:00Z', // 4 hours - bottleneck
          pull_request_id: 'pr-1',
        },
      ];
      const result = calculateBottleneckFrequency(assignments);
      expect(result).toEqual({ 'reviewer-2': 1 });
    });

    test('counts bottleneck frequency across multiple PRs', () => {
      const assignments = [
        // PR 1: reviewer-2 is bottleneck (4 hours vs 1 hour)
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T11:00:00Z',
          pull_request_id: 'pr-1',
        },
        {
          reviewer_id: 'reviewer-2',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T14:00:00Z',
          pull_request_id: 'pr-1',
        },
        // PR 2: reviewer-2 is bottleneck again (3 hours vs 2 hours)
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-02T10:00:00Z',
          reviewed_at: '2024-01-02T12:00:00Z',
          pull_request_id: 'pr-2',
        },
        {
          reviewer_id: 'reviewer-2',
          assigned_at: '2024-01-02T10:00:00Z',
          reviewed_at: '2024-01-02T13:00:00Z',
          pull_request_id: 'pr-2',
        },
        // PR 3: reviewer-1 is bottleneck (5 hours vs 1 hour)
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-03T10:00:00Z',
          reviewed_at: '2024-01-03T15:00:00Z',
          pull_request_id: 'pr-3',
        },
        {
          reviewer_id: 'reviewer-2',
          assigned_at: '2024-01-03T10:00:00Z',
          reviewed_at: '2024-01-03T11:00:00Z',
          pull_request_id: 'pr-3',
        },
      ];
      const result = calculateBottleneckFrequency(assignments);
      expect(result).toEqual({ 'reviewer-2': 2, 'reviewer-1': 1 });
    });

    test('handles single reviewer per PR', () => {
      const assignments = [
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T12:00:00Z',
          pull_request_id: 'pr-1',
        },
      ];
      const result = calculateBottleneckFrequency(assignments);
      expect(result).toEqual({ 'reviewer-1': 1 });
    });

    test('handles mixed reviewed and unreviewed assignments', () => {
      const assignments = [
        {
          reviewer_id: 'reviewer-1',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: '2024-01-01T12:00:00Z',
          pull_request_id: 'pr-1',
        },
        {
          reviewer_id: 'reviewer-2',
          assigned_at: '2024-01-01T10:00:00Z',
          reviewed_at: null, // not reviewed yet
          pull_request_id: 'pr-1',
        },
      ];
      const result = calculateBottleneckFrequency(assignments);
      // Only reviewer-1 has reviewed, so they are the bottleneck
      expect(result).toEqual({ 'reviewer-1': 1 });
    });
  });
});
