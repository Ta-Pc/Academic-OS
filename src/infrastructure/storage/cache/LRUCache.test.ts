import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from './LRUCache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3);
  });

  it('should set and get items', () => {
    cache.set('a', 'A');
    expect(cache.get('a')).toBe('A');
  });

  it('should evict least recently used item when max size exceeded', () => {
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');
    cache.get('a'); // Access 'a' to make it recently used
    cache.set('d', 'D'); // This should evict 'b'

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
  });

  it('should respect TTL and expire items', () => {
    cache.set('a', 'A', 100); // TTL 100ms
    expect(cache.get('a')).toBe('A');

    // Wait 150ms
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(cache.get('a')).toBeUndefined();
        resolve(null);
      }, 150);
    });
  });

  it('should delete items', () => {
    cache.set('a', 'A');
    expect(cache.has('a')).toBe(true);
    cache.delete('a');
    expect(cache.has('a')).toBe(false);
  });

  it('should clear all items', () => {
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
