import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  listWorkspaceMembers,
  sendChannelMessage,
  sendDirectMessage,
} from '../../lib/slack/client';

// Mock WebClient methods
const mockWebClient = {
  conversations: {
    open: mock(),
    list: mock(),
  },
  chat: {
    postMessage: mock(),
    update: mock(),
  },
  users: {
    lookupByEmail: mock(),
    list: mock(),
  },
};

// Mock @slack/web-api
mock.module('@slack/web-api', () => ({
  WebClient: class {
    constructor() {
      Object.assign(this, mockWebClient);
    }
  },
}));

describe('Slack Client', () => {
  beforeEach(() => {
    mockWebClient.conversations.open.mockReset();
    mockWebClient.conversations.list.mockReset();
    mockWebClient.chat.postMessage.mockReset();
    mockWebClient.chat.update.mockReset();
    mockWebClient.users.lookupByEmail.mockReset();
    mockWebClient.users.list.mockReset();
  });

  describe('sendDirectMessage', () => {
    it('should open DM and send message', async () => {
      mockWebClient.conversations.open.mockResolvedValue({
        ok: true,
        channel: { id: 'D123456' },
      });

      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      });

      const result = await sendDirectMessage(
        mockWebClient as any,
        'U123',
        'Hello'
      );

      expect(result.ok).toBe(true);
      expect(result.channel).toBe('D123456');

      expect(mockWebClient.conversations.open).toHaveBeenCalledWith({
        users: 'U123',
      });

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123456',
        text: 'Hello',
        blocks: undefined,
        unfurl_links: false,
        unfurl_media: false,
      });
    });

    it('should return error if opening DM fails', async () => {
      mockWebClient.conversations.open.mockResolvedValue({
        ok: false,
      });

      const result = await sendDirectMessage(
        mockWebClient as any,
        'U123',
        'Hello'
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Failed to open DM channel');
    });
  });

  describe('sendChannelMessage', () => {
    it('should send message to channel', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      });

      const result = await sendChannelMessage(
        mockWebClient as any,
        'C123',
        'Hello'
      );

      expect(result.ok).toBe(true);

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C123',
        text: 'Hello',
        blocks: undefined,
        unfurl_links: false,
        unfurl_media: false,
      });
    });
  });

  describe('listWorkspaceMembers', () => {
    it('should filter out bots and deleted users', async () => {
      mockWebClient.users.list.mockResolvedValue({
        ok: true,
        members: [
          {
            id: 'U1',
            name: 'user1',
            is_bot: false,
            deleted: false,
            profile: {
              real_name: 'User One',
              display_name: 'One',
              email: 'one@example.com',
            },
          },
          {
            id: 'U2',
            name: 'bot',
            is_bot: true,
            deleted: false,
          },
          {
            id: 'U3',
            name: 'deleted',
            is_bot: false,
            deleted: true,
          },
          {
            id: 'USLACKBOT',
            name: 'slackbot',
            is_bot: false,
            deleted: false,
          },
        ],
      });

      const members = await listWorkspaceMembers(mockWebClient as any);

      expect(members.length).toBe(1);
      expect(members[0].id).toBe('U1');
      expect(members[0].name).toBe('user1');
    });
  });
});
