import { describe, expect, test } from 'bun:test';
import {
  calcDelta,
  formatDelta,
  formatHours,
  formatMinutes,
  formatPercent,
  getTrendDirection,
  isTrendPositive,
} from '@/utils/format';

describe('format utilities', () => {
  describe('calcDelta', () => {
    test('calculates positive delta correctly', () => {
      expect(calcDelta(120, 100)).toBe(20); // 20% increase
    });

    test('calculates negative delta correctly', () => {
      expect(calcDelta(80, 100)).toBe(-20); // 20% decrease
    });

    test('returns 0 when values are equal', () => {
      expect(calcDelta(100, 100)).toBe(0);
    });

    test('returns 100 when previous is 0 and current is positive', () => {
      expect(calcDelta(50, 0)).toBe(100);
    });

    test('returns 0 when both values are 0', () => {
      expect(calcDelta(0, 0)).toBe(0);
    });

    test('rounds result to nearest integer', () => {
      expect(calcDelta(133, 100)).toBe(33);
      expect(calcDelta(167, 100)).toBe(67);
    });
  });

  describe('getTrendDirection', () => {
    test('returns up for positive delta', () => {
      expect(getTrendDirection(10)).toBe('up');
    });

    test('returns down for negative delta', () => {
      expect(getTrendDirection(-10)).toBe('down');
    });

    test('returns neutral for zero delta', () => {
      expect(getTrendDirection(0)).toBe('neutral');
    });

    test('with lowerIsBetter=true, returns up for negative delta', () => {
      expect(getTrendDirection(-10, true)).toBe('up');
    });

    test('with lowerIsBetter=true, returns down for positive delta', () => {
      expect(getTrendDirection(10, true)).toBe('down');
    });

    test('with lowerIsBetter=true, returns neutral for zero delta', () => {
      expect(getTrendDirection(0, true)).toBe('neutral');
    });
  });

  describe('isTrendPositive', () => {
    test('returns true for positive delta', () => {
      expect(isTrendPositive(10)).toBe(true);
    });

    test('returns false for negative delta', () => {
      expect(isTrendPositive(-10)).toBe(false);
    });

    test('returns false for zero delta', () => {
      expect(isTrendPositive(0)).toBe(false);
    });

    test('with lowerIsBetter=true, returns true for negative delta', () => {
      expect(isTrendPositive(-10, true)).toBe(true);
    });

    test('with lowerIsBetter=true, returns false for positive delta', () => {
      expect(isTrendPositive(10, true)).toBe(false);
    });
  });

  describe('formatMinutes', () => {
    test('formats minutes under 60 as just minutes', () => {
      expect(formatMinutes(45)).toBe('45m');
    });

    test('formats exactly 60 minutes as 1h', () => {
      expect(formatMinutes(60)).toBe('1h');
    });

    test('formats hours and minutes correctly', () => {
      expect(formatMinutes(90)).toBe('1h 30m');
      expect(formatMinutes(150)).toBe('2h 30m');
    });

    test('formats hours without minutes when even hours', () => {
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(180)).toBe('3h');
    });

    test('rounds minutes to nearest integer', () => {
      expect(formatMinutes(45.6)).toBe('46m');
      expect(formatMinutes(45.4)).toBe('45m');
    });

    test('formats 0 minutes', () => {
      expect(formatMinutes(0)).toBe('0m');
    });
  });

  describe('formatHours', () => {
    test('formats hours with one decimal place', () => {
      expect(formatHours(2.5)).toBe('2.5h');
    });

    test('formats whole hours with .0 suffix', () => {
      expect(formatHours(3)).toBe('3.0h');
    });

    test('formats small fractions', () => {
      expect(formatHours(0.5)).toBe('0.5h');
    });
  });

  describe('formatPercent', () => {
    test('formats percentage with % symbol', () => {
      expect(formatPercent(75)).toBe('75%');
    });

    test('rounds to nearest integer', () => {
      expect(formatPercent(75.6)).toBe('76%');
      expect(formatPercent(75.4)).toBe('75%');
    });

    test('handles 0 and 100', () => {
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(100)).toBe('100%');
    });
  });

  describe('formatDelta', () => {
    test('formats positive delta with + sign', () => {
      expect(formatDelta(15)).toBe('+15%');
    });

    test('formats negative delta with - sign', () => {
      expect(formatDelta(-10)).toBe('-10%');
    });

    test('formats zero delta with + sign', () => {
      expect(formatDelta(0)).toBe('+0%');
    });
  });
});
