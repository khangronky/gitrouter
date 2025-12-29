import { describe, expect, test } from 'bun:test';
import { buildFallbackText, escapeMarkdown } from '@/utils/slack-format';

describe('slack-format utilities', () => {
  describe('escapeMarkdown', () => {
    test('escapes ampersand', () => {
      expect(escapeMarkdown('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('escapes less than sign', () => {
      expect(escapeMarkdown('a < b')).toBe('a &lt; b');
    });

    test('escapes greater than sign', () => {
      expect(escapeMarkdown('a > b')).toBe('a &gt; b');
    });

    test('escapes multiple special characters', () => {
      expect(escapeMarkdown('<script>alert("test")</script>')).toBe(
        '&lt;script&gt;alert("test")&lt;/script&gt;'
      );
    });

    test('escapes all special characters in combination', () => {
      expect(escapeMarkdown('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
    });

    test('returns empty string for empty input', () => {
      expect(escapeMarkdown('')).toBe('');
    });

    test('returns text unchanged when no special characters', () => {
      expect(escapeMarkdown('Hello World')).toBe('Hello World');
    });

    test('handles text with only special characters', () => {
      expect(escapeMarkdown('<>&')).toBe('&lt;&gt;&amp;');
    });

    test('handles multiple ampersands', () => {
      expect(escapeMarkdown('A && B && C')).toBe('A &amp;&amp; B &amp;&amp; C');
    });
  });

  describe('buildFallbackText', () => {
    test('builds correct fallback text', () => {
      const pr = {
        title: 'Fix authentication bug',
        number: 123,
        repo: 'org/repo',
        url: 'https://github.com/org/repo/pull/123',
      };
      expect(buildFallbackText(pr)).toBe(
        'New PR Review Request: #123 - Fix authentication bug in org/repo. View: https://github.com/org/repo/pull/123'
      );
    });

    test('handles PR with special characters in title', () => {
      const pr = {
        title: 'Add feature A & B',
        number: 456,
        repo: 'company/project',
        url: 'https://github.com/company/project/pull/456',
      };
      expect(buildFallbackText(pr)).toBe(
        'New PR Review Request: #456 - Add feature A & B in company/project. View: https://github.com/company/project/pull/456'
      );
    });

    test('handles PR with long title', () => {
      const pr = {
        title:
          'Implement comprehensive authentication system with OAuth 2.0 support',
        number: 789,
        repo: 'org/auth-service',
        url: 'https://github.com/org/auth-service/pull/789',
      };
      expect(buildFallbackText(pr)).toBe(
        'New PR Review Request: #789 - Implement comprehensive authentication system with OAuth 2.0 support in org/auth-service. View: https://github.com/org/auth-service/pull/789'
      );
    });

    test('handles PR number 1', () => {
      const pr = {
        title: 'Initial commit',
        number: 1,
        repo: 'user/new-project',
        url: 'https://github.com/user/new-project/pull/1',
      };
      expect(buildFallbackText(pr)).toBe(
        'New PR Review Request: #1 - Initial commit in user/new-project. View: https://github.com/user/new-project/pull/1'
      );
    });
  });
});
