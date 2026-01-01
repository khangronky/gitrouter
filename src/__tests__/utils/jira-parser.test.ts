import { describe, expect, test } from 'bun:test';
import {
  buildJiraUrl,
  extractAllTicketIds,
  extractFromBody,
  extractFromBranch,
  extractFromTitle,
  extractTicketId,
  isValidTicketId,
} from '@/utils/jira-parser';

describe('jira-parser utilities', () => {
  describe('extractFromTitle', () => {
    test('extracts ticket ID from start of title', () => {
      expect(extractFromTitle('ABC-123 Fix bug')).toBe('ABC-123');
    });

    test('extracts ticket ID from title with brackets', () => {
      expect(extractFromTitle('[PROJ-456] Add feature')).toBe('PROJ-456');
    });

    test('extracts ticket ID from middle of title', () => {
      expect(extractFromTitle('Fix ABC-789 bug in auth')).toBe('ABC-789');
    });

    test('returns null when no ticket ID found', () => {
      expect(extractFromTitle('Fix authentication bug')).toBeNull();
    });

    test('handles longer project keys', () => {
      expect(extractFromTitle('PROJECTX-9999 Update')).toBe('PROJECTX-9999');
    });

    test('handles single letter project keys', () => {
      expect(extractFromTitle('X-1 Minimal')).toBe('X-1');
    });
  });

  describe('extractFromBody', () => {
    test('extracts ticket ID from body text', () => {
      expect(extractFromBody('Fixes ABC-123')).toBe('ABC-123');
    });

    test('extracts ticket ID from multiline body', () => {
      const body = `
        This PR addresses the issue.
        
        Related to PROJ-456
        
        See details in the ticket.
      `;
      expect(extractFromBody(body)).toBe('PROJ-456');
    });

    test('returns null for null body', () => {
      expect(extractFromBody(null)).toBeNull();
    });

    test('returns null for empty body', () => {
      expect(extractFromBody('')).toBeNull();
    });

    test('returns null when no ticket ID found', () => {
      expect(extractFromBody('This is just a description')).toBeNull();
    });
  });

  describe('extractFromBranch', () => {
    test('extracts ticket ID from feature branch', () => {
      expect(extractFromBranch('feature/ABC-123-add-login')).toBe('ABC-123');
    });

    test('extracts ticket ID from fix branch', () => {
      expect(extractFromBranch('fix/PROJ-456-fix-bug')).toBe('PROJ-456');
    });

    test('extracts ticket ID at start of branch', () => {
      expect(extractFromBranch('ABC-789-feature')).toBe('ABC-789');
    });

    test('extracts standalone ticket ID branch', () => {
      expect(extractFromBranch('XYZ-1')).toBe('XYZ-1');
    });

    test('returns null for branches without ticket ID', () => {
      expect(extractFromBranch('feature/add-login')).toBeNull();
      expect(extractFromBranch('main')).toBeNull();
    });
  });

  describe('extractTicketId', () => {
    test('prioritizes title over branch and body', () => {
      const result = extractTicketId({
        title: 'TITLE-123 Fix',
        body: 'BODY-456',
        head_branch: 'feature/BRANCH-789',
      });
      expect(result).toBe('TITLE-123');
    });

    test('falls back to branch when title has no ticket', () => {
      const result = extractTicketId({
        title: 'Fix authentication',
        body: 'BODY-456',
        head_branch: 'feature/BRANCH-789',
      });
      expect(result).toBe('BRANCH-789');
    });

    test('falls back to body when title and branch have no ticket', () => {
      const result = extractTicketId({
        title: 'Fix authentication',
        body: 'Related to BODY-456',
        head_branch: 'feature/add-login',
      });
      expect(result).toBe('BODY-456');
    });

    test('returns null when no ticket found anywhere', () => {
      const result = extractTicketId({
        title: 'Fix authentication',
        body: 'Some description',
        head_branch: 'feature/add-login',
      });
      expect(result).toBeNull();
    });

    test('handles missing optional fields', () => {
      expect(extractTicketId({ title: 'ABC-123 Fix' })).toBe('ABC-123');
      expect(extractTicketId({ title: 'Fix', body: null })).toBeNull();
    });
  });

  describe('extractAllTicketIds', () => {
    test('extracts all unique ticket IDs from all sources', () => {
      const result = extractAllTicketIds({
        title: 'ABC-123 and DEF-456',
        body: 'Also fixes GHI-789 and ABC-123',
        head_branch: 'feature/JKL-012',
      });
      expect(result).toContain('ABC-123');
      expect(result).toContain('DEF-456');
      expect(result).toContain('GHI-789');
      expect(result).toContain('JKL-012');
      expect(result.length).toBe(4); // No duplicates
    });

    test('returns empty array when no tickets found', () => {
      const result = extractAllTicketIds({
        title: 'Fix bug',
        body: 'Description',
        head_branch: 'main',
      });
      expect(result).toEqual([]);
    });

    test('handles missing optional fields', () => {
      const result = extractAllTicketIds({
        title: 'ABC-123 Fix',
      });
      expect(result).toEqual(['ABC-123']);
    });

    test('removes duplicate ticket IDs', () => {
      const result = extractAllTicketIds({
        title: 'ABC-123 Fix',
        body: 'Related to ABC-123',
        head_branch: 'feature/ABC-123',
      });
      expect(result).toEqual(['ABC-123']);
    });
  });

  describe('isValidTicketId', () => {
    test('returns true for valid ticket IDs', () => {
      expect(isValidTicketId('ABC-123')).toBe(true);
      expect(isValidTicketId('PROJ-1')).toBe(true);
      expect(isValidTicketId('X-99999')).toBe(true);
      expect(isValidTicketId('PROJECT123-456')).toBe(true);
    });

    test('returns false for invalid ticket IDs', () => {
      expect(isValidTicketId('abc-123')).toBe(false); // lowercase
      expect(isValidTicketId('ABC123')).toBe(false); // no hyphen
      expect(isValidTicketId('123-456')).toBe(false); // starts with number
      expect(isValidTicketId('ABC-')).toBe(false); // no number after hyphen
      expect(isValidTicketId('-123')).toBe(false); // no project key
    });
  });

  describe('buildJiraUrl', () => {
    test('builds correct Jira URL', () => {
      expect(buildJiraUrl('company.atlassian.net', 'ABC-123')).toBe(
        'https://company.atlassian.net/browse/ABC-123'
      );
    });

    test('works with different domains', () => {
      expect(buildJiraUrl('jira.example.com', 'PROJ-456')).toBe(
        'https://jira.example.com/browse/PROJ-456'
      );
    });
  });
});
