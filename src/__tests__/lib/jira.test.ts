import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  createJiraIssue,
  getJiraIssue,
  type JiraConfig,
  testJiraConnection,
  transitionIssue,
} from '../../lib/jira/client';

// Mock Jira Config
const mockConfig: JiraConfig = {
  cloudId: 'cloud-id',
  accessToken: 'access-token',
  organizationId: 'org-id',
};

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = mock();

describe('Jira Client', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('testJiraConnection', () => {
    it('should return success when connection is valid', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ displayName: 'Test User' }),
        json: async () => ({ displayName: 'Test User' }),
      });

      const result = await testJiraConnection(mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Connected as Test User');
      expect(result.user?.displayName).toBe('Test User');
    });

    it('should return failure when connection fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ errorMessages: ['Unauthorized'] }),
        status: 401,
      });

      const result = await testJiraConnection(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });
  });

  describe('getJiraIssue', () => {
    it('should return issue details', async () => {
      const mockIssue = {
        key: 'TEST-1',
        fields: {
          summary: 'Test Issue',
          status: { name: 'To Do' },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockIssue),
        json: async () => mockIssue,
      });

      const issue = await getJiraIssue(mockConfig, 'TEST-1');

      expect(issue).toEqual(mockIssue);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/issue/TEST-1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });
  });

  describe('createJiraIssue', () => {
    it('should create a Jira issue', async () => {
      // Mock getProjectIssueTypes response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            issueTypes: [{ id: '10001', name: 'Task', subtask: false }],
          }),
        json: async () => ({
          issueTypes: [{ id: '10001', name: 'Task', subtask: false }],
        }),
      });

      // Mock create issue response
      const mockCreatedIssue = {
        id: '10000',
        key: 'TEST-2',
        self: 'https://api.atlassian.com/ex/jira/cloud-id/rest/api/3/issue/10000',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockCreatedIssue),
        json: async () => mockCreatedIssue,
      });

      const result = await createJiraIssue(mockConfig, 'TEST', {
        summary: 'New Issue',
        description: 'Description',
      });

      expect(result).toEqual({ key: 'TEST-2', id: '10000' });

      // Verification for the CREATE call (second call)
      const createCall = mockFetch.mock.calls[1];
      const createUrl = createCall[0] as string;
      const createOptions = createCall[1] as RequestInit;

      expect(createUrl).toContain('/issue');
      expect(createOptions.method).toBe('POST');
      const body = JSON.parse(createOptions.body as string);
      expect(body.fields.project.key).toBe('TEST');
      expect(body.fields.summary).toBe('New Issue');
      expect(body.fields.issuetype.id).toBe('10001');
    });
  });

  describe('transitionIssue', () => {
    it('should transition an issue', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => '',
      });

      const success = await transitionIssue(mockConfig, 'TEST-1', '21');

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/issue/TEST-1/transitions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ transition: { id: '21' } }),
        })
      );
    });
  });
});
