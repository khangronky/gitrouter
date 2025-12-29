import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  createPullRequestComment,
  getPullRequestDetails,
  getPullRequestFiles,
  listRepositoryPullRequests,
} from '../../lib/github/client';

// Mock Octokit
const mockOctokit = {
  rest: {
    pulls: {
      listFiles: mock(),
      get: mock(),
      list: mock(),
      requestReviewers: mock(),
    },
    issues: {
      createComment: mock(),
    },
    apps: {
      listReposAccessibleToInstallation: mock(),
    },
  },
};

// Mock the octokit module
mock.module('octokit', () => ({
  Octokit: class {
    constructor() {
      Object.assign(this, mockOctokit);
    }
  },
}));

// Mock @octokit/auth-app
mock.module('@octokit/auth-app', () => ({
  createAppAuth: mock(),
}));

// Mock process.env
const originalEnv = process.env;

describe('GitHub Client', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GITHUB_APP_ID: '123',
      GITHUB_APP_PRIVATE_KEY: 'private-key',
      GITHUB_CLIENT_ID: 'client-id',
      GITHUB_CLIENT_SECRET: 'client-secret',
    };

    // Reset mocks
    mockOctokit.rest.pulls.listFiles.mockReset();
    mockOctokit.rest.pulls.get.mockReset();
    mockOctokit.rest.pulls.list.mockReset();
    mockOctokit.rest.issues.createComment.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getPullRequestFiles', () => {
    it('should return a list of filenames', async () => {
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({
        data: [{ filename: 'file1.ts' }, { filename: 'file2.ts' }],
      });

      const files = await getPullRequestFiles(1, 'owner', 'repo', 123);

      expect(files).toEqual(['file1.ts', 'file2.ts']);
      expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        per_page: 300,
      });
    });
  });

  describe('getPullRequestDetails', () => {
    it('should return pull request details', async () => {
      const mockPR = {
        id: 1,
        number: 123,
        title: 'Test PR',
        state: 'open',
      };

      mockOctokit.rest.pulls.get.mockResolvedValue({
        data: mockPR,
      });

      const pr = await getPullRequestDetails(1, 'owner', 'repo', 123);

      expect(pr).toEqual(mockPR);
      expect(mockOctokit.rest.pulls.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      });
    });
  });

  describe('listRepositoryPullRequests', () => {
    it('should list all pull requests when no filters provided', async () => {
      const mockPRs = [
        {
          id: 1,
          number: 1,
          title: 'PR 1',
          state: 'open',
          head: { ref: 'feature-1' },
          base: { ref: 'main' },
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          number: 2,
          title: 'PR 2',
          state: 'closed',
          head: { ref: 'feature-2' },
          base: { ref: 'main' },
          updated_at: new Date().toISOString(),
        },
      ];

      // First call returns data, second call returns empty indicating no more pages
      mockOctokit.rest.pulls.list.mockResolvedValueOnce({ data: mockPRs });
      mockOctokit.rest.pulls.list.mockResolvedValueOnce({ data: [] });

      const prs = await listRepositoryPullRequests(1, 'owner', 'repo');

      expect(prs.length).toBe(2);
      expect(prs[0].id).toBe(1);
      expect(prs[1].id).toBe(2);
      expect(mockOctokit.rest.pulls.list).toHaveBeenCalledTimes(2);
    });

    it('should filter pull requests by sinceDays', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const mockPRs = [
        {
          id: 1,
          number: 1,
          updated_at: today.toISOString(),
          head: { ref: 'head' },
          base: { ref: 'base' },
        },
        {
          id: 2,
          number: 2,
          updated_at: lastWeek.toISOString(),
          head: { ref: 'head' },
          base: { ref: 'base' },
        },
      ];

      mockOctokit.rest.pulls.list.mockResolvedValueOnce({ data: mockPRs });

      const prs = await listRepositoryPullRequests(1, 'owner', 'repo', {
        sinceDays: 2,
      });

      expect(prs.length).toBe(1);
      expect(prs[0].id).toBe(1);
    });
  });

  describe('createPullRequestComment', () => {
    it('should post a comment', async () => {
      const mockComment = {
        id: 1,
        body: 'Test comment',
      };

      mockOctokit.rest.issues.createComment.mockResolvedValue({
        data: mockComment,
      });

      const result = await createPullRequestComment(
        1,
        'owner',
        'repo',
        123,
        'Test comment'
      );

      expect(result).toEqual(mockComment);
      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        body: 'Test comment',
      });
    });
  });
});
