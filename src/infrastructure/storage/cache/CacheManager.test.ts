import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from './CacheManager';

describe('CacheManager Singleton', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = CacheManager.getInstance();
  });

  it('should return the same instance', () => {
    const instance1 = CacheManager.getInstance();
    const instance2 = CacheManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create and retrieve caches by type', () => {
    const cache1 = cacheManager.getCache<string>('modules', 2);
    const cache2 = cacheManager.getCache<string>('modules');
    expect(cache1).toBe(cache2);

    const cache3 = cacheManager.getCache<number>('terms', 3);
    expect(cache3).not.toBe(cache1);
  });

  it('should clear caches', () => {
    const cache = cacheManager.getCache<string>('modules');
    cache.set('a', 'A');
    expect(cache.size()).toBe(1);

    cacheManager.clearCache('modules');
    expect(cache.size()).toBe(0);

    cache.set('b', 'B');
    cacheManager.clearAllCaches();
    // After clearAllCaches, the cache instance is removed from the map,
    // but the old cache instance still holds the item.
    // So size() will still be 1 on the old instance.
    // To test properly, we should get a new cache instance and check size.
    const newCache = cacheManager.getCache<string>('modules');
    expect(newCache.size()).toBe(0);
  });

  // Verification 1: Test that items can be added to and retrieved from the cache
  it('should add and retrieve items from the cache', () => {
    const cache = cacheManager.getCache<string>('testCache', 3);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  // Verification 2: Test that LRU eviction works correctly
  it('should evict least recently used item when cache is full', () => {
    const cache = cacheManager.getCache<string>('testCacheLRU', 2);
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.get('a'); // Access 'a' to make it recently used
    cache.set('c', 'C'); // This should evict 'b'

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  // Verification 3: Test that TTL works: expired item treated as cache miss
  it('should treat expired items as cache miss', async () => {
    const cache = cacheManager.getCache<string>('testCacheTTL', 3);
    cache.set('temp', 'data', 100); // TTL 100ms
    expect(cache.get('temp')).toBe('data');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(cache.get('temp')).toBeUndefined();
  });
});
