import { describe, expect, test } from 'bun:test';
import {
  ACTION_REQUIREMENTS,
  hasPermission,
  type PermissionAction,
  ROLE_HIERARCHY,
} from '@/utils/permissions';

describe('permissions utilities', () => {
  describe('ROLE_HIERARCHY', () => {
    test('owner has highest level', () => {
      expect(ROLE_HIERARCHY.owner).toBe(3);
    });

    test('admin has middle level', () => {
      expect(ROLE_HIERARCHY.admin).toBe(2);
    });

    test('member has lowest level', () => {
      expect(ROLE_HIERARCHY.member).toBe(1);
    });

    test('hierarchy is properly ordered', () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member);
    });
  });

  describe('ACTION_REQUIREMENTS', () => {
    test('org:view requires member role', () => {
      expect(ACTION_REQUIREMENTS['org:view']).toBe('member');
    });

    test('org:update requires admin role', () => {
      expect(ACTION_REQUIREMENTS['org:update']).toBe('admin');
    });

    test('org:delete requires owner role', () => {
      expect(ACTION_REQUIREMENTS['org:delete']).toBe('owner');
    });

    test('all member actions exist', () => {
      expect(ACTION_REQUIREMENTS['members:view']).toBe('member');
      expect(ACTION_REQUIREMENTS['members:invite']).toBe('admin');
      expect(ACTION_REQUIREMENTS['members:remove']).toBe('admin');
      expect(ACTION_REQUIREMENTS['members:update_role']).toBe('admin');
    });

    test('all repos actions exist', () => {
      expect(ACTION_REQUIREMENTS['repos:view']).toBe('member');
      expect(ACTION_REQUIREMENTS['repos:add']).toBe('admin');
      expect(ACTION_REQUIREMENTS['repos:remove']).toBe('admin');
      expect(ACTION_REQUIREMENTS['repos:update']).toBe('admin');
    });

    test('all rules actions exist', () => {
      expect(ACTION_REQUIREMENTS['rules:view']).toBe('member');
      expect(ACTION_REQUIREMENTS['rules:create']).toBe('admin');
      expect(ACTION_REQUIREMENTS['rules:update']).toBe('admin');
      expect(ACTION_REQUIREMENTS['rules:delete']).toBe('admin');
    });
  });

  describe('hasPermission', () => {
    describe('owner role', () => {
      test('can perform all actions', () => {
        expect(hasPermission('owner', 'org:view')).toBe(true);
        expect(hasPermission('owner', 'org:update')).toBe(true);
        expect(hasPermission('owner', 'org:delete')).toBe(true);
        expect(hasPermission('owner', 'members:invite')).toBe(true);
        expect(hasPermission('owner', 'repos:add')).toBe(true);
      });
    });

    describe('admin role', () => {
      test('can perform member and admin actions', () => {
        expect(hasPermission('admin', 'org:view')).toBe(true);
        expect(hasPermission('admin', 'org:update')).toBe(true);
        expect(hasPermission('admin', 'members:invite')).toBe(true);
        expect(hasPermission('admin', 'repos:add')).toBe(true);
      });

      test('cannot perform owner-only actions', () => {
        expect(hasPermission('admin', 'org:delete')).toBe(false);
      });
    });

    describe('member role', () => {
      test('can perform view actions', () => {
        expect(hasPermission('member', 'org:view')).toBe(true);
        expect(hasPermission('member', 'members:view')).toBe(true);
        expect(hasPermission('member', 'repos:view')).toBe(true);
        expect(hasPermission('member', 'rules:view')).toBe(true);
        expect(hasPermission('member', 'reviewers:view')).toBe(true);
        expect(hasPermission('member', 'integrations:view')).toBe(true);
      });

      test('cannot perform admin actions', () => {
        expect(hasPermission('member', 'org:update')).toBe(false);
        expect(hasPermission('member', 'members:invite')).toBe(false);
        expect(hasPermission('member', 'repos:add')).toBe(false);
        expect(hasPermission('member', 'rules:create')).toBe(false);
      });

      test('cannot perform owner actions', () => {
        expect(hasPermission('member', 'org:delete')).toBe(false);
      });
    });

    describe('edge cases', () => {
      test('returns false for unknown action', () => {
        // @ts-expect-error - Testing invalid action
        expect(hasPermission('owner', 'invalid:action')).toBe(false);
      });
    });
  });
});
