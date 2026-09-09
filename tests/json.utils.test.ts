import { describe, it, expect } from 'vitest';
import { safeJsonParse, safeJsonStringify, isValidJson } from '../lib/utils/json.utils.ts';

describe('json.utils', () => {
  describe('safeJsonParse', () => {
    interface User {
      id: number;
      name: string;
    }

    it('should parse valid JSON and cast to type T', () => {
      const jsonStr = '{"id": 1, "name": "Alice"}';
      const result = safeJsonParse<User>(jsonStr);

      expect(result).toEqual({ id: 1, name: 'Alice' });
      expect(result?.name).toBe('Alice');
    });

    it('should return undefined when parsing invalid JSON without fallback', () => {
      const invalidJson = '{ bad json }';
      const result = safeJsonParse<User>(invalidJson);

      expect(result).toBeUndefined();
    });

    it('should return fallback value when parsing invalid JSON with fallback', () => {
      const invalidJson = '{ bad json }';
      const fallback: User = { id: 0, name: 'Guest' };
      const result = safeJsonParse<User>(invalidJson, fallback);

      expect(result).toEqual(fallback);
      expect(result.name).toBe('Guest');
    });

    it('should handle non-string inputs safely', () => {
      expect(safeJsonParse(null)).toBeUndefined();
      expect(safeJsonParse(undefined)).toBeUndefined();
      expect(safeJsonParse(null, { default: true })).toEqual({ default: true });
    });

    it('should correctly parse primitives (boolean, number, null)', () => {
      expect(safeJsonParse<boolean>('true')).toBe(true);
      expect(safeJsonParse<number>('42')).toBe(42);
      expect(safeJsonParse('null')).toBeNull();
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify standard objects', () => {
      const data = { a: 1, b: 'test' };
      expect(safeJsonStringify(data)).toBe('{"a":1,"b":"test"}');
    });

    it('should support formatting space in options', () => {
      const data = { a: 1 };
      const result = safeJsonStringify(data, { space: 2 });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('should support replacer and space', () => {
      const data = { a: 1, b: 2 };
      const result = safeJsonStringify(data, { replacer: ['a'], space: 2 });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('should not throw on circular references and return undefined or fallback', () => {
      const circular: Record<string, unknown> = { name: 'loop' };
      circular.self = circular;

      expect(safeJsonStringify(circular)).toBeUndefined();
      expect(safeJsonStringify(circular, '{"error":"circular"}')).toBe('{"error":"circular"}');
      expect(safeJsonStringify(circular, { space: 2, fallback: '{"error":"circular"}' })).toBe(
        '{"error":"circular"}',
      );
    });

    it('should not throw on BigInt and return fallback', () => {
      const objWithBigInt = { id: BigInt(123) };

      expect(safeJsonStringify(objWithBigInt)).toBeUndefined();
      expect(safeJsonStringify(objWithBigInt, '{"fallback":true}')).toBe('{"fallback":true}');
    });
  });

  describe('isValidJson', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJson('{"key": "value"}')).toBe(true);
      expect(isValidJson('[1, 2, 3]')).toBe(true);
      expect(isValidJson('"string"')).toBe(true);
      expect(isValidJson('123')).toBe(true);
    });

    it('should return false for invalid JSON or empty inputs', () => {
      expect(isValidJson('{bad json}')).toBe(false);
      expect(isValidJson('')).toBe(false);
      expect(isValidJson('   ')).toBe(false);
      expect(isValidJson(null)).toBe(false);
      expect(isValidJson(undefined)).toBe(false);
    });
  });

  describe('aliases', () => {
    it('should have working aliases', () => {
      expect(safeJsonParse('{"ok":true}')).toEqual({ ok: true });
      expect(safeJsonParse('{"ok":true}')).toEqual({ ok: true });
      expect(safeJsonStringify({ ok: true })).toBe('{"ok":true}');
      expect(safeJsonStringify({ ok: true })).toBe('{"ok":true}');
    });
  });
});
