import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
  type DashboardTimeRange,
  getDateRange,
  getPreviousPeriodRange,
  getStartDate,
  getTimeRangeInDays,
  getTrendDateRange,
  getWeekLabel,
  getWeeksFromTimeRange,
  type PerformanceTimeRange,
  type TrendTimeRange,
} from '@/utils/date';

describe('date utilities', () => {
  // Use a fixed date for consistent testing
  const fixedDate = new Date('2024-06-15T12:00:00Z');
  let originalDate: DateConstructor;

  beforeEach(() => {
    originalDate = global.Date;
    // Mock Date to return fixed date
    const MockDate = class extends Date {
      constructor(...args: Parameters<DateConstructor>) {
        if (args.length === 0) {
          super(fixedDate);
        } else {
          // @ts-expect-error
          super(...args);
        }
      }
    } as DateConstructor;
    MockDate.now = () => fixedDate.getTime();
    global.Date = MockDate;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('getDateRange', () => {
    test('returns 7 day range for 7d timeRange', () => {
      const { startDate, endDate } = getDateRange('7d');
      const expectedStart = new Date('2024-06-08T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });

    test('returns 30 day range for 30d timeRange', () => {
      const { startDate, endDate } = getDateRange('30d');
      const expectedStart = new Date('2024-05-16T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });

    test('returns 3 month range for 3m timeRange', () => {
      const { startDate, endDate } = getDateRange('3m');
      const expectedStart = new Date('2024-03-15T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });
  });

  describe('getPreviousPeriodRange', () => {
    test('returns previous 7 day period for 7d timeRange', () => {
      const { startDate, endDate } = getPreviousPeriodRange('7d');
      // Previous period should end where current period starts
      const expectedEnd = new Date('2024-06-08T12:00:00Z');
      expect(endDate.toISOString()).toBe(expectedEnd.toISOString());
    });

    test('returns previous 30 day period for 30d timeRange', () => {
      const { startDate, endDate } = getPreviousPeriodRange('30d');
      const expectedEnd = new Date('2024-05-16T12:00:00Z');
      expect(endDate.toISOString()).toBe(expectedEnd.toISOString());
    });
  });

  describe('getTimeRangeInDays', () => {
    test('returns 7 for 7d', () => {
      expect(getTimeRangeInDays('7d')).toBe(7);
    });

    test('returns 30 for 30d', () => {
      expect(getTimeRangeInDays('30d')).toBe(30);
    });

    test('returns 90 for 3m', () => {
      expect(getTimeRangeInDays('3m')).toBe(90);
    });
  });

  describe('getStartDate', () => {
    test('returns start date for 7d range', () => {
      const startDate = getStartDate('7d');
      const expectedStart = new Date('2024-06-08T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });

    test('returns start date for 30d range', () => {
      const startDate = getStartDate('30d');
      const expectedStart = new Date('2024-05-16T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });
  });

  describe('getTrendDateRange', () => {
    test('returns 6 weeks ago for 6w', () => {
      const startDate = getTrendDateRange('6w');
      const expectedStart = new Date('2024-05-04T12:00:00Z'); // 42 days ago
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });

    test('returns 12 weeks ago for 12w', () => {
      const startDate = getTrendDateRange('12w');
      const expectedStart = new Date('2024-03-23T12:00:00Z'); // 84 days ago
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });

    test('returns 6 months ago for 6m', () => {
      const startDate = getTrendDateRange('6m');
      const expectedStart = new Date('2023-12-15T12:00:00Z');
      expect(startDate.toISOString()).toBe(expectedStart.toISOString());
    });
  });

  describe('getWeeksFromTimeRange', () => {
    test('returns 6 for 6w', () => {
      expect(getWeeksFromTimeRange('6w')).toBe(6);
    });

    test('returns 12 for 12w', () => {
      expect(getWeeksFromTimeRange('12w')).toBe(12);
    });

    test('returns 26 for 6m', () => {
      expect(getWeeksFromTimeRange('6m')).toBe(26);
    });
  });

  describe('getWeekLabel', () => {
    test('returns Week 1 for index 0', () => {
      expect(getWeekLabel(0)).toBe('Week 1');
    });

    test('returns Week 5 for index 4', () => {
      expect(getWeekLabel(4)).toBe('Week 5');
    });

    test('returns Week 12 for index 11', () => {
      expect(getWeekLabel(11)).toBe('Week 12');
    });
  });
});
